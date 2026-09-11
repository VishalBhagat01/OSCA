import subprocess
import sys
import json
from pathlib import Path

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event

def run_command(
    command: list[str],
    repo_path: str
) -> dict:
    try:
        result = subprocess.run(
            command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=60
        )
    except subprocess.TimeoutExpired as error:
        return {
            "success": False,
            "stdout": error.stdout or "",
            "stderr": "Test command timed out after 60 seconds.",
            "return_code": None,
        }

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode
    }


def detect_test_command(repo_path: str) -> list[str] | None:
    root = Path(repo_path)

    if any((root / name).exists() for name in ("pytest.ini", "pyproject.toml", "setup.cfg", "tests")):
        return [sys.executable, "-m", "pytest"]

    package_json = root / "package.json"
    if package_json.is_file():
        try:
            scripts = json.loads(package_json.read_text(encoding="utf-8")).get("scripts", {})
            # npm invokes the package's declared test command without a shell here.
            if scripts.get("test"):
                return ["npm", "test", "--", "--run"]
        except (OSError, json.JSONDecodeError):
            pass

    return None


def test_runner_node(state: AgentState) -> dict:
    repo_path = state["repo_path"]

    command = detect_test_command(repo_path)
    if not command:
        test_result = {
            "success": False,
            "stdout": "",
            "stderr": "No supported test command was detected. Supported project types are Python and npm projects with a test script.",
            "return_code": None,
        }
    else:
        test_result = run_command(command, repo_path)

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
                "command": command,
            },
        )
    )

    return updated_state
