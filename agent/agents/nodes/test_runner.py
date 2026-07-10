import subprocess


def run_command(command: list[str], repo_path: str) -> dict:
    result = subprocess.run(
        command,
        cwd=repo_path,
        capture_output=True,
        text=True,
        timeout=60
    )

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode
    }


def test_runner_node(state: dict) -> dict:
    repo_path = state["repo_path"]

    try:
        result = run_command(
            ["pytest", "-q"],
            repo_path
        )

        if not result["success"]:
            error_output = result["stderr"] or result["stdout"]

            return {
                **state,
                "tests_passed": False,
                "test_result": result,
                "validation_passed": False,
                "validation_error": (
                    "Tests failed after applying the patch:\n"
                    f"{error_output}"
                )
            }

        return {
            **state,
            "tests_passed": True,
            "test_result": result,
            "validation_error": None
        }

    except subprocess.TimeoutExpired:
        return {
            **state,
            "tests_passed": False,
            "test_result": {
                "success": False,
                "stdout": "",
                "stderr": "Test execution timed out after 60 seconds.",
                "return_code": None
            },
            "validation_passed": False,
            "validation_error": "Test execution timed out after 60 seconds."
        }

    except Exception as error:
        return {
            **state,
            "tests_passed": False,
            "test_result": {
                "success": False,
                "stdout": "",
                "stderr": str(error),
                "return_code": None
            },
            "validation_passed": False,
            "validation_error": f"Could not run tests: {error}"
        }