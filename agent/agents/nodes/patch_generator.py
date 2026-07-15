import json
from pathlib import Path

from git import Repo

from agents.utils import retry_trace
from agents.models.patch import FileEdit
from agents.nodes.state import AgentState
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event

structured_llm = llm.with_structured_output(FileEdit)

def generate_file_edit(
    state: AgentState,
    file_data: dict,
    feedback: str,
    repository_context: dict,
) -> FileEdit:
    plan = state.get("plan", {})
    file_path = file_data["path"]

    prompt = f"""
        You are an open-source code repair agent.

        Your task is to return the COMPLETE updated content of exactly one source file.

        ORIGINAL ISSUE:
        {json.dumps(state.get("issue", {}), indent=2)}

        PLANNER ANALYSIS:
        {json.dumps(plan, indent=2)}

        PREVIOUS EXECUTION FAILURE:
        {feedback}

        RELATED REPOSITORY FILES:
        {json.dumps(repository_context, indent=2)}

        TARGET FILE:
        {file_path}

        CURRENT FILE CONTENT:
        {json.dumps(file_data.get("content", ""))}

        INSTRUCTIONS:
        - Follow the ORIGINAL ISSUE exactly.
        - The ORIGINAL ISSUE is the authoritative specification.
        - The original issue overrides ambiguous planner wording.
        - Preserve exact exception types requested by the issue.
        - Preserve exact exception messages requested by the issue.
        - Never invent custom exceptions unless explicitly requested.
        - Use PREVIOUS EXECUTION FAILURE to correct the previous attempt.
        - If a previous failure mentions a missing symbol, do not use that invalid symbol again.
        - Ensure imports reference symbols that actually exist in related repository files.
        - Ensure the generated file is valid Python when the target file is a Python file.

        OUTPUT RULES:
        - Return the complete updated source code in the `content` field.
        - `content` must contain source code only.
        - Do not include markdown code fences.
        - Do not include XML tags.
        - Do not include <current_file>.
        - Do not include </current_file>.
        - Do not include FILE START or FILE END markers.
        - Do not include explanations inside `content`.
        - Do not return a unified diff.
        - Modify only the TARGET FILE.
        - Set `should_modify` to true when the target file requires changes.
        - Set `should_modify` to false only when no modification is required.
        """

    return structured_llm.invoke(prompt)


def generate_patch(state: AgentState) -> dict:
    repo_path = Path(state["repo_path"])
    repo = Repo(repo_path)

    allowed_files = set(
        state.get("selected_files", [])
    )

    relevant_files = state.get(
        "codebase",
        {}
    ).get("relevant_files", [])

    retry_trace = state.get("retry_trace", [])

    feedback = (
        retry_trace[-1].get("error", "")
        if retry_trace
        else ""
    )

    try:
        repo.git.reset("--hard", "HEAD")

        repository_context = {
            file_data["path"]: (
                repo_path / file_data["path"]
            ).read_text(
                encoding="utf-8"
            )
            for file_data in relevant_files
            if (
                repo_path / file_data["path"]
            ).is_file()
        }

        for file_data in relevant_files:
            file_path = file_data["path"]

            if file_path not in allowed_files:
                continue

            current_content = repository_context.get(
                file_path,
                ""
            )

            file_context = {
                **file_data,
                "content": current_content,
            }

            edit = generate_file_edit(
                state=state,
                file_data=file_context,
                feedback=feedback,
                repository_context=repository_context,
            )

            if not edit.should_modify:
                continue

            target_file = repo_path / file_path

            target_file.write_text(
                edit.content,
                encoding="utf-8",
            )

        diff = repo.git.diff()

        return {
            "patch": diff,
            "patch_generation_error": (
                None
                if diff
                else "Model generated no file changes."
            ),
        }

    except Exception as error:
        return {
            "patch": "",
            "patch_generation_error": (
                f"Patch generation failed: {error}"
            ),
        }

    finally:
        repo.git.reset("--hard", "HEAD")


def patch_generator_node(state: AgentState) -> dict:
    patch_state = generate_patch(state)

    patch = patch_state.get("patch", "")
    patch_error = patch_state.get(
        "patch_generation_error"
    )

    updated_state = {
        **state,
        **patch_state,
        "retry_count": state.get(
            "retry_count",
            0
        ) + 1,
    }

    if patch:
        execution_trace = add_execution_event(
            updated_state,
            node="patch_generator",
            status="success",
            message="Patch generated successfully.",
            details={
                "patch_length": len(patch),
                "attempt": updated_state[
                    "retry_count"
                ],
            },
        )

    else:
        execution_trace = add_execution_event(
            updated_state,
            node="patch_generator",
            status="failed",
            message=(
                patch_error
                or "Patch generation failed."
            ),
            details={
                "attempt": updated_state[
                    "retry_count"
                ],
            },
        )

    return {
        **updated_state,
        "execution_trace": execution_trace,
    }