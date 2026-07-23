import re
from typing import Any

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event

TEST_FILE_PATTERNS = [
    r"(^|/)test_.*\.py$",
    r"(^|/).*_test\.py$",
    r"(^|/)tests/.*\.py$",
]


def is_test_file(file_path: str) -> bool:
    normalized_path = file_path.replace("\\", "/")

    return any(
        re.search(pattern, normalized_path)
        for pattern in TEST_FILE_PATTERNS
    )


def extract_changed_files(diff: str) -> list[str]:
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
    if not diff or not diff.strip():
        return {
            "valid": False,
            "error": "Generated patch is empty.",
        }

    if "--- a/" not in diff or "+++ b/" not in diff:
        return {
            "valid": False,
            "error": "Generated output is not a valid unified diff.",
        }

    changed_files = extract_changed_files(diff)

    if not changed_files:
        return {
            "valid": False,
            "error": "No changed files were found in the patch.",
        }

    invalid_files = [
        file_path
        for file_path in changed_files
        if file_path not in allowed_files
    ]

    if invalid_files:
        return {
            "valid": False,
            "error": f"Patch modifies files outside allowed files: {invalid_files}",
        }

    source_files = [
        file_path
        for file_path in changed_files
        if not is_test_file(file_path)
    ]

    if not source_files:
        return {
            "valid": False,
            "error": "Patch must modify at least one non-test/source file.",
        }

    if test_plan:
        has_allowed_test_files = any(
            is_test_file(file_path)
            for file_path in allowed_files
        )

        if has_allowed_test_files:
            test_files = [
                file_path
                for file_path in changed_files
                if is_test_file(file_path)
            ]

            if not test_files:
                return {
                    "valid": False,
                    "error": (
                        "Patch must modify at least one test file "
                        "because a test plan exists."
                    ),
                }

    return {
        "valid": True,
        "error": None,
        "changed_files": changed_files,
    }

def validation_node(state: AgentState) -> dict:
    proposed_patch = state.get("proposed_patch", {})

    diff = (
        state.get("patch")
        or proposed_patch.get("diff", "")
    )

    allowed_files = state.get("selected_files", [])

    plan = (
        state.get("plan")
        or state.get("analysis", {})
    )

    test_plan = plan.get("test_plan", [])

    validation_result = validate_patch(
        diff=diff,
        allowed_files=allowed_files,
        test_plan=test_plan,
    )

    validation_passed = validation_result.get(
        "valid",
        False,
    )

    validation_error = validation_result.get(
        "error"
    )

    changed_files = validation_result.get(
        "changed_files",
        [],
    )

    updated_state = {
        **state,
        "validation_passed": validation_passed,
        "validation_error": validation_error,
        "changed_files": changed_files,
    }

    if not validation_passed:
        updated_state["retry_trace"] = add_retry_trace(
            updated_state,
            stage="validation",
            error=(
                validation_error
                or "Patch validation failed."
            ),
        )

    if validation_passed:
        status = "success"
        message = "Patch validation passed."
    else:
        status = "failed"
        message = (
            validation_error
            or "Patch validation failed."
        )

    updated_state["execution_trace"] = (
        add_execution_event(
            updated_state,
            node="validator",
            status=status,
            message=message,
            details={
                "changed_files": changed_files,
            },
        )
    )

    return updated_state