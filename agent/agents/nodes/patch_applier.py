import os
import subprocess
import tempfile


def run_git_command(command: list[str], repo_path: str) -> dict:
    result = subprocess.run(
        command,
        cwd=repo_path,
        capture_output=True,
        text=True
    )

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr
    }


def patch_applier_node(state: dict) -> dict:
    repo_path = state["repo_path"]
    proposed_patch = state.get("proposed_patch", {})
    patch = state.get("patch") or proposed_patch.get("diff", "")

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".patch",
        delete=False,
        encoding="utf-8"
    ) as patch_file:
        patch_file.write(patch)
        patch_path = patch_file.name

    try:
        check_result = run_git_command(
            ["git", "apply", "--check", patch_path],
            repo_path
        )

        if not check_result["success"]:
            return {
                **state,
                "patch_applied": False,
                "patch_error": check_result["stderr"],
                "validation_passed": False,
                "validation_error": (
                    "Patch cannot be applied cleanly: "
                    f"{check_result['stderr']}"
                )
            }

        apply_result = run_git_command(
            ["git", "apply", patch_path],
            repo_path
        )

        if not apply_result["success"]:
            return {
                **state,
                "patch_applied": False,
                "patch_error": apply_result["stderr"],
                "validation_passed": False,
                "validation_error": (
                    "Patch application failed: "
                    f"{apply_result['stderr']}"
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