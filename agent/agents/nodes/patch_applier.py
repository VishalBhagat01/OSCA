import os
from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event
from agents.utils.fuzzy_patch import apply_fuzzy_patch


def patch_applier_node(state: AgentState) -> dict:
    """LangGraph node: apply patch to repo with fuzzy alignment fallback."""

    repo_path = state["repo_path"]
    proposed_patch = state.get("proposed_patch", {})
    patch = state.get("patch") or proposed_patch.get("diff", "")

    success, message = apply_fuzzy_patch(repo_path, patch)

    if not success:
        error = f"Patch cannot be applied cleanly: {message}"
        return {
            "patch_applied": False,
            "patch_error": message,
            "validation_passed": False,
            "validation_error": error,
            "retry_trace": add_retry_trace(state, stage="patch_apply", error=error),
            "execution_trace": add_execution_event(
                state,
                node="patch_applier",
                status="failed",
                message=error,
                details={},
            ),
        }

    return {
        "patch_applied": True,
        "patch_error": None,
        "execution_trace": add_execution_event(
            state,
            node="patch_applier",
            status="success",
            message=message or "Patch applied successfully.",
            details={},
        ),
    }