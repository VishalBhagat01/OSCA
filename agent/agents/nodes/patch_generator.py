"""Patch generator node: synthesizes source code changes across target files using LLM."""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# pyrefly: ignore [missing-import]
from git import Repo

from agents.models.patch import FileEdit
from agents.nodes.state import AgentState
from agents.nodes.validators import is_test_file
from llm.llm_provider import get_provider_name
from llm.ollama_client import llm
from agents.utils.execution_trace import add_execution_event, emit_trace_event
from prompts.patch_prompts import build_patch_prompt
from constants import (
    NODE_PATCH_GENERATOR,
    STATUS_RUNNING,
    STATUS_SUCCESS,
    STATUS_FAILED,
)

_structured_llm = None


def get_structured_llm():
    """Lazily initialize structured output model to avoid import-time side effects."""
    global _structured_llm
    if _structured_llm is None:
        _structured_llm = llm.with_structured_output(FileEdit)
    return _structured_llm


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
    if previous_result and state.get("retry"):
        proposed_patch = previous_result.get("proposed_patch", {})
        diff = proposed_patch.get("diff") or proposed_patch.get("patch", "")
        # Compact previous patch diff to save prompt tokens
        previous_patch = diff[:800] + ("\n... [truncated]" if len(diff) > 800 else "")

    # Compact issue representation (strips raw comment bloat)
    issue = state.get("issue", {})
    compact_issue = {
        "number": issue.get("number"),
        "title": issue.get("title", ""),
        "body": (issue.get("body") or "")[:1000],
    }

    # Compact plan (omits redundant previous_analysis)
    compact_plan = {
        "summary": plan.get("summary", ""),
        "root_cause": plan.get("root_cause_hypothesis", ""),
        "implementation_plan": plan.get("implementation_plan", [])[:4],
        "test_plan": plan.get("test_plan", [])[:2],
    }

    current_code = repository_context.get(file_path, file_data.get("content", ""))

    # Lightweight list of available context filenames
    other_files = [p for p in repository_context.keys() if p != file_path][:5]

    prompt = build_patch_prompt(
        compact_issue=compact_issue,
        compact_plan=compact_plan,
        previous_patch=previous_patch,
        human_feedback=human_feedback,
        execution_feedback=execution_feedback,
        other_files=other_files,
        file_path=file_path,
        current_code=current_code,
        is_likely=is_likely,
    )

    return get_structured_llm().invoke(prompt)


def _process_single_file(
    state: AgentState,
    file_data: dict,
    execution_feedback: str,
    human_feedback: str | None,
    previous_result: dict | None,
    repository_context: dict,
) -> tuple[str, str | None]:
    file_path = file_data["path"]
    edit = generate_file_edit(
        state=state,
        file_data=file_data,
        execution_feedback=execution_feedback,
        human_feedback=human_feedback,
        previous_result=previous_result,
        repository_context=repository_context,
    )

    if not edit.should_modify:
        return file_path, None

    return file_path, clean_code_content(edit.content)


def generate_patch(state: AgentState) -> dict:
    repo_path = Path(state["repo_path"])
    repo = Repo(repo_path, search_parent_directories=False)

    allowed_files = set(state.get("selected_files", []))
    relevant_files = state.get("codebase", {}).get("relevant_files", [])
    retry_trace = state.get("retry_trace", [])
    raw_error = retry_trace[-1].get("error", "") if retry_trace else ""
    # Prioritize the tail where AssertionErrors, TypeErrors, and tracebacks reside
    if len(raw_error) > 1000:
        execution_feedback = "... [startup log truncated]\n" + raw_error[-1000:]
    else:
        execution_feedback = raw_error

    human_feedback = state.get("feedback")
    previous_result = state.get("previous_result")

    try:
        repo.git.reset("--hard", "HEAD")

        repository_context = {
            file_data["path"]: (repo_path / file_data["path"]).read_text(encoding="utf-8")
            for file_data in relevant_files
            if (repo_path / file_data["path"]).is_file()
        }

        plan = state.get("plan", {})
        likely_items = plan.get("likely_files_to_change", [])
        likely_file_paths = set()
        for item in likely_items:
            if isinstance(item, dict) and item.get("path"):
                likely_file_paths.add(item["path"].replace("\\", "/").strip().lower())
            elif isinstance(item, str) and item.strip():
                likely_file_paths.add(item.replace("\\", "/").strip().lower())

        # Segregate allowed source files and test files
        source_candidates = []
        test_candidates = []

        for fd in relevant_files:
            if fd["path"] not in allowed_files:
                continue
            p = fd["path"].replace("\\", "/").strip().lower()
            is_likely = p in likely_file_paths
            if is_test_file(fd["path"]):
                test_candidates.append((is_likely, fd))
            else:
                source_candidates.append((is_likely, fd))

        # Prioritize likely files
        source_candidates.sort(key=lambda x: x[0], reverse=True)
        test_candidates.sort(key=lambda x: x[0], reverse=True)

        current_retry = state.get("retry_count", 0)
        last_stage = retry_trace[-1].get("stage", "") if retry_trace else ""

        # Select at most 1 primary source file and 1 test file
        files_to_process = []
        if source_candidates:
            files_to_process.append(source_candidates[0][1])

        test_plan = plan.get("test_plan", [])
        # On first attempt (retry_count == 0), synthesize both source and test files.
        # On retries, ONLY synthesize the test file if test syntax specifically failed.
        # Otherwise, preserve the existing test file and only repair implementation to save 50% tokens!
        should_include_test = (
            test_plan
            and test_candidates
            and (current_retry == 0 or last_stage == "test_syntax")
        )
        if should_include_test:
            files_to_process.append(test_candidates[0][1])

        # Fallback if candidates were empty
        if not files_to_process:
            files_to_process = [
                fd for fd in relevant_files if fd["path"] in allowed_files
            ][:1 if current_retry > 0 else 2]

        # Concurrency: Sequential for Gemini to avoid bursting the TPM/RPM limit
        is_gemini = get_provider_name() == "gemini"
        max_workers = 1 if is_gemini else min(len(files_to_process), 2)

        results: dict[str, str | None] = {}
        if max_workers == 1:
            for file_data in files_to_process:
                file_path, content = _process_single_file(
                    state,
                    file_data,
                    execution_feedback,
                    human_feedback,
                    previous_result,
                    repository_context,
                )
                results[file_path] = content
        else:
            with ThreadPoolExecutor(max_workers=max_workers) as pool:
                futures = {
                    pool.submit(
                        _process_single_file,
                        state,
                        file_data,
                        execution_feedback,
                        human_feedback,
                        previous_result,
                        repository_context,
                    ): file_data["path"]
                    for file_data in files_to_process
                }
                for future in as_completed(futures):
                    file_path, content = future.result()
                    results[file_path] = content

        # Apply edits sequentially
        for file_path, content in results.items():
            if content is None:
                continue
            target_file = repo_path / file_path
            target_file.write_text(content, encoding="utf-8")

        diff = repo.git.diff()

        return {
            "patch": diff,
            "patch_generation_error": (
                None if diff else "Model generated no file changes."
            ),
        }

    except Exception as error:
        return {
            "patch": "",
            "patch_generation_error": f"Patch generation failed: {error}",
        }

    finally:
        try:
            repo.git.reset("--hard", "HEAD")
        except Exception:
            pass


def patch_generator_node(state: AgentState) -> dict:
    current_retry = state.get("retry_count", 0) + 1

    emit_trace_event(
        state,
        node=NODE_PATCH_GENERATOR,
        status=STATUS_RUNNING,
        message=f"Synthesizing code patch (attempt {current_retry})...",
    )

    result = generate_patch(state)
    diff = result.get("patch", "")
    error = result.get("patch_generation_error")

    # Anti-stagnation guard: If model generates identical diff to previous attempt, terminate early
    previous_patch = state.get("patch", "")
    if not error and current_retry > 1 and diff and diff.strip() == (previous_patch or "").strip():
        error = "Patch synthesis stagnated: model generated identical patch to previous attempt."

    if error:
        execution_trace = add_execution_event(
            state,
            node=NODE_PATCH_GENERATOR,
            status=STATUS_FAILED,
            message=f"Patch generation failed on attempt {current_retry}: {error}",
            details={"error": error, "retry_count": current_retry},
        )
    else:
        changed = [
            line[6:].strip()
            for line in diff.splitlines()
            if line.startswith("+++ b/")
        ]
        execution_trace = add_execution_event(
            state,
            node=NODE_PATCH_GENERATOR,
            status=STATUS_SUCCESS,
            message=f"Successfully synthesized patch across {len(changed)} file(s) on attempt {current_retry}.",
            details={"changed_files": changed, "retry_count": current_retry},
        )

    return {
        "patch": diff,
        "patch_generation_error": error,
        "retry_count": current_retry,
        "execution_trace": execution_trace,
    }