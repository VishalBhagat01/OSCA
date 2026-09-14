import unittest
from git_utils.ast_skeletonizer import skeletonize_python, skeletonize_code


class TestASTSkeletonizer(unittest.TestCase):

    def test_skeletonize_python(self):
        code = """import os

class Router:
    '''Routing core.'''
    prefix: str = ""

    def __init__(self, prefix: str = ""):
        self.prefix = prefix
        self.routes = []
        for i in range(100):
            self.routes.append(i)

    def add_route(self, path: str, handler):
        '''Add route handler.'''
        if not path:
            raise ValueError("empty")
        self.routes.append((path, handler))
"""
        skeleton = skeletonize_python(code)
        self.assertIsNotNone(skeleton)
        self.assertIn("class Router:", skeleton)
        self.assertIn("def __init__(self, prefix: str", skeleton)
        self.assertIn("def add_route(self, path: str, handler):", skeleton)
        # Verify function body loop was collapsed
        self.assertNotIn("for i in range(100):", skeleton)
        self.assertIn("...", skeleton)

    def test_skeletonize_code_js(self):
        js_code = """
import express from 'express';

export class AppController {
    constructor() {
        this.app = express();
    }

    async startServer(port) {
        console.log("Starting server on port " + port);
        return this.app.listen(port);
    }
}
""" * 5
        skeleton = skeletonize_code("controller.js", js_code)
        self.assertIn("export class AppController", skeleton)
        self.assertIn("async startServer(port)", skeleton)
        self.assertLess(len(skeleton), len(js_code))


if __name__ == "__main__":
    unittest.main()
