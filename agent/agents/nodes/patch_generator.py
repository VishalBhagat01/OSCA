import json
from pathlib import Path

# pyrefly: ignore [missing-import]
from git import Repo

from agents.nodes import state
from agents.utils import retry_trace
from agents.models.patch import FileEdit
from agents.nodes.state import AgentState
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event

structured_llm = llm.with_structured_output(FileEdit)


def clean_code_content(content: str) -> str:
    cleaned = content.strip()
    lines = cleaned.splitlines()
    if lines and lines[0].strip().startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines)


def generate_file_edit(
    state: AgentState,
    file_data: dict,
    execution_feedback: str,
    human_feedback: str | None,
    previous_result: dict | None,
    repository_context: dict,
) -> FileEdit:
    
    plan = state.get("plan", {})
    file_path = file_data["path"]

    likely_files = [
        item.get("path") if isinstance(item, dict) else item
        for item in plan.get("likely_files_to_change", [])
    ]
    is_likely = file_path in likely_files

    previous_patch = ""

    if previous_result:
        proposed_patch = previous_result.get("proposed_patch", {})
        previous_patch = proposed_patch.get("diff") or proposed_patch.get("patch", "")

    previous_analysis = {}

    if previous_result:
        previous_analysis = previous_result.get(
            "analysis",
            {}
        )

    prompt = f"""
        You are an open-source code repair agent.

        Your task is to return the COMPLETE updated content of exactly one source file.

        ORIGINAL ISSUE:
        {json.dumps(state.get("issue", {}), indent=2)}

        PLANNER ANALYSIS:
        {json.dumps(plan, indent=2)}

        PREVIOUS ANALYSIS:
        {json.dumps(previous_analysis, indent=2)}

        PREVIOUS PATCH:
        {previous_patch}

        HUMAN REVIEW FEEDBACK:
        {human_feedback}

        PREVIOUS EXECUTION FAILURE:
        {execution_feedback}

        RELATED REPOSITORY FILES:
        {json.dumps(repository_context, indent=2)}

        TARGET FILE:
        {file_path}

        CURRENT FILE CONTENT:
        {json.dumps(file_data.get("content", ""))}

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
        - Do not include markdown code fences.
        - Do not include XML tags.
        - Do not include explanations inside `content`.
        - Do not return a unified diff.
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

    execution_feedback = (
        retry_trace[-1].get("error", "")
        if retry_trace
        else ""
    )

    human_feedback = state.get("feedback")
    previous_result = state.get("previous_result")

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
                execution_feedback=execution_feedback,
                human_feedback=human_feedback,
                previous_result=previous_result,
                repository_context=repository_context,
            )

            if not edit.should_modify:
                continue

            cleaned_code = clean_code_content(edit.content)
            target_file = repo_path / file_path

            target_file.write_text(
                cleaned_code,
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