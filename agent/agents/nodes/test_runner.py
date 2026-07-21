import subprocess
import sys

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event

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

    test_result = run_command(
        [sys.executable, "-m", "pytest"],
        repo_path,
    )

    tests_passed = test_result.get(
        "success",
        False,
    )

    test_error = None

    if not tests_passed:
        test_error = (
            test_result.get("stderr")
            or test_result.get("stdout")
            or "Tests failed."
        )

    updated_state = {
        **state,
        "tests_passed": tests_passed,
        "test_result": test_result,
        "test_error": test_error,
    }

    if not tests_passed:
        updated_state["retry_trace"] = (
            add_retry_trace(
                updated_state,
                stage="tests",
                error=test_error,
            )
        )

        updated_state["execution_trace"] = (
            add_execution_event(
                updated_state,
                node="test_runner",
                status="failed",
                message="Test execution failed.",
                details={
                    "error": test_error,
                    "return_code": test_result.get(
                        "return_code"
                    ),
                },
            )
        )

        return updated_state

    updated_state["execution_trace"] = (
        add_execution_event(
            updated_state,
            node="test_runner",
            status="success",
            message="All tests passed.",
            details={
                "stdout": test_result.get(
                    "stdout",
                    ""
                ),
                "return_code": test_result.get(
                    "return_code"
                ),
            },
        )
    )

    return updated_state