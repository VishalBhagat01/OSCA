import subprocess

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace


def run_command(
    command: list[str],
    repo_path: str
) -> dict:
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


def test_runner_node(state: AgentState) -> dict:
    repo_path = state["repo_path"]

    try:
        result = run_command(
            ["pytest", "-q"],
            repo_path
        )

        if not result["success"]:
            error_output = (
                result["stderr"]
                or result["stdout"]
                or "Tests failed with no output."
            )

            return {
                **state,
                "tests_passed": False,
                "test_result": result,
                "test_error": error_output,
                "retry_trace": add_retry_trace(
                    state,
                    stage="tests",
                    error=error_output
                )
            }

        return {
            **state,
            "tests_passed": True,
            "test_result": result,
            "test_error": None,
            "retry_trace": add_retry_trace(
                state,
                stage="success",
                error=None
            )
        }

    except subprocess.TimeoutExpired:
        error = "Test execution timed out after 60 seconds."

        return {
            **state,
            "tests_passed": False,
            "test_result": {
                "success": False,
                "stdout": "",
                "stderr": error,
                "return_code": None
            },
            "test_error": error,
            "retry_trace": add_retry_trace(
                state,
                stage="tests",
                error=error
            )
        }

    except Exception as error:
        error_message = f"Could not run tests: {error}"

        return {
            **state,
            "tests_passed": False,
            "test_result": {
                "success": False,
                "stdout": "",
                "stderr": str(error),
                "return_code": None
            },
            "test_error": error_message,
            "retry_trace": add_retry_trace(
                state,
                stage="tests",
                error=error_message
            )
        }