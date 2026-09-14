"""Prompt templates for the acceptance validator node."""

import json


def build_acceptance_prompt(
    compact_issue: dict,
    truncated_patch: str,
    truncated_test: dict,
) -> str:
    """Constructs prompt for validating whether a generated patch satisfies acceptance criteria."""
    return f"""You are a strict software patch acceptance reviewer.

Determine whether the final patch satisfies the ORIGINAL ISSUE exactly.

ORIGINAL ISSUE:
{json.dumps(compact_issue, indent=2)}

FINAL PATCH:
{truncated_patch}

TEST RESULT:
{json.dumps(truncated_test, indent=2)}

REVIEW RULES:
- The ORIGINAL ISSUE is the authoritative specification.
- Verify exact exception types or messages ONLY if explicitly requested by the ORIGINAL ISSUE.
- If the ORIGINAL ISSUE does not specify a specific exception type or message, any standard appropriate fix is ACCEPTED.
- Passing tests with a clean fix that solves the issue without violating explicit requirements should be ACCEPTED.
- Do NOT invent additional requirements or unstated constraints not present in the ORIGINAL ISSUE.
- Judge ONLY requirements explicitly stated in the ORIGINAL ISSUE."""
