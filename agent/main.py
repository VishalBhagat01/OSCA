from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List

from git_utils.repo_info import repo_info
from git_utils.clone_repo import clone_or_update_repo
from git_utils.repo_scanner import scan_repository
from git_utils.file_selector import extract_keywords, select_relevant_files
from agents.issue_analyzer import analyze_issue
from git_utils.issue_details import get_issue_details

app = FastAPI()


class RepoURL(BaseModel):
    repo_url: str


class AnalyzeIssueRequest(BaseModel):
    repo_url: str
    issue_number: int = 0
    issue_title: str
    issue_body: str = ""
    labels: List[str] = Field(default_factory=list)
    comments: List[str] = Field(default_factory=list)

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
        }
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