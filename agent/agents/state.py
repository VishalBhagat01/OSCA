"""AgentState defines the shared state schema for the LangGraph planner pipeline.

Context flows sequentially across pipeline nodes:
(planner → patch_generator → validator → patch_applier → test_runner →
acceptance_validator → pr_metadata_generator).
"""

from typing import Any, Optional, TypedDict


class AgentState(TypedDict, total=False):
    # Repository context
    repo_path: str
    codebase: dict[str, Any]
    issue: dict[str, Any]
    selected_files: list[str]

    # Planner output
    plan: dict[str, Any]
    analysis: Optional[dict[str, Any]]
    patch: str
    prompt: str

    # Validation stage
    validation_passed: bool
    validation_error: Optional[str]

    # Patch application stage
    patch_applied: bool
    patch_error: Optional[str]

    # Test execution stage
    tests_passed: bool
    test_error: Optional[str]
    test_result: dict[str, Any]

    # Acceptance validation stage
    acceptance_passed: bool
    acceptance_error: Optional[str]
    acceptance_violations: list[str]

    # PR metadata and output
    pr_metadata: dict[str, Any]
    changed_files: list[str]
    patch_generation_error: Optional[str]

    # Retry control
    retry_count: int
    max_retries: int
    retry_trace: list[dict[str, Any]]

    # Execution tracing
    execution_trace: list[dict[str, Any]]

    # Human-in-the-loop context
    retry: bool
    feedback: Optional[str]
    previous_result: Optional[dict[str, Any]]
    callback_url: Optional[str]
    callback_token: Optional[str]
