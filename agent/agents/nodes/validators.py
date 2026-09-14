import re
from typing import Any

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event

# Pre-compiled regex patterns (avoids recompilation on every call)
_TEST_FILE_PATTERNS = [
    re.compile(r"(^|/)test_.*\.py$"),
    re.compile(r"(^|/).*_test\.py$"),
    re.compile(r"(^|/)tests/.*\.py$"),
]


def is_test_file(file_path: str) -> bool:
    """Check if a file path matches test file patterns."""
    normalized_path = file_path.replace("\\", "/")
    return any(pattern.search(normalized_path) for pattern in _TEST_FILE_PATTERNS)


def extract_changed_files(diff: str) -> list[str]:
    """Extract unique changed file paths from a unified diff."""
    changed_files = []
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            file_path = line.replace("+++ b/", "").strip()
            if file_path != "/dev/null":
                changed_files.append(file_path)
    return list(set(changed_files))


def validate_patch(
    diff: str,
    allowed_files: list[str],
    test_plan: Any = None,
) -> dict:
    """Validate a patch diff against allowed files and test requirements."""

    if not diff or not diff.strip():
        return {"valid": False, "error": "Generated patch is empty."}

    if "--- a/" not in diff or "+++ b/" not in diff:
        return {"valid": False, "error": "Generated output is not a valid unified diff."}

    changed_files = extract_changed_files(diff)

    if not changed_files:
        return {"valid": False, "error": "No changed files were found in the patch."}

    invalid_files = [
        fp for fp in changed_files if fp not in allowed_files
    ]
    if invalid_files:
        return {
            "valid": False,
            "error": f"Patch modifies files outside allowed files: {invalid_files}",
        }

    source_files = [fp for fp in changed_files if not is_test_file(fp)]
    if not source_files:
        return {
            "valid": False,
            "error": "Patch must modify at least one non-test/source file.",
        }

    if test_plan:
        has_allowed_test_files = any(
            is_test_file(fp) for fp in allowed_files
        )
        if has_allowed_test_files:
            test_files = [fp for fp in changed_files if is_test_file(fp)]
            if not test_files:
                return {
                    "valid": False,
                    "error": "Patch must modify at least one test file because a test plan exists.",
                }

    return {"valid": True, "error": None, "changed_files": changed_files}


def validation_node(state: AgentState) -> dict:
    """LangGraph node: validate patch and return only changed keys."""

    proposed_patch = state.get("proposed_patch", {})
    diff = state.get("patch") or proposed_patch.get("diff", "")
    allowed_files = state.get("selected_files", [])
    plan = state.get("plan") or state.get("analysis", {})
    test_plan = plan.get("test_plan", [])

    validation_result = validate_patch(
        diff=diff,
        allowed_files=allowed_files,
        test_plan=test_plan,
    )

    validation_passed = validation_result.get("valid", False)
    validation_error = validation_result.get("error")
    changed_files = validation_result.get("changed_files", [])

    # Build return dict with only changed keys
    result = {
        "validation_passed": validation_passed,
        "validation_error": validation_error,
        "changed_files": changed_files,
    }

    if not validation_passed:
        result["retry_trace"] = add_retry_trace(
            state,
            stage="validation",
            error=validation_error or "Patch validation failed.",
        )

    status = "success" if validation_passed else "failed"
    message = "Patch validation passed." if validation_passed else (
        validation_error or "Patch validation failed."
    )

    result["execution_trace"] = add_execution_event(
        state,
        node="validator",
        status=status,
        message=message,
        details={"changed_files": changed_files},
    )

    return result