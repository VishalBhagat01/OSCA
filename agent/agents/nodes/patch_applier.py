import os
import subprocess
import tempfile

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


def patch_applier_node(state: AgentState) -> dict:
    repo_path = state["repo_path"]
    patch = state.get("patch", "")

    if not patch.strip():
        error = "Cannot apply an empty patch."

        return {
            **state,
            "patch_applied": False,
            "patch_error": error,
            "retry_trace": add_retry_trace(
                state,
                stage="patch_apply",
                error=error
            )
        }

    if state.get("retry_count", 0) > 1:
        reset_result = reset_repository(repo_path)

        if not reset_result["success"]:
            error = (
                "Could not reset repository before retry: "
                f"{reset_result['stderr']}"
            )

            return {
                **state,
                "patch_applied": False,
                "patch_error": error,
                "retry_trace": add_retry_trace(
                    state,
                    stage="patch_apply",
                    error=error
                )
            }

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".patch",
        delete=False,
        encoding="utf-8"
    ) as patch_file:
        patch_file.write(patch.rstrip("\n") + "\n")
        patch_path = patch_file.name

    try:
        check_result = run_git_command(
            [
                "git",
                "apply",
                "--check",
                patch_path
            ],
            repo_path
        )

        if not check_result["success"]:
            error = (
                "Patch cannot be applied cleanly: "
                f"{check_result['stderr']}"
            )

            return {
                **state,
                "patch_applied": False,
                "patch_error": error,
                "retry_trace": add_retry_trace(
                    state,
                    stage="patch_apply",
                    error=error
                )
            }

        apply_result = run_git_command(
            [
                "git",
                "apply",
                patch_path
            ],
            repo_path
        )

        if not apply_result["success"]:
            error = (
                "Patch application failed: "
                f"{apply_result['stderr']}"
            )

            return {
                **state,
                "patch_applied": False,
                "patch_error": error,
                "retry_trace": add_retry_trace(
                    state,
                    stage="patch_apply",
                    error=error
                )
            }

        return {
            **state,
            "patch_applied": True,
            "patch_error": None
        }

    finally:
        if os.path.exists(patch_path):
            os.remove(patch_path)