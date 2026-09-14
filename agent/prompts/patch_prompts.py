"""Prompt templates for the patch generator node."""

import json


def build_patch_prompt(
    compact_issue: dict,
    compact_plan: dict,
    previous_patch: str,
    human_feedback: str | None,
    execution_feedback: str,
    other_files: list[str],
    file_path: str,
    current_code: str,
    is_likely: bool,
) -> str:
    """Constructs prompt instructing the LLM to return updated content for a target file."""
    return f"""\
You are an open-source code repair agent.

Your task is to return the COMPLETE updated content of exactly one source file.

ORIGINAL ISSUE:
{json.dumps(compact_issue, indent=2)}

PLANNER ANALYSIS:
{json.dumps(compact_plan, indent=2)}

PREVIOUS PATCH SNIPPET:
{previous_patch if previous_patch else "None"}

HUMAN REVIEW FEEDBACK:
{human_feedback if human_feedback else "None"}

PREVIOUS EXECUTION FAILURE:
{execution_feedback[:600] if execution_feedback else "None"}

OTHER AVAILABLE REPOSITORY FILES:
{json.dumps(other_files) if other_files else "None"}

TARGET FILE:
{file_path}

CURRENT FILE CONTENT:
```
{current_code}
```

ROLE OF THIS FILE:
- Target File: {file_path}
- Listed in likely_files_to_change: {is_likely}

INSTRUCTIONS:
- Follow the ORIGINAL ISSUE exactly.
- The ORIGINAL ISSUE is the authoritative specification.
- If TARGET FILE is a core source/implementation file (not a test file) and contains the logic bug, you MUST set `should_modify` to true and modify the source code to fix the bug!
- If TARGET FILE is a test file and a test_plan exists, you MUST set `should_modify` to true and add/update test cases!
- Preserve exact exception types requested by the issue.
- Preserve exact exception messages requested by the issue.
- Never invent custom exceptions unless explicitly requested.
- Use PREVIOUS EXECUTION FAILURE to correct the previous attempt.
- If previous failure indicates an acceptance error (e.g. "returned a string instead of raising an exception" or "returned wrong message"), OVERRIDE any conflicting planner wording. Update both implementation code and test code to strictly match what ORIGINAL ISSUE / PREVIOUS EXECUTION FAILURE required!
- If previous failure states "Patch must modify at least one non-test/source file", and this TARGET FILE is a source file, you MUST set `should_modify` to true!
- Ensure test file assertions match the updated implementation code so pytest passes.

If HUMAN REVIEW FEEDBACK is present:
- Treat it as the highest-priority instruction.
- Preserve all correct changes from the previous patch.
- Modify only the parts necessary to satisfy the review.
- Do not rewrite unrelated code.

OUTPUT RULES:
- Return the complete updated source code in the `content` field.
- `content` must contain source code only.
- Do not include markdown code fences in `content`.
- Do not include XML tags.
- Do not include explanations inside `content`.
- Do not return a unified diff.
- Set `should_modify` to true when the target file requires changes.
- Set `should_modify` to false only when no modification is required.
"""
