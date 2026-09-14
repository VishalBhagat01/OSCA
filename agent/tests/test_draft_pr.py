import unittest
from unittest.mock import patch, MagicMock
from agents.nodes.draft_pr import (
    generate_fallback_draft,
    generate_pr_draft,
    draft_pr_node,
    PRDraftOutput,
)


class TestDraftPR(unittest.TestCase):

    def test_generate_fallback_draft(self):
        draft = generate_fallback_draft(
            issue_number=42,
            issue_title="Handle empty route in blueprint",
            changed_files=["src/blueprint.py"],
            patch="diff --git a/src/blueprint.py...",
            human_feedback="Ensure edge cases with trailing slashes are noted.",
            test_summary="1 passed in 0.05s",
        )

        self.assertIn("branch_name", draft)
        self.assertTrue(draft["branch_name"].startswith("fix/issue-42"))
        self.assertEqual(draft["is_draft"], True)
        self.assertIn("pr_title", draft)
        self.assertIn("pr_body", draft)
        self.assertIn("Ensure edge cases with trailing slashes are noted.", draft["pr_body"])
        self.assertIn("Closes #42", draft["pr_body"])

    @patch.dict("os.environ", {"OSA_PR_METADATA_LLM": "1"})
    @patch("agents.nodes.draft_pr.llm")
    def test_draft_pr_node_with_llm(self, mock_llm):
        mock_chain = MagicMock()
        mock_chain.invoke.return_value = PRDraftOutput(
            branch_name="fix/issue-42-route-fix",
            commit_message="fix(routing): handle empty route in blueprint (closes #42)",
            pr_title="fix(routing): handle empty route in blueprint (#42)",
            pr_body="### 🎯 Overview\nFixes empty route.\n\n### 👤 Human Reviewer Sign-Off\nApproved.",
            is_draft=True,
        )
        mock_llm.with_structured_output.return_value = mock_chain

        state = {
            "issue": {"number": 42, "title": "Handle empty route", "body": "Crashes on empty path"},
            "changed_files": ["src/blueprint.py"],
            "patch": "diff --git a/src/blueprint.py...",
            "feedback": "LGTM!",
            "test_result": {"success": True, "stdout": "1 passed"},
            "execution_trace": [],
        }

        result = draft_pr_node(state)
        self.assertIn("pr_metadata", result)
        self.assertTrue(result["pr_metadata"]["is_draft"])
        self.assertEqual(result["pr_metadata"]["pr_title"], "fix(routing): handle empty route in blueprint (#42)")
        self.assertTrue(any(e["node"] == "draft_pr" and e["status"] == "success" for e in result["execution_trace"]))


if __name__ == "__main__":
    unittest.main()
