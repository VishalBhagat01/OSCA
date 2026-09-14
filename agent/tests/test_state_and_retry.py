import unittest
from agents.utils.retry_trace import add_retry_trace
from agents.utils.execution_trace import add_execution_event


class TestStateAndRetry(unittest.TestCase):

    def test_add_retry_trace(self):
        state = {
            "retry_count": 2,
            "retry_trace": [
                {"attempt": 1, "stage": "validation", "error": "Diff format error"}
            ]
        }
        updated_trace = add_retry_trace(state, stage="tests", error="Test assertion failed")
        self.assertEqual(len(updated_trace), 2)
        self.assertEqual(updated_trace[-1]["attempt"], 2)
        self.assertEqual(updated_trace[-1]["stage"], "tests")
        self.assertEqual(updated_trace[-1]["error"], "Test assertion failed")

    def test_add_execution_event(self):
        state = {
            "execution_trace": []
        }
        updated_trace = add_execution_event(
            state,
            node="planner",
            status="success",
            message="Plan created",
            details={"difficulty": "easy"}
        )
        self.assertEqual(len(updated_trace), 1)
        self.assertEqual(updated_trace[0]["node"], "planner")
        self.assertEqual(updated_trace[0]["status"], "success")
        self.assertIn("timestamp", updated_trace[0])


if __name__ == "__main__":
    unittest.main()
