from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import os
from pydantic import BaseModel, Field
from typing import Any, List , Optional

from git_utils.repo_info import repo_info
from git_utils.clone_repo import clone_or_update_repo
from git_utils.repo_scanner import scan_repository
from git_utils.file_selector import extract_keywords, select_relevant_files
from agents.issue_analyzer import analyze_issue
from git_utils.issue_details import get_issue_details

app = FastAPI()
allowed_origins = [origin.strip() for origin in os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["content-type", "x-api-key"],
)


@app.middleware("http")
async def require_agent_api_key(request: Request, call_next):
    configured_key = os.getenv("AGENT_API_KEY")
    if configured_key and request.url.path != "/" and request.headers.get("x-api-key") != configured_key:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized."})
    return await call_next(request)


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
            issue_number=payload.issue_number
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def collect_context(data: AnalyzeIssueRequest):
    if data.callback_url:
        parsed_callback = urlparse(data.callback_url)
        allowed_hosts = {host.strip() for host in os.getenv("CALLBACK_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")}
        if parsed_callback.scheme not in {"http", "https"} or parsed_callback.hostname not in allowed_hosts:
            raise ValueError("callback_url host is not allowed")
    # 1. Clone repo first time, otherwise update cached repo
    repo_path = clone_or_update_repo(data.repo_url)

    # 2. Scan codebase
    repo_data = scan_repository(repo_path)

    # 3. Extract issue keywords
    keywords = extract_keywords(data.issue_title, data.issue_body)

    # 4. Find relevant source files
    relevant_files = select_relevant_files(
        repo_path=repo_path,
        file_tree=repo_data["file_tree"],
        keywords=keywords
    )

    # 5. Build issue context
    issue_data = {
        "number": data.issue_number,
        "title": data.issue_title,
        "body": data.issue_body,
        "labels": data.labels,
        "comments": data.comments
    }

    # 6. Build codebase context
    codebase_data = {
        "important_files": repo_data["important_files"],
        "relevant_files": relevant_files,
        "file_tree": repo_data["file_tree"]
    }

    # 7. Analyze issue + codebase together
    agent_result = analyze_issue(
        issue=issue_data,
        codebase={
            **codebase_data,
            "repo_path": repo_path
        },
        retry=data.retry,
        feedback=data.feedback,
        previous_result=data.previous_result,
        callback_url=data.callback_url,
        callback_token=data.callback_token,
    )

    # Do not return complete file contents yet.
    # Returning all source content makes Swagger responses very large.
    return {
        "repo_path": repo_path,
        "keywords": keywords,
        "important_files_found": list(
            repo_data["important_files"].keys()
        ),
        "relevant_files": [
            {
                "path": file["path"],
                "score": file["score"]
            }
            for file in relevant_files
        ],
        "analysis": agent_result["analysis"],
        "execution_trace": agent_result["execution_trace"],
        "proposed_patch": agent_result["proposed_patch"]
    }


@app.post("/analyze-issue")
def analyze_selected_issue(data: AnalyzeIssueRequest):
    try:
        return collect_context(data)
    except Exception as error:
        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
