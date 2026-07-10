from typing import TypedDict, Optional, Any


class AgentState(TypedDict, total=False):
    repo_path: str
    issue: dict
    codebase: dict
    prompt: str
    analysis: dict
    proposed_patch: dict
    selected_files: list
    plan: dict
    patch: str

    validation_passed: bool
    validation_error: Optional[str]
    changed_files: list

    patch_applied: bool
    patch_error: Optional[str]

    tests_passed: bool
    test_result: dict[str, Any]

    retry_count: int
    max_retries: int