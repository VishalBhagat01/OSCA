"""Context collection service for repository cloning, scanning, and issue analysis."""

import logging
from urllib.parse import urlparse

from config import settings
from constants import (
    NODE_WORKSPACE,
    NODE_CODEBASE_SCANNER,
    STATUS_RUNNING,
    STATUS_SUCCESS,
)
from git_utils.clone_repo import clone_or_update_repo
from git_utils.repo_scanner import scan_repository
from git_utils.file_selector import extract_keywords, select_relevant_files
from agents.issue_analyzer import analyze_issue
from agents.utils.execution_trace import emit_trace_event

logger = logging.getLogger("osa.agent.context")


def validate_callback_url(callback_url: str | None) -> None:
    """Validate that the callback URL is well-formed and targets an allowed host."""
    if not callback_url:
        return

    parsed = urlparse(callback_url)
    if parsed.scheme not in {"http", "https"} or parsed.hostname not in settings.allowed_callback_hosts:
        raise ValueError("callback_url host is not allowed")


def collect_and_analyze_context(data) -> dict:
    """Orchestrates git cloning, AST scanning, keyword matching, and issue analysis."""
    validate_callback_url(data.callback_url)

    context_state = {
        "callback_url": data.callback_url,
        "callback_token": data.callback_token,
    }

    # 1. Clone or update repository
    emit_trace_event(
        context_state,
        node=NODE_WORKSPACE,
        status=STATUS_RUNNING,
        message=f"Cloning repository: {data.repo_url}...",
    )
    logger.info("Cloning/updating repository: %s", data.repo_url)
    repo_path = clone_or_update_repo(data.repo_url)
    emit_trace_event(
        context_state,
        node=NODE_WORKSPACE,
        status=STATUS_SUCCESS,
        message="Repository cloned and verified cleanly.",
    )

    # 2. Scan codebase structure
    emit_trace_event(
        context_state,
        node=NODE_CODEBASE_SCANNER,
        status=STATUS_RUNNING,
        message="Scanning codebase structure and matching issue keywords...",
    )
    repo_data = scan_repository(repo_path)

    # 3. Extract keywords from issue title and body
    keywords = extract_keywords(data.issue_title, data.issue_body)

    # 4. Find relevant files matching issue keywords
    relevant_files = select_relevant_files(
        repo_path=repo_path,
        file_tree=repo_data["file_tree"],
        keywords=keywords,
    )
    emit_trace_event(
        context_state,
        node=NODE_CODEBASE_SCANNER,
        status=STATUS_SUCCESS,
        message=f"Codebase scan complete. Found {len(relevant_files)} relevant files for issue #{data.issue_number}.",
        details={"relevant_files": [f["path"] for f in relevant_files]},
    )
    logger.info("Found %d relevant files for issue #%d", len(relevant_files), data.issue_number)

    # 5. Build issue payload
    issue_data = {
        "number": data.issue_number,
        "title": data.issue_title,
        "body": data.issue_body,
        "labels": data.labels,
        "comments": data.comments,
    }

    # 6. Build codebase context
    codebase_data = {
        "important_files": repo_data["important_files"],
        "relevant_files": relevant_files,
        "file_tree": repo_data["file_tree"],
    }

    # 7. Analyze issue through LangGraph pipeline
    agent_result = analyze_issue(
        issue=issue_data,
        codebase={**codebase_data, "repo_path": repo_path},
        retry=data.retry,
        feedback=data.feedback,
        previous_result=data.previous_result,
        callback_url=data.callback_url,
        callback_token=data.callback_token,
    )

    return {
        "repo_path": repo_path,
        "keywords": keywords,
        "important_files_found": list(repo_data["important_files"].keys()),
        "relevant_files": [
            {"path": file["path"], "score": file["score"]}
            for file in relevant_files
        ],
        "analysis": agent_result["analysis"],
        "execution_trace": agent_result["execution_trace"],
        "proposed_patch": agent_result["proposed_patch"],
        "pr_metadata": agent_result.get("pr_metadata", {}),
    }
