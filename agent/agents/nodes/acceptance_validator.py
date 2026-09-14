"""Acceptance validator node: verifies patch against the original issue acceptance criteria."""

from pydantic import BaseModel, Field

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event, emit_trace_event
from prompts.acceptance_prompts import build_acceptance_prompt
from constants import (
    NODE_ACCEPTANCE_VALIDATOR,
    STATUS_RUNNING,
    STATUS_SUCCESS,
    STATUS_FAILED,
)


class AcceptanceResult(BaseModel):
    accepted: bool
    reason: str
    violations: list[str] = Field(default_factory=list)


_acceptance_llm = None


def get_acceptance_llm():
    """Lazily initialize acceptance LLM to avoid import-time side effects."""
    global _acceptance_llm
    if _acceptance_llm is None:
        _acceptance_llm = llm.with_structured_output(AcceptanceResult)
    return _acceptance_llm


def acceptance_validator_node(state: AgentState) -> dict:
    """LangGraph node: validate patch against issue acceptance criteria."""

    emit_trace_event(
        state,
        node=NODE_ACCEPTANCE_VALIDATOR,
        status=STATUS_RUNNING,
        message="Validating solution against original issue acceptance criteria with LLM...",
    )

    issue = state.get("issue", {})
    patch = state.get("patch", "")
    test_result = state.get("test_result", {})

    # Truncate large fields to reduce prompt tokens
    truncated_patch = patch[:2000] + ("\n... [truncated]" if len(patch) > 2000 else "")
    truncated_test = {
        "success": test_result.get("success"),
        "stdout": (test_result.get("stdout", "") or "")[:500],
        "return_code": test_result.get("return_code"),
    }
    compact_issue = {
        "number": issue.get("number", 0),
        "title": issue.get("title", ""),
        "body": (issue.get("body", "") or "")[:800],
        "labels": issue.get("labels", []),
    }

    prompt = build_acceptance_prompt(
        compact_issue=compact_issue,
        truncated_patch=truncated_patch,
        truncated_test=truncated_test,
    )

    result = get_acceptance_llm().invoke(prompt)

    if not result.accepted:
        retry_trace = add_retry_trace(state, stage="acceptance", error=result.reason)
        execution_trace = add_execution_event(
            state,
            node=NODE_ACCEPTANCE_VALIDATOR,
            status=STATUS_FAILED,
            message=result.reason,
            details={"violations": result.violations},
        )

        return {
            "acceptance_passed": False,
            "acceptance_error": result.reason,
            "acceptance_violations": result.violations,
            "retry_trace": retry_trace,
            "execution_trace": execution_trace,
        }

    execution_trace = add_execution_event(
        state,
        node=NODE_ACCEPTANCE_VALIDATOR,
        status=STATUS_SUCCESS,
        message="Patch satisfies the original issue requirements.",
        details={"violations": []},
    )

    return {
        "acceptance_passed": True,
        "acceptance_error": None,
        "acceptance_violations": [],
        "execution_trace": execution_trace,
    }