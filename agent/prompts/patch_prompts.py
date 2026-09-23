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
    """Constructs prompt instructing the LLM to return updated content for a target file.

    Structured with static instructions first to maximize provider-side prefix prompt caching.
    """
    # Bound current_code to prevent token exhaustion on huge files
    if len(current_code) > 10000:
        code_view = current_code[:10000] + "\n\n# ... [remaining lines truncated for token efficiency]"
    else:
        code_view = current_code

    return f"""\
You are an open-source code repair agent.
Your task is to return the COMPLETE updated content of exactly one source file.

SYSTEM INSTRUCTIONS & REPAIR RULES:
- Follow the ORIGINAL ISSUE exactly as the authoritative specification.
- If TARGET FILE is a core source/implementation file and contains the logic bug, set `should_modify` to true and modify the source code to fix the bug.
- If TARGET FILE is a test file and a test plan exists, set `should_modify` to true and add/update test cases.
- Preserve exact exception types and messages requested by the issue.
- Never invent custom exceptions unless explicitly requested.
- Ensure test assertions match the updated implementation code so tests pass.
- If HUMAN REVIEW FEEDBACK is present, treat it as highest priority.

OUTPUT RULES:
- Return the complete updated source code in the `content` field.
- `content` must contain source code only (no markdown fences, no XML tags, no explanations).
- Do not return a unified diff.
- Set `should_modify` to true when the target file requires changes.
- Set `should_modify` to false only when no modification is required.

---

TARGET FILE TO REPAIR:
- Path: {file_path}
- Listed in likely_files_to_change: {is_likely}

CURRENT FILE CONTENT:
```
{code_view}
```

ORIGINAL ISSUE SPECIFICATION:
{json.dumps(compact_issue, indent=2)}

PLANNER ANALYSIS:
{json.dumps(compact_plan, indent=2)}

PREVIOUS EXECUTION FAILURE (Traceback / Reason):
{execution_feedback if execution_feedback else "None"}

PREVIOUS PATCH ATTEMPT:
{previous_patch if previous_patch else "None"}

HUMAN REVIEW FEEDBACK:
{human_feedback if human_feedback else "None"}

OTHER REPOSITORY FILES AVAILABLE:
{json.dumps(other_files) if other_files else "None"}
"""
