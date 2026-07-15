import os
import subprocess
import tempfile
from agents.utils.execution_trace import add_execution_event
from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace


def run_git_command(
    command: list[str],
    repo_path: str
) -> dict:
    result = subprocess.run(
        command,
        cwd=repo_path,
        capture_output=True,
        text=True
    )

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode
    }


def reset_repository(repo_path: str) -> dict:
    return run_git_command(
        ["git", "reset", "--hard", "HEAD"],
        repo_path
    )


def patch_applier_node(state: dict) -> dict:
    repo_path = state["repo_path"]

    proposed_patch = state.get(
        "proposed_patch",
        {},
    )

    patch = (
        state.get("patch")
        or proposed_patch.get("diff", "")
    )

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".patch",
        delete=False,
        encoding="utf-8",
    ) as patch_file:
        patch_file.write(patch)
        patch_path = patch_file.name

    try:
        check_result = run_git_command(
            [
                "git",
                "apply",
                "--check",
                patch_path,
            ],
            repo_path,
        )

        if not check_result["success"]:
            error = (
                "Patch cannot be applied cleanly: "
                f"{check_result['stderr']}"
            )

            updated_state = {
                **state,
                "patch_applied": False,
                "patch_error": check_result["stderr"],
                "validation_passed": False,
                "validation_error": error,
            }

            updated_state["retry_trace"] = (
                add_retry_trace(
                    updated_state,
                    stage="patch_apply",
                    error=error,
                )
            )

            updated_state["execution_trace"] = (
                add_execution_event(
                    updated_state,
                    node="patch_applier",
                    status="failed",
                    message=error,
                    details={},
                )
            )

            return updated_state

        apply_result = run_git_command(
            [
                "git",
                "apply",
                patch_path,
            ],
            repo_path,
        )

        if not apply_result["success"]:
            error = (
                "Patch application failed: "
                f"{apply_result['stderr']}"
            )

            updated_state = {
                **state,
                "patch_applied": False,
                "patch_error": apply_result["stderr"],
                "validation_passed": False,
                "validation_error": error,
            }

            updated_state["retry_trace"] = (
                add_retry_trace(
                    updated_state,
                    stage="patch_apply",
                    error=error,
                )
            )

            updated_state["execution_trace"] = (
                add_execution_event(
                    updated_state,
                    node="patch_applier",
                    status="failed",
                    message=error,
                    details={},
                )
            )

            return updated_state

        updated_state = {
            **state,
            "patch_applied": True,
            "patch_error": None,
        }

        updated_state["execution_trace"] = (
            add_execution_event(
                updated_state,
                node="patch_applier",
                status="success",
                message="Patch applied successfully.",
                details={},
            )
        )

        return updated_state

    finally:
        if os.path.exists(patch_path):
            os.remove(patch_path)