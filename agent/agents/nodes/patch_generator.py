import difflib
import json

from agents.nodes.state import AgentState
from agents.nodes.planner import extract_json
from llm.ollama_client import llm


def generate_file_content(
    state: AgentState,
    file_data: dict,
    feedback: str
) -> str | None:
    plan = state.get("plan", {})

    file_path = file_data["path"]
    original_content = file_data.get("content", "")

    prompt = f"""
You are an open-source code repair agent.

Modify ONE FILE ONLY.

Issue:
{json.dumps(state.get("issue", {}), indent=2)}

Implementation plan:
{json.dumps(plan.get("implementation_plan", []), indent=2)}

Test plan:
{json.dumps(plan.get("test_plan", []), indent=2)}

Previous failure feedback:
{feedback}

Target file:
{file_path}

Exact current file content:
--- FILE START ---
{original_content}
--- FILE END ---

Rules:
- Modify only the target file.
- Follow the issue requirements exactly.
- Preserve explicit exception types and messages from the issue.
- Return the COMPLETE updated file content.
- Do not return a diff.
- Do not use markdown fences.
- Do not add unrelated imports.
- Do not invent unrelated behavior.

Return ONLY valid JSON:

{{
  "should_modify": true,
  "content": "complete updated file content"
}}

If this file does not need modification:

{{
  "should_modify": false,
  "content": ""
}}
"""

    response = llm.invoke(prompt)
    raw_response = response.content

    print(
        f"\n----- FILE RESPONSE: {file_path} -----"
    )
    print(raw_response)
    print("----- END FILE RESPONSE -----\n")

    result = extract_json(raw_response)

    if not result.get("should_modify", False):
        return None

    updated_content = result.get("content", "")

    if not updated_content.strip():
        return None

    return updated_content


def create_unified_diff(
    file_path: str,
    original_content: str,
    updated_content: str
) -> str:
    original_lines = original_content.splitlines(
        keepends=True
    )

    updated_lines = updated_content.splitlines(
        keepends=True
    )

    diff = difflib.unified_diff(
        original_lines,
        updated_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
        lineterm=""
    )

    return "\n".join(diff)


def generate_patch(state: AgentState) -> dict:
    relevant_files = state.get(
        "codebase",
        {}
    ).get("relevant_files", [])[:6]

    allowed_files = set(
        state.get("selected_files", [])
    )

    feedback = (
        state.get("validation_error")
        or state.get("patch_error")
        or state.get("test_error")
        or ""
    )

    generated_diffs = []

    for file_data in relevant_files:
        file_path = file_data.get("path")

        if file_path not in allowed_files:
            continue

        try:
            updated_content = generate_file_content(
                state=state,
                file_data=file_data,
                feedback=feedback
            )

            if updated_content is None:
                continue

            original_content = file_data.get(
                "content",
                ""
            )

            file_diff = create_unified_diff(
                file_path=file_path,
                original_content=original_content,
                updated_content=updated_content
            )

            if file_diff.strip():
                generated_diffs.append(file_diff)

        except Exception as error:
            print(
                f"Patch generation failed for "
                f"{file_path}: {error}"
            )

    if not generated_diffs:
        return {
            "patch": "",
            "patch_generation_error": (
                "Model did not generate any file changes."
            )
        }

    complete_patch = "\n".join(generated_diffs)

    print("\n----- GENERATED UNIFIED DIFF -----")
    print(complete_patch)
    print("----- END GENERATED DIFF -----\n")

    return {
        "patch": complete_patch,
        "patch_generation_error": None
    }


def patch_generator_node(state: AgentState) -> dict:
    patch_result = generate_patch(state)

    return {
        **state,
        **patch_result,

        "changed_files": [],

        "validation_passed": False,
        "validation_error": None,

        "patch_applied": False,
        "patch_error": None,

        "tests_passed": False,
        "test_result": {},
        "test_error": None,

        "retry_count": (
            state.get("retry_count", 0) + 1
        )
    }