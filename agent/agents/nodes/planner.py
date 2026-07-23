import json
import re

from agents.nodes.state import AgentState
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event

def extract_json(raw_response: str) -> dict:
    cleaned = raw_response.strip()
    cleaned = cleaned.replace("```json", "")
    cleaned = cleaned.replace("```", "")
    cleaned = cleaned.strip()

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)

    if not match:
        raise ValueError("No JSON object found in model response.")

    return json.loads(match.group())


def build_prompt(state: AgentState) -> dict:
    issue = state["issue"]
    codebase = state["codebase"]

    files = [
        {
            "path": file["path"],
            "content": file.get("content", "")[:2000]
        }
        for file in codebase.get("relevant_files", [])[:5]
    ]

    prompt = f"""
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
  "confidence": 0.0,
  "needs_human_clarification": false,
  "clarifying_questions": []
}}

Issue:
{json.dumps(issue, indent=2)}

Retrieved repository files:
{json.dumps(files, indent=2)}

Rules:
- If the issue asks for rationale, policy, migration advice, or design discussion, use "discussion".
- For "discussion" or "needs_clarification", keep implementation_plan and test_plan empty.
- Mention only files present in Retrieved repository files.
- For a clear bug, include source-file and test-file changes when tests are available.
- The implementation_plan must adhere strictly to the exact requirement, exception type (e.g., CustomException vs ValueError), exception message, or return value specified in the Issue. Do not substitute or invent alternative error handling.
- Start with [ and end with ].
"""

    return {"prompt": prompt}


def classify_and_plan(state: AgentState) -> dict:
    response = llm.invoke(state["prompt"])
    raw_response = response.content

    print("\n----- PLANNER RAW RESPONSE -----")
    print(raw_response)
    print("----- END PLANNER RAW RESPONSE -----\n")

    try:
        analysis = extract_json(raw_response)

    except Exception as error:
        analysis = {
            "issue_type": "needs_clarification",
            "summary": "Could not analyze the issue.",
            "root_cause_hypothesis": str(error),
            "likely_files_to_change": [],
            "implementation_plan": [],
            "test_plan": [],
            "difficulty": "medium",
            "confidence": 0.0,
            "needs_human_clarification": True,
            "clarifying_questions": [
                "The planner could not return valid structured output."
            ]
        }

    return {"analysis": analysis}


def should_generate_patch(state: AgentState) -> str:
    analysis = state["analysis"]

    actionable_types = {
        "actionable_bug",
        "actionable_feature"
    }

    if analysis.get("issue_type") not in actionable_types:
        return "finish"

    if analysis.get("needs_human_clarification", False):
        return "finish"

    return "generate_patch"


def planner_node(state: AgentState) -> dict:
    prompt_state = build_prompt(state)

    analysis_state = classify_and_plan(prompt_state)

    plan = analysis_state.get("analysis", {})

    return {
        **state,
        "plan": plan,
        "execution_trace": add_execution_event(
            state,
            node="planner",
            status="success",
            message=(
                "Issue analyzed and implementation "
                "plan created."
            ),
            details={
                "issue_type": plan.get("issue_type"),
                "difficulty": plan.get("difficulty"),
                "confidence": plan.get("confidence"),
            },
        ),
    }