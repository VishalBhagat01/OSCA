import unittest
from agents.nodes.state import AgentState
from agents.planner_graph import (
    retries_exhausted,
    route_after_validation,
    route_after_patch_apply,
    route_after_tests,
    route_after_acceptance,
)
from agents.nodes.planner import should_generate_patch
from langgraph.graph import END


class TestLangGraphRouting(unittest.TestCase):

    def test_retries_exhausted(self):
        state_under_limit: AgentState = {"retry_count": 1, "max_retries": 3}
        self.assertFalse(retries_exhausted(state_under_limit))

        state_at_limit: AgentState = {"retry_count": 3, "max_retries": 3}
        self.assertTrue(retries_exhausted(state_at_limit))

        state_over_limit: AgentState = {"retry_count": 4, "max_retries": 3}
        self.assertTrue(retries_exhausted(state_over_limit))

    def test_route_after_validation(self):
        # When passed, goes to patch_applier
        state_passed: AgentState = {"validation_passed": True, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_validation(state_passed), "patch_applier")

        # When failed but retries remain, loops back to patch_generator
        state_failed_retry: AgentState = {"validation_passed": False, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_validation(state_failed_retry), "patch_generator")

        # When failed and retries exhausted, routes to END
        state_failed_exhausted: AgentState = {"validation_passed": False, "retry_count": 3, "max_retries": 3}
        self.assertEqual(route_after_validation(state_failed_exhausted), END)

    def test_route_after_patch_apply(self):
        # When applied, goes to test_runner
        state_applied: AgentState = {"patch_applied": True, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_patch_apply(state_applied), "test_runner")

        # When apply failed but retries remain, loops back to patch_generator
        state_apply_failed: AgentState = {"patch_applied": False, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_patch_apply(state_apply_failed), "patch_generator")

        # When apply failed and retries exhausted, routes to END
        state_apply_exhausted: AgentState = {"patch_applied": False, "retry_count": 3, "max_retries": 3}
        self.assertEqual(route_after_patch_apply(state_apply_exhausted), END)

    def test_route_after_tests(self):
        # First-pass success (retry_count <= 1): fast-path skips acceptance
        state_tests_pass_first: AgentState = {"tests_passed": True, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_tests(state_tests_pass_first), "pr_metadata_generator")

        # Retry success (retry_count > 1): goes through acceptance validator
        state_tests_pass_retry: AgentState = {"tests_passed": True, "retry_count": 2, "max_retries": 3}
        self.assertEqual(route_after_tests(state_tests_pass_retry), "acceptance_validator")

        # When tests fail with retries remaining, loops back to patch_generator
        state_tests_fail: AgentState = {"tests_passed": False, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_tests(state_tests_fail), "patch_generator")

        # When tests fail and retries exhausted, routes to END
        state_tests_exhausted: AgentState = {"tests_passed": False, "retry_count": 3, "max_retries": 3}
        self.assertEqual(route_after_tests(state_tests_exhausted), END)

    def test_route_after_acceptance(self):
        # When acceptance passes, routes to pr_metadata_generator
        state_acc_pass: AgentState = {"acceptance_passed": True, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_acceptance(state_acc_pass), "pr_metadata_generator")

        # When acceptance fails with retries remaining, loops back to patch_generator
        state_acc_fail: AgentState = {"acceptance_passed": False, "retry_count": 1, "max_retries": 3}
        self.assertEqual(route_after_acceptance(state_acc_fail), "patch_generator")

        # When acceptance fails and retries exhausted, routes to END
        state_acc_exhausted: AgentState = {"acceptance_passed": False, "retry_count": 3, "max_retries": 3}
        self.assertEqual(route_after_acceptance(state_acc_exhausted), END)

    def test_should_generate_patch(self):
        # Actionable bug with 'plan' key
        state_plan: AgentState = {
            "plan": {"issue_type": "actionable_bug", "needs_human_clarification": False}
        }
        self.assertEqual(should_generate_patch(state_plan), "generate_patch")

        # Actionable feature with 'analysis' key (backwards compatibility)
        state_analysis: AgentState = {
            "analysis": {"issue_type": "actionable_feature", "needs_human_clarification": False}
        }
        self.assertEqual(should_generate_patch(state_analysis), "generate_patch")

        # Empty state or non-actionable
        state_empty: AgentState = {}
        self.assertEqual(should_generate_patch(state_empty), "finish")

        # Needs human clarification
        state_clarify: AgentState = {
            "plan": {"issue_type": "actionable_bug", "needs_human_clarification": True}
        }
        self.assertEqual(should_generate_patch(state_clarify), "finish")


if __name__ == "__main__":
    unittest.main()
