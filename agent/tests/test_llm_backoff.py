import unittest
from unittest.mock import patch, MagicMock
from llm.llm_provider import _execute_with_backoff


class TestLLMBackoff(unittest.TestCase):

    @patch("llm.llm_provider.time.sleep")
    def test_backoff_on_429_retry_in_message(self, mock_sleep):
        calls = []

        def failing_func():
            if len(calls) < 2:
                calls.append("fail")
                raise Exception("HTTP 429 RESOURCE_EXHAUSTED: Quota exceeded. Please retry in 12.5s.")
            calls.append("success")
            return "OK"

        result = _execute_with_backoff(failing_func)
        self.assertEqual(result, "OK")
        self.assertEqual(len(calls), 3)

        # Verify sleep was called for polite pacing (0.5) and parsed retry delay (12.5 + 1.5 = 14.0)
        slept_times = [args[0] for args, _ in mock_sleep.call_args_list]
        self.assertIn(0.5, slept_times)
        self.assertIn(14.0, slept_times)

    @patch("llm.llm_provider.time.sleep")
    def test_backoff_on_503_unavailable(self, mock_sleep):
        calls = []

        def failing_503():
            if len(calls) < 1:
                calls.append("fail")
                raise Exception("HTTP 503 UNAVAILABLE: The model is overloaded. Please try again later.")
            calls.append("success")
            return "RECOVERED"

        result = _execute_with_backoff(failing_503)
        self.assertEqual(result, "RECOVERED")
        self.assertEqual(len(calls), 2)

    @patch("llm.llm_provider.time.sleep")
    def test_non_retryable_error_raises_immediately(self, mock_sleep):
        def bad_request():
            raise ValueError("Invalid parameter schema")

        with self.assertRaises(ValueError):
            _execute_with_backoff(bad_request)

        # Sleep called only for initial polite gap 0.5s once
        self.assertEqual(mock_sleep.call_count, 1)


if __name__ == "__main__":
    unittest.main()
