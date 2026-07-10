import re
from typing import Any


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


def validation_node(state: dict) -> dict:
    plan = state.get("plan", state.get("analysis", {}))

    result = validate_patch(
        diff=state.get("patch", ""),
        allowed_files=state.get("selected_files", []),
        test_plan=plan.get("test_plan"),
    )

    if not result["valid"]:
        return {
            **state,
            "validation_passed": False,
            "validation_error": result["error"],
        }

    return {
        **state,
        "validation_passed": True,
        "validation_error": None,
        "changed_files": result["changed_files"],
    }