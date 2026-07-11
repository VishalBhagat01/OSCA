from typing import TypedDict, Optional, Any


class AgentState(TypedDict, total=False):
    repo_path: str

    issue: dict
    codebase: dict
    selected_files: list[str]

    plan: dict

    patch: str
    patch_generation_error: Optional[str]

    changed_files: list[str]

    validation_passed: bool
    validation_error: Optional[str]

    patch_applied: bool
    patch_error: Optional[str]

    tests_passed: bool
    test_result: dict[str, Any]
    test_error: Optional[str]

    retry_count: int
    max_retries: int

    retry_trace: list[dict]