from typing import TypedDict


class AgentState(TypedDict, total=False):
    repo_path: str
    codebase: dict
    issue: dict

    selected_files: list[str]

    plan: dict
    patch: str

    validation_passed: bool
    validation_error: str | None

    patch_applied: bool
    patch_error: str | None

    tests_passed: bool
    test_error: str | None
    test_result: dict

    acceptance_passed: bool
    acceptance_error: str | None
    acceptance_violations: list[str]

    retry_count: int
    max_retries: int
    retry_trace: list[dict]

    execution_trace: list[dict]