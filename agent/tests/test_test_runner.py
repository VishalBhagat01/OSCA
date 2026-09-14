import tempfile
import unittest
from pathlib import Path
from agents.nodes.test_runner import detect_test_command


class TestTestRunnerDetection(unittest.TestCase):

    def test_detect_python_root_test_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "calculator.py").write_text("def add(a, b): return a + b\n")
            (Path(tmpdir) / "test_calculator.py").write_text("def test_add(): assert True\n")

            cmd = detect_test_command(tmpdir)
            self.assertIsNotNone(cmd)
            self.assertIn("pytest", cmd[2] if len(cmd) > 2 else cmd[1])

    def test_detect_python_tests_directory(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            test_dir = Path(tmpdir) / "tests"
            test_dir.mkdir()
            (test_dir / "test_app.py").write_text("def test_app(): pass\n")

            cmd = detect_test_command(tmpdir)
            self.assertIsNotNone(cmd)
            self.assertIn("pytest", cmd[2] if len(cmd) > 2 else cmd[1])

    def test_detect_python_ini_config(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "pytest.ini").write_text("[pytest]\n")

            cmd = detect_test_command(tmpdir)
            self.assertIsNotNone(cmd)

    def test_detect_npm_package_json(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "package.json").write_text('{"scripts": {"test": "node --test"}}\n')

            cmd = detect_test_command(tmpdir)
            self.assertIsNotNone(cmd)
            self.assertIn("test", cmd)

    def test_detect_empty_repo_fallback(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            (Path(tmpdir) / "README.md").write_text("# Hello\n")

            cmd = detect_test_command(tmpdir)
            self.assertIsNone(cmd)
