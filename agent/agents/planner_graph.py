from langgraph.graph import StateGraph, END

from agents.nodes.state import AgentState
from agents.nodes.planner import planner_node
from agents.nodes.patch_generator import patch_generator_node
from agents.nodes.validators import validation_node
from agents.nodes.patch_applier import patch_applier_node
from agents.nodes.test_runner import test_runner_node


def route_after_validation(state: AgentState) -> str:
    if state.get("validation_passed"):
        return "patch_applier"

    if state.get("retry_count", 0) >= state.get("max_retries", 3):
        return END

    return "patch_generator"


def route_after_patch_apply(state: AgentState) -> str:
    if state.get("patch_applied"):
        return "test_runner"

    if state.get("retry_count", 0) >= state.get("max_retries", 3):
        return END

    return "patch_generator"


def route_after_tests(state: AgentState) -> str:
    if state.get("tests_passed"):
        return END

    if state.get("retry_count", 0) >= state.get("max_retries", 3):
        return END

    return "patch_generator"


def create_planner_graph():
    graph = StateGraph(AgentState)

    graph.add_node("planner", planner_node)
    graph.add_node("patch_generator", patch_generator_node)
    graph.add_node("validator", validation_node)
    graph.add_node("patch_applier", patch_applier_node)
    graph.add_node("test_runner", test_runner_node)

    graph.set_entry_point("planner")

    graph.add_edge("planner", "patch_generator")
    graph.add_edge("patch_generator", "validator")

    graph.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "patch_generator": "patch_generator",
            "patch_applier": "patch_applier",
            END: END,
        },
    )

    graph.add_conditional_edges(
        "patch_applier",
        route_after_patch_apply,
        {
            "patch_generator": "patch_generator",
            "test_runner": "test_runner",
            END: END,
        },
    )

    graph.add_conditional_edges(
        "test_runner",
        route_after_tests,
        {
            "patch_generator": "patch_generator",
            END: END,
        },
    )

    return graph.compile()


planner_graph = create_planner_graph()