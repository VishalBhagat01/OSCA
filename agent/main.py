"""FastAPI service entrypoint for the Sentra AI (OSA) Agent."""

import logging
from typing import Any, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import settings
from git_utils.repo_info import repo_info
from git_utils.issue_details import get_issue_details
from agents.nodes.draft_pr import generate_pr_draft
from services.context_service import collect_and_analyze_context
from llm.llm_provider import get_active_provider_name, reset_fallback

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("osa.agent")
logger.info("LLM provider: %s", get_active_provider_name())

app = FastAPI(title="Sentra AI Agent Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-api-key"],
)


@app.middleware("http")
async def require_agent_api_key(request: Request, call_next):
    configured_key = settings.agent_api_key
    if configured_key and request.url.path != "/" and request.headers.get("x-api-key") != configured_key:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized."})
    return await call_next(request)


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------

class RepoURL(BaseModel):
    repo_url: str


class AnalyzeIssueRequest(BaseModel):
    repo_url: str
    issue_number: int = 0
    issue_title: str
    issue_body: str = ""
    labels: List[str] = Field(default_factory=list)
    comments: List[str] = Field(default_factory=list)
    retry: bool = False
    feedback: Optional[str] = None
    previous_result: Optional[Any] = None
    callback_url: Optional[str] = None
    callback_token: Optional[str] = None


class IssueDetailsRequest(BaseModel):
    owner: str
    repo: str
    issue_number: int


class DraftPRRequest(BaseModel):
    repo_url: str = ""
    issue_number: int = 0
    issue_title: str
    issue_body: str = ""
    patch: str = ""
    changed_files: List[str] = Field(default_factory=list)
    human_feedback: Optional[str] = None
    test_summary: Optional[str] = None
    is_draft: bool = True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {"message": "Agent Running"}


@app.post("/repo-info")
def get_repo_info(payload: RepoURL):
    try:
        return repo_info(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/issue-details")
def issue_details(payload: IssueDetailsRequest):
    try:
        return get_issue_details(
            owner=payload.owner,
            repo=payload.repo,
            issue_number=payload.issue_number,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/draft-pr")
def draft_pr(payload: DraftPRRequest):
    try:
        metadata = generate_pr_draft(
            issue_number=payload.issue_number,
            issue_title=payload.issue_title,
            issue_body=payload.issue_body,
            changed_files=payload.changed_files,
            patch=payload.patch,
            human_feedback=payload.human_feedback,
            test_summary=payload.test_summary,
            is_draft=payload.is_draft,
        )
        return {
            "success": True,
            "pr_metadata": metadata,
        }
    except Exception as e:
        logger.exception("draft-pr failed for issue #%d", payload.issue_number)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-issue")
def analyze_selected_issue(data: AnalyzeIssueRequest):
    try:
        # Each pipeline run starts fresh — give Gemini a chance before falling back
        reset_fallback()
        return collect_and_analyze_context(data)
    except Exception as error:
        logger.exception("analyze-issue failed for %s#%d", data.repo_url, data.issue_number)
        raise HTTPException(status_code=500, detail=str(error))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["repos/*", "*.patch", ".git/*"],
    )
