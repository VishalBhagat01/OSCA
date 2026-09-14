from langgraph.graph import StateGraph, END

from agents.nodes.state import AgentState
from agents.nodes.planner import planner_node, should_generate_patch
from agents.nodes.patch_generator import patch_generator_node
from agents.nodes.validators import validation_node
from agents.nodes.patch_applier import patch_applier_node
from agents.nodes.test_runner import test_runner_node
from agents.nodes.acceptance_validator import acceptance_validator_node
from agents.nodes.pr_metadata_generator import pr_metadata_generator_node


def retries_exhausted(state: AgentState) -> bool:
    """Shared guard: True when retry budget is spent."""
    return state.get("retry_count", 0) >= state.get("max_retries", 3)


def _route_on_success_or_retry(
    state: AgentState,
    success_key: str,
    success_target: str,
) -> str:
    """Reusable routing: advance on success, retry or end on failure."""
    if state.get(success_key, False):
        return success_target
    return END if retries_exhausted(state) else "patch_generator"


def route_after_validation(state: AgentState) -> str:
    return _route_on_success_or_retry(state, "validation_passed", "patch_applier")


def route_after_patch_apply(state: AgentState) -> str:
    return _route_on_success_or_retry(state, "patch_applied", "test_runner")


def route_after_tests(state: AgentState) -> str:
    """Fast-path: skip acceptance validator on first successful attempt.

    If tests pass on the first try (retry_count == 1), go directly to
    PR metadata generation — saves one full LLM round-trip (~10-30s).
    On retries, the acceptance validator still runs for extra rigor.
    """
    if not state.get("tests_passed", False):
        return END if retries_exhausted(state) else "patch_generator"

    # First-pass success → skip acceptance, go straight to PR metadata
    if state.get("retry_count", 0) <= 1:
        return "pr_metadata_generator"

    # Retry success → run acceptance for validation rigor
    return "acceptance_validator"


def route_after_acceptance(state: AgentState) -> str:
    return _route_on_success_or_retry(state, "acceptance_passed", "pr_metadata_generator")


def create_planner_graph():
    graph = StateGraph(AgentState)

    graph.add_node("planner", planner_node)
    graph.add_node("patch_generator", patch_generator_node)
    graph.add_node("validator", validation_node)
    graph.add_node("patch_applier", patch_applier_node)
    graph.add_node("test_runner", test_runner_node)
    graph.add_node("acceptance_validator", acceptance_validator_node)
    graph.add_node("pr_metadata_generator", pr_metadata_generator_node)

    graph.set_entry_point("planner")

    graph.add_conditional_edges(
        "planner",
        should_generate_patch,
        {"generate_patch": "patch_generator", "finish": END},
    )
    graph.add_edge("patch_generator", "validator")

    graph.add_conditional_edges("validator", route_after_validation, {
        "patch_generator": "patch_generator",
        "patch_applier": "patch_applier",
        END: END,
    })
    graph.add_conditional_edges("patch_applier", route_after_patch_apply, {
        "patch_generator": "patch_generator",
        "test_runner": "test_runner",
        END: END,
    })
    graph.add_conditional_edges("test_runner", route_after_tests, {
        "patch_generator": "patch_generator",
        "acceptance_validator": "acceptance_validator",
        "pr_metadata_generator": "pr_metadata_generator",
        END: END,
    })
    graph.add_conditional_edges("acceptance_validator", route_after_acceptance, {
        "patch_generator": "patch_generator",
        "pr_metadata_generator": "pr_metadata_generator",
        END: END,
    })
    graph.add_edge("pr_metadata_generator", END)

    return graph.compile()


planner_graph = create_planner_graph()
