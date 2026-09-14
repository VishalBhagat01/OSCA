import unittest
from agents.utils.fuzzy_patch import (
    fuzzy_find_window,
    apply_search_replace_block,
    parse_search_replace_blocks,
)


class TestFuzzyPatch(unittest.TestCase):

    def test_fuzzy_find_window_exact(self):
        file_lines = ["def hello():\n", "    print('world')\n", "    return True\n"]
        search_lines = ["    print('world')\n", "    return True\n"]
        span = fuzzy_find_window(file_lines, search_lines)
        self.assertIsNotNone(span)
        self.assertEqual(span, (1, 3))

    def test_fuzzy_find_window_whitespace_tolerant(self):
        file_lines = ["def hello():\n", "    print('world')\n", "    return True\n"]
        # Search lines have different indentation
        search_lines = ["  print('world')\n", "  return True\n"]
        span = fuzzy_find_window(file_lines, search_lines)
        self.assertIsNotNone(span)
        self.assertEqual(span, (1, 3))

    def test_apply_search_replace_block_exact(self):
        content = "def foo():\n    return False\n"
        search = "    return False"
        replace = "    return True"
        result = apply_search_replace_block(content, search, replace)
        self.assertIsNotNone(result)
        self.assertIn("return True", result)

    def test_apply_search_replace_block_fuzzy(self):
        content = "class A:\n    def run(self):\n        x = 1\n        return x\n"
        search = "  def run(self):\n    x = 1\n    return x\n"
        replace = "    def run(self):\n        x = 2\n        return x\n"
        result = apply_search_replace_block(content, search, replace)
        self.assertIsNotNone(result)
        self.assertIn("x = 2", result)

    def test_parse_search_replace_blocks(self):
        patch = """
File: src/core/router.py
<<<<<<< SEARCH
def route():
    pass
=======
def route():
    return "ok"
>>>>>>> REPLACE
"""
        blocks = parse_search_replace_blocks(patch)
        self.assertEqual(len(blocks), 1)
        self.assertEqual(blocks[0]["file"], "src/core/router.py")
        self.assertIn("def route():", blocks[0]["search"])
        self.assertIn('return "ok"', blocks[0]["replace"])


if __name__ == "__main__":
    unittest.main()
