"""Prompt templates for the planner node."""

import json


def build_planner_prompt(
    compact_issue: dict,
    files_json: str,
    previous_analysis: dict | None = None,
    human_feedback: str | None = None,
) -> str:
    """Constructs the prompt for the planner LLM to categorize and plan issue resolution."""
    feedback_section = (
        f"\nHUMAN REVIEW FEEDBACK:\n{human_feedback}\n"
        if human_feedback
        else ""
    )
    previous_analysis_section = (
        f"\nPREVIOUS ANALYSIS:\n{json.dumps(previous_analysis, indent=2)}\n"
        if previous_analysis
        else ""
    )

    return f"""\
You are an open-source issue planning agent.

Classify this issue as exactly one:
- actionable_bug
- actionable_feature
- discussion
- needs_clarification

Return ONLY valid JSON.

Use exactly this schema:
{{
  "issue_type": "actionable_bug",
  "summary": "short summary",
  "root_cause_hypothesis": "short explanation",
  "likely_files_to_change": [
    {{
      "path": "relative/path.py",
      "reason": "why this file is relevant"
    }}
  ],
  "implementation_plan": [
    "step 1",
    "step 2"
  ],
  "test_plan": [
    "test step 1"
  ],
  "difficulty": "easy",
  "confidence": 0.9,
  "needs_human_clarification": false,
  "clarifying_questions": []
}}

Issue:
{json.dumps(compact_issue, indent=2)}
{previous_analysis_section}{feedback_section}
Retrieved repository files:
{files_json}

Rules:
- Output ONLY the JSON object. Start with {{ and end with }}.
- Do NOT output markdown code blocks or text outside the JSON object.
- In strings, use single quotes for any code references (e.g. 'raise ZeroDivisionError(...)') to keep JSON syntax valid.
- Never include trailing commas.
- If HUMAN REVIEW FEEDBACK is present, incorporate the human reviewer's instructions into your root cause hypothesis, implementation_plan, and likely_files_to_change.
- If the issue asks for rationale, policy, migration advice, or design discussion, use "discussion".
- For "discussion" or "needs_clarification", keep implementation_plan and test_plan empty.
- Mention only files present in Retrieved repository files.
- For a clear bug, include source-file and test-file changes when tests are available.
"""
