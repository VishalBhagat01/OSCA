import unittest
from unittest.mock import patch, MagicMock
from agents.nodes.acceptance_validator import acceptance_validator_node, AcceptanceResult


class TestAcceptanceValidator(unittest.TestCase):

    @patch("agents.nodes.acceptance_validator.get_acceptance_llm")
    def test_acceptance_passes(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = AcceptanceResult(
            accepted=True,
            reason="Patch meets requirements",
            violations=[],
        )
        mock_get_llm.return_value = mock_llm

        state = {
            "issue": {"number": 1, "title": "Fix bug", "body": "Handle edge case"},
            "patch": "diff --git a/test.py b/test.py\n+fixed",
            "test_result": {"success": True, "stdout": "1 passed in 0.1s", "return_code": 0},
            "execution_trace": [],
        }

        result = acceptance_validator_node(state)
        self.assertTrue(result["acceptance_passed"])
        self.assertIsNone(result["acceptance_error"])
        self.assertEqual(len(result["execution_trace"]), 1)

    @patch("agents.nodes.acceptance_validator.get_acceptance_llm")
    def test_acceptance_fails(self, mock_get_llm):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = AcceptanceResult(
            accepted=False,
            reason="Patch does not handle negative values",
            violations=["Missing negative value handling"],
        )
        mock_get_llm.return_value = mock_llm

        state = {
            "issue": {"number": 2, "title": "Fix negative values", "body": "Must handle negatives"},
            "patch": "diff --git a/test.py b/test.py\n+fix",
            "test_result": {"success": True, "stdout": "1 passed in 0.1s", "return_code": 0},
            "retry_trace": [],
            "execution_trace": [],
        }

        result = acceptance_validator_node(state)
        self.assertFalse(result["acceptance_passed"])
        self.assertEqual(result["acceptance_error"], "Patch does not handle negative values")
        self.assertEqual(result["acceptance_violations"], ["Missing negative value handling"])


if __name__ == "__main__":
    unittest.main()
