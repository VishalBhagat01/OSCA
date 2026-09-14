import unittest
from unittest.mock import patch, MagicMock
from agents.nodes.pr_metadata_generator import (
    sanitize_branch_name,
    generate_fallback_metadata,
    pr_metadata_generator_node,
    PRMetadataOutput,
)


class TestPRMetadata(unittest.TestCase):

    def test_sanitize_branch_name(self):
        # Basic sanitization
        self.assertEqual(
            sanitize_branch_name("fix/issue-12-hello-world"),
            "fix/issue-12-hello-world"
        )
        # Spaces and special characters
        self.assertEqual(
            sanitize_branch_name("feature: add new (parser) #12!", issue_number=12),
            "fix/feature-add-new-parser-12"
        )
        # Missing prefix
        self.assertTrue(
            sanitize_branch_name("my-custom-patch").startswith("fix/")
        )

    def test_generate_fallback_metadata(self):
        metadata = generate_fallback_metadata(
            issue_number=42,
            issue_title="Handle None in json parser",
            changed_files=["src/parser.py", "tests/test_parser.py"],
            plan_summary="Add None check before processing buffer",
            test_result={"success": True},
        )

        self.assertIn("branch_name", metadata)
        self.assertTrue(metadata["branch_name"].startswith("fix/issue-42"))
        self.assertIn("commit_message", metadata)
        self.assertIn("closes #42", metadata["commit_message"].lower())
        self.assertIn("pr_title", metadata)
        self.assertIn("pr_body", metadata)
        self.assertIn("Closes #42", metadata["pr_body"])
        self.assertIn("`src/parser.py`", metadata["pr_body"])

    @patch.dict("os.environ", {"OSA_PR_METADATA_LLM": "1"})
    @patch("agents.nodes.pr_metadata_generator.llm")
    def test_pr_metadata_generator_node_success(self, mock_llm):
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = PRMetadataOutput(
            branch_name="fix/issue-55-speedup",
            commit_message="fix: speedup string tokenization (closes #55)",
            pr_title="fix: optimize tokenizer regex",
            pr_body="## Summary\nOptimizes tokenization regex.\n\nCloses #55",
        )
        mock_llm.with_structured_output.return_value = mock_chain

        state = {
            "issue": {"number": 55, "title": "Speedup tokenizer", "body": "It is slow"},
            "plan": {"summary": "Replace regex with direct character scan"},
            "changed_files": ["tokenizers.py"],
            "test_result": {"success": True},
            "patch": "--- a/tokenizers.py\n+++ b/tokenizers.py\n@@ -1 +1 @@\n-old\n+new",
            "execution_trace": [],
        }

        updated_state = pr_metadata_generator_node(state)
        self.assertIn("pr_metadata", updated_state)
        self.assertEqual(updated_state["pr_metadata"]["branch_name"], "fix/issue-55-speedup")
        self.assertEqual(updated_state["pr_metadata"]["pr_title"], "fix: optimize tokenizer regex")

        # Execution trace event added
        events = updated_state["execution_trace"]
        self.assertTrue(any(e["node"] == "pr_metadata_generator" and e["status"] == "success" for e in events))


if __name__ == "__main__":
    unittest.main()
