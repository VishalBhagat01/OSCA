import subprocess
import sys
import json
from pathlib import Path

from agents.nodes.state import AgentState
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event, emit_trace_event


def run_command(command: list[str], repo_path: str) -> dict:
    """Run a test command with timeout and structured result."""
    try:
        use_shell = sys.platform == "win32" and command[0].endswith((".cmd", ".bat"))
        result = subprocess.run(
            command,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30,
            shell=use_shell,
        )
    except subprocess.TimeoutExpired as error:
        return {
            "success": False,
            "stdout": error.stdout or "",
            "stderr": "Test command timed out after 30 seconds.",
            "return_code": None,
        }
    except Exception as error:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Failed to execute test command: {error}",
            "return_code": None,
        }

    # Pytest return codes: 0 = passed, 5 = no tests collected
    stdout_lower = (result.stdout or "").lower()
    no_tests_collected = (
        result.returncode == 5
        or "collected 0 items" in stdout_lower
        or "no tests ran" in stdout_lower
    )
    success = (result.returncode == 0) or no_tests_collected

    return {
        "success": success,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "return_code": result.returncode,
    }


def detect_test_command(repo_path: str, target_test_file: str | None = None) -> list[str] | None:
    """Auto-detect the test command for a repository.
    Checks for Python tests first, then Node.js tests.
    If target_test_file is provided, runs only that test file for ultra-fast TIA."""
    root = Path(repo_path)

    # 1. Look for Python test files
    try:
        py_test_files = (
            list(root.glob("test_*.py"))
            + list(root.glob("*_test.py"))
            + list(root.glob("**/test_*.py"))
            + list(root.glob("**/*_test.py"))
        )
        py_test_files = [
            f for f in py_test_files
            if not any(
                part in (".git", "venv", ".venv", "node_modules", "__pycache__")
                for part in f.parts
            )
        ]
    except Exception:
        py_test_files = []

    has_py_test_configs = any(
        (root / name).exists()
        for name in ("pytest.ini", "pyproject.toml", "setup.cfg", "setup.py", "tox.ini")
    )
    has_tests_dir = (root / "tests").is_dir() or (root / "test").is_dir()

    if py_test_files or has_py_test_configs or has_tests_dir:
        base_cmd = [sys.executable, "-m", "pytest", "-v"]
        if target_test_file and (root / target_test_file).is_file():
            base_cmd.append(target_test_file)
        return base_cmd

    # 2. Node/JS project test detection
    package_json = root / "package.json"
    if package_json.is_file():
        try:
            scripts = json.loads(
                package_json.read_text(encoding="utf-8")
            ).get("scripts", {})
            if scripts.get("test"):
                npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
                cmd = [npm_cmd, "test"]
                if target_test_file:
                    cmd.extend(["--", target_test_file])
                return cmd
        except (OSError, json.JSONDecodeError):
            pass

    # 3. Fallback: any Python files present
    try:
        py_files = [
            f for f in root.glob("*.py")
            if not any(part in (".git", "venv", ".venv") for part in f.parts)
        ]
        if py_files:
            base_cmd = [sys.executable, "-m", "pytest", "-v"]
            if target_test_file and (root / target_test_file).is_file():
                base_cmd.append(target_test_file)
            return base_cmd
    except Exception:
        pass

    return None


def test_runner_node(state: AgentState) -> dict:
    """LangGraph node: run tests and return only changed keys."""

    repo_path = state["repo_path"]

    # Target specific test file on retries for fast feedback loop
    target_test_file = None
    if state.get("retry_count", 0) > 0:
        candidates = state.get("changed_files", []) + [
            f["path"] if isinstance(f, dict) else f
            for f in state.get("codebase", {}).get("relevant_files", [])
        ]
        for p in candidates:
            norm = p.lower().replace("\\", "/")
            if "test" in norm and (norm.endswith(".py") or norm.endswith(".js")):
                if (Path(repo_path) / p).is_file():
                    target_test_file = p
                    break

    command = detect_test_command(repo_path, target_test_file=target_test_file)
    cmd_str = " ".join(command) if command else "heuristics"
    emit_trace_event(
        state,
        node="test_runner",
        status="running",
        message=f"Executing automated test suite ({cmd_str})...",
        details={"command": command},
    )

    if not command:
        test_result = {
            "success": True,
            "stdout": "No automated test suite detected. Passing to acceptance criteria validator.",
            "stderr": "",
            "return_code": 0,
        }
    else:
        test_result = run_command(command, repo_path)

    tests_passed = test_result.get("success", False)
    test_error = None

    if not tests_passed:
        test_error = (
            test_result.get("stderr")
            or test_result.get("stdout")
            or "Tests failed."
        )

    # Build return dict with only changed keys
    result = {
        "tests_passed": tests_passed,
        "test_result": test_result,
        "test_error": test_error,
    }

    if not tests_passed:
        result["retry_trace"] = add_retry_trace(
            state, stage="tests", error=test_error,
        )
        result["execution_trace"] = add_execution_event(
            state,
            node="test_runner",
            status="failed",
            message="Test execution failed.",
            details={
                "error": test_error,
                "return_code": test_result.get("return_code"),
            },
        )
    else:
        result["execution_trace"] = add_execution_event(
            state,
            node="test_runner",
            status="success",
            message="All tests passed.",
            details={
                "stdout": test_result.get("stdout", ""),
                "return_code": test_result.get("return_code"),
                "command": command,
            },
        )

    return result
