"""Planner node: analyzes the issue, identifies root cause, and generates execution plan."""

import json
import logging
import re
from typing import Any

from agents.nodes.state import AgentState
from llm.llm_provider import generate_response
from agents.utils.execution_trace import add_execution_event, emit_trace_event
from prompts.planner_prompts import build_planner_prompt
from git_utils.ast_skeletonizer import skeletonize_code
from constants import NODE_PLANNER, STATUS_RUNNING, STATUS_SUCCESS

logger = logging.getLogger("osa.agent.planner")


def extract_json(raw_response: str, issue: dict = None, relevant_files: list = None) -> dict:
    """Resilient JSON extractor with sanitization and regex fallback."""
    cleaned = raw_response.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    # Find outermost { ... }
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    json_candidate = match.group(0) if match else cleaned

    # Attempt 1: Standard parse
    try:
        return json.loads(json_candidate)
    except Exception:
        pass

    # Attempt 2: Remove trailing commas before } or ]
    try:
        sanitized = re.sub(r",\s*([\]}])", r"\1", json_candidate)
        return json.loads(sanitized)
    except Exception:
        pass

    # Attempt 3: Sanitize literal control characters/newlines in string values
    try:
        fixed_lines = list(json_candidate.splitlines())
        sanitized2 = re.sub(r",\s*([\]}])", r"\1", "\n".join(fixed_lines))
        return json.loads(sanitized2)
    except Exception:
        pass

    # Attempt 4: Robust Regex Field Extraction (Never fails the pipeline)
    logger.warning("[Planner] Standard JSON parse failed; executing resilient regex fallback.")
    issue = issue or {}
    relevant_files = relevant_files or []

    # Extract issue_type
    type_match = re.search(r'"issue_type"\s*:\s*"([^"]+)"', raw_response)
    issue_type = type_match.group(1) if type_match else "actionable_bug"

    # Extract summary
    sum_match = re.search(r'"summary"\s*:\s*"([^"\n\r]+)"', raw_response)
    summary = sum_match.group(1) if sum_match else issue.get("title", "Fix identified issue")

    # Extract root_cause_hypothesis
    rc_match = re.search(r'"root_cause_hypothesis"\s*:\s*"([^"\n\r]+)"', raw_response)
    root_cause = rc_match.group(1) if rc_match else f"Resolution required for {issue.get('title', 'bug')}"

    # Extract likely files
    file_paths = re.findall(r'"path"\s*:\s*"([^"]+)"', raw_response)
    if not file_paths and relevant_files:
        file_paths = [
            f["path"] if isinstance(f, dict) else f
            for f in relevant_files[:3]
        ]
    likely_files = [{"path": p, "reason": "Target file for fix"} for p in file_paths]

    # Extract implementation steps
    steps = re.findall(r'"([^"\n\r]{10,200})"', raw_response)
    impl_plan = [s for s in steps if not s.endswith(".py") and s not in (issue_type, summary, root_cause)][:4]
    if not impl_plan:
        impl_plan = [f"Apply fix for {issue.get('title', 'issue')}"]

    return {
        "issue_type": issue_type,
        "summary": summary,
        "root_cause_hypothesis": root_cause,
        "likely_files_to_change": likely_files,
        "implementation_plan": impl_plan,
        "test_plan": ["Run automated test suite to verify fix"],
        "difficulty": "easy",
        "confidence": 0.85,
        "needs_human_clarification": False,
        "clarifying_questions": [],
    }


def build_prompt(state: AgentState) -> dict:
    raw_issue = state.get("issue", {})
    compact_issue = {
        "number": raw_issue.get("number"),
        "title": raw_issue.get("title", ""),
        "body": (raw_issue.get("body") or "")[:1200],
    }
    codebase = state.get("codebase", {})
    files = []
    for file in codebase.get("relevant_files", [])[:3]:
        path = file.get("path", "")
        raw_code = file.get("content", "")
        skeleton = skeletonize_code(path, raw_code) if raw_code else ""
        if len(skeleton) > 800:
            skeleton = skeleton[:800] + "\n... [truncated]"
        files.append({
            "path": path,
            "content": skeleton,
        })

    human_feedback = state.get("feedback")
    previous_result = state.get("previous_result")
    previous_analysis = (
        previous_result.get("analysis", {})
        if isinstance(previous_result, dict)
        else {}
    )

    # Truncate file contents in prompt to stay within token budget
    files_json = json.dumps(files, indent=2)
    if len(files_json) > 3500:
        files_json = files_json[:3500] + "\n... [truncated]"

    prompt = build_planner_prompt(
        compact_issue=compact_issue,
        files_json=files_json,
        previous_analysis=previous_analysis,
        human_feedback=human_feedback,
    )

    return {"prompt": prompt}


def classify_and_plan(
    state: AgentState | dict[str, Any],
    prompt: str | None = None,
) -> dict[str, Any]:
    prompt_to_use = prompt or state.get("prompt", "")
    raw_response = generate_response(prompt_to_use)

    issue = state.get("issue", {})
    relevant_files = state.get("codebase", {}).get("relevant_files", [])

    try:
        analysis = extract_json(raw_response, issue=issue, relevant_files=relevant_files)
    except Exception:
        analysis = {
            "issue_type": "actionable_bug",
            "summary": issue.get("title", "Fix reported issue"),
            "root_cause_hypothesis": f"Resolution required for {issue.get('title', 'bug')}",
            "likely_files_to_change": [
                {"path": f["path"], "reason": "Identified relevant file"}
                for f in relevant_files[:2]
            ] if relevant_files else [],
            "implementation_plan": ["Implement fix based on issue requirements"],
            "test_plan": ["Run test suite to verify fix"],
            "difficulty": "medium",
            "confidence": 0.7,
            "needs_human_clarification": False,
            "clarifying_questions": [],
        }

    return {"analysis": analysis}


def should_generate_patch(state: AgentState) -> str:
    analysis = state.get("plan") or state.get("analysis") or {}

    actionable_types = {"actionable_bug", "actionable_feature"}

    if analysis.get("issue_type") not in actionable_types:
        return "finish"

    if analysis.get("needs_human_clarification", False):
        return "finish"

    return "generate_patch"


def planner_node(state: AgentState) -> dict:
    """LangGraph node: analyze issue and return only changed keys."""
    emit_trace_event(
        state,
        node=NODE_PLANNER,
        status=STATUS_RUNNING,
        message="Analyzing issue requirements and formulating implementation plan with LLM...",
        details={"issue_number": state.get("issue", {}).get("number")},
    )

    prompt_state = build_prompt(state)
    prompt = prompt_state.get("prompt", "")
    analysis_state = classify_and_plan(state, prompt=prompt)
    plan = analysis_state.get("analysis", {})

    return {
        "plan": plan,
        "analysis": plan,
        "execution_trace": add_execution_event(
            state,
            node=NODE_PLANNER,
            status=STATUS_SUCCESS,
            message="Issue analyzed and implementation plan created.",
            details={
                "issue_type": plan.get("issue_type"),
                "difficulty": plan.get("difficulty"),
                "confidence": plan.get("confidence"),
            },
        ),
    }