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
        - Passing tests does NOT automatically mean the patch is correct.
        - Verify exact exception types requested by the issue.
        - Verify exact exception messages requested by the issue.
        - Verify explicitly requested behavior.
        - Verify explicitly requested files or tests when stated.
        - Detect when the implementation and generated tests agree with
        each other but violate the original issue.
        - Do not accept alternative behavior when the issue specifies
        exact behavior.
        - Do not invent additional requirements.
        - Judge only requirements explicitly stated in the original issue.

        Examples:

        Issue requires:
        raise ValueError("Cannot divide by zero")

        Patch uses:
        raise ZeroDivisionError("Cannot divide by zero")

        Result:
        accepted = false

        Reason:
        The patch uses ZeroDivisionError instead of the explicitly
        required ValueError.

        Another example:

        Issue requires:
        is_palindrome("Madam") returns True

        Patch performs case-insensitive comparison and tests pass.

        Result:
        accepted = true
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