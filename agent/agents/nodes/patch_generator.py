import json

from agents.nodes.state import AgentState
from agents.nodes.planner import extract_json
from llm.ollama_client import llm


def generate_patch(state: AgentState) -> dict:
    plan = state.get("plan", state.get("analysis", {}))

    relevant_files = [
        {
            "path": file["path"],
            "content": file.get("content", "")[:4000],
        }
        for file in state.get("codebase", {}).get("relevant_files", [])[:6]
    ]

    allowed_files = state.get("selected_files", [])

    previous_error = state.get("validation_error", "")

    prompt = f"""
You are a careful open-source patch-generation agent.

Generate a minimal, complete unified diff for the approved implementation plan.

Return ONLY valid JSON with exactly this schema:

{{
  "can_generate_patch": true,
  "reason": "short explanation",
  "diff": "--- a/file.py\\n+++ b/file.py\\n..."
}}

Rules:
- Modify only files provided in Available files.
- Follow the implementation plan exactly.
- If test_plan is non-empty, modify at least one relevant test file.
- Do not invent files.
- Do not modify unrelated code.
- Inspect the exact provided file content before writing the diff.
- Do not assume lines exist if they are not shown in Available files.
- Do not add unreachable code after raise statements.
- A patch that changes only source code when tests are required is incomplete.
- If a safe complete patch cannot be produced, return:
  {{
    "can_generate_patch": false,
    "reason": "why the patch cannot be safely generated",
    "diff": ""
  }}
- The diff must begin with --- and contain +++.
- Start with {{ and end with }}.

MANDATORY REQUIREMENTS:
1. Return ONLY valid JSON. Do not use markdown fences.
2. The JSON must contain can_generate_patch, reason, and diff.
3. The diff must be a valid unified diff.
4. If Test requirements is non-empty, modify both:
   - at least one source file
   - at least one test file
5. For this issue, calculator.py must contain:
   raise ValueError("Cannot divide by zero")
6. For this issue, test_calculator.py must contain a pytest regression test.
7. Do not claim a test was added unless a test file appears in the diff.
8. Only modify files from Allowed files.
9. If a previous patch was rejected, fix the rejection in the new patch.

Issue:
{json.dumps(state.get("issue", {}), indent=2)}

Planner summary:
{plan.get("summary", "")}

Implementation requirements:
{json.dumps(plan.get("implementation_plan", []), indent=2)}

Test requirements:
{json.dumps(plan.get("test_plan", []), indent=2)}

Allowed files:
{json.dumps(allowed_files, indent=2)}

Available files:
{json.dumps(relevant_files, indent=2)}

Previous validation error:
{previous_error}

You MUST fix this exact rejection.
Do not return a patch that repeats the same failure.
"""

    response = llm.invoke(prompt)
    raw_response = response.content

    print("\n----- PATCH RAW RESPONSE -----")
    print(raw_response)
    print("----- END PATCH RAW RESPONSE -----\n")

    try:
        patch_data = extract_json(raw_response)

        if not patch_data.get("can_generate_patch", False):
            return {
                "patch": "",
                "patch_generation_error": patch_data.get(
                    "reason",
                    "Model declined to generate a patch."
                ),
            }

        diff = patch_data.get("diff", "")

        if not diff.startswith("---") or "+++ b/" not in diff:
            return {
                "patch": "",
                "patch_generation_error": "Model did not return a valid unified diff.",
            }

        return {
            "patch": diff,
            "patch_generation_error": None,
        }

    except Exception as error:
        return {
            "patch": "",
            "patch_generation_error": f"Patch generation failed: {error}",
        }


def patch_generator_node(state: AgentState) -> dict:
    patch_result = generate_patch(state)

    return {
        **state,
        **patch_result,
        "retry_count": state.get("retry_count", 0) + 1,
    }