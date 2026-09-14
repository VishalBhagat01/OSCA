import unittest
from agents.nodes.validators import validate_patch, is_test_file, extract_changed_files


class TestValidators(unittest.TestCase):

    def test_is_test_file(self):
        self.assertTrue(is_test_file("test_calc.py"))
        self.assertTrue(is_test_file("tests/test_runner.py"))
        self.assertTrue(is_test_file("src/sub/calc_test.py"))
        self.assertFalse(is_test_file("src/calc.py"))
        self.assertFalse(is_test_file("main.py"))

    def test_validate_patch_empty(self):
        res = validate_patch("", allowed_files=["src/app.py"])
        self.assertFalse(res["valid"])
        self.assertIn("empty", res["error"].lower())

    def test_validate_patch_invalid_format(self):
        res = validate_patch("Just some code without diff markers", allowed_files=["src/app.py"])
        self.assertFalse(res["valid"])
        self.assertIn("unified diff", res["error"].lower())

    def test_validate_patch_disallowed_files(self):
        diff = """--- a/secret.py\n+++ b/secret.py\n@@ -1 +1 @@\n-1\n+2"""
        res = validate_patch(diff, allowed_files=["src/app.py"])
        self.assertFalse(res["valid"])
        self.assertIn("outside allowed files", res["error"])

    def test_validate_patch_must_modify_source_file(self):
        diff = """--- a/tests/test_app.py\n+++ b/tests/test_app.py\n@@ -1 +1 @@\n-1\n+2"""
        res = validate_patch(diff, allowed_files=["tests/test_app.py"])
        self.assertFalse(res["valid"])
        self.assertIn("at least one non-test/source file", res["error"])

    def test_validate_patch_test_plan_requires_test_file(self):
        diff = """--- a/src/app.py\n+++ b/src/app.py\n@@ -1 +1 @@\n-1\n+2"""
        res = validate_patch(
            diff,
            allowed_files=["src/app.py", "tests/test_app.py"],
            test_plan=["Add unit tests for edge cases"],
        )
        self.assertFalse(res["valid"])
        self.assertIn("must modify at least one test file", res["error"])

    def test_validate_patch_valid(self):
        diff = """--- a/src/app.py
+++ b/src/app.py
@@ -1 +1 @@
-old
+new
--- a/tests/test_app.py
+++ b/tests/test_app.py
@@ -1 +1 @@
-test_old
+test_new"""
        res = validate_patch(
            diff,
            allowed_files=["src/app.py", "tests/test_app.py"],
            test_plan=["Add test"],
        )
        self.assertTrue(res["valid"])
        self.assertEqual(sorted(res["changed_files"]), sorted(["src/app.py", "tests/test_app.py"]))


if __name__ == "__main__":
    unittest.main()
