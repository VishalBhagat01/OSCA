import json

from pydantic import BaseModel, Field

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event

class AcceptanceResult(BaseModel):
    accepted: bool

    reason: str

    violations: list[str] = Field(
        default_factory=list
    )


acceptance_llm = llm.with_structured_output(
    AcceptanceResult
)


def acceptance_validator_node(
    state: AgentState
) -> dict:
    issue = state.get("issue", {})
    patch = state.get("patch", "")
    test_result = state.get("test_result", {})

    prompt = f"""
        You are a strict software patch acceptance reviewer.

        Your task is to determine whether the final patch satisfies
        the ORIGINAL ISSUE exactly.

        ORIGINAL ISSUE:
        {json.dumps(issue, indent=2)}

        FINAL PATCH:
        {patch}

        TEST RESULT:
        {json.dumps(test_result, indent=2)}

        REVIEW RULES:
        - The ORIGINAL ISSUE is the authoritative specification.
        - Verify exact exception types or messages ONLY if explicitly requested by the ORIGINAL ISSUE.
        - If the ORIGINAL ISSUE does not specify a specific exception type or message, any standard appropriate fix (e.g. standard exception or return value) that resolves the issue is ACCEPTED.
        - Passing tests with a clean fix that solves the issue without violating explicit requirements should be ACCEPTED.
        - Do NOT invent additional requirements or unstated constraints not present in the ORIGINAL ISSUE.
        - Do NOT reject a patch for handling edge cases in a standard way if the ORIGINAL ISSUE did not forbid it.
        - Judge ONLY requirements explicitly stated in the ORIGINAL ISSUE.

        Examples:

        Example 1 (Explicit constraint violated):
        Issue explicitly requires: raise CustomFormatError("Invalid string format")
        Patch uses: raise ValueError("Invalid string format")
        Result: accepted = false
        Reason: The patch uses ValueError instead of the explicitly required CustomFormatError.

        Example 2 (General bug fix with no explicit exception specified):
        Issue describes: "Function fails on zero or negative input"
        Patch adds proper check for non-positive input and handles it gracefully, and all tests pass.
        Result: accepted = true
        Reason: The patch fixes the issue and does not violate any explicit requirement in the issue.
    """

    result = acceptance_llm.invoke(prompt)

    if not result.accepted:
        updated_state = {
            **state,
            "acceptance_passed": False,
            "acceptance_error": result.reason,
            "acceptance_violations": result.violations,
        }

        updated_state["retry_trace"] = add_retry_trace(
            updated_state,
            stage="acceptance",
            error=result.reason,
        )

        updated_state["execution_trace"] = (
            add_execution_event(
                updated_state,
                node="acceptance_validator",
                status="failed",
                message=result.reason,
                details={
                    "violations": result.violations,
                },
            )
        )

        return updated_state

    updated_state = {
        **state,
        "acceptance_passed": True,
        "acceptance_error": None,
        "acceptance_violations": [],
    }

    updated_state["execution_trace"] = (
        add_execution_event(
            updated_state,
            node="acceptance_validator",
            status="success",
            message=(
                "Patch satisfies the original issue "
                "requirements."
            ),
            details={
                "violations": [],
            },
        )
    )

    return updated_state