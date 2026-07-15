from agents.planner_graph import planner_graph


def analyze_issue(issue: dict, codebase: dict) -> dict:
    relevant_files = codebase.get("relevant_files", [])

    selected_files = [
        file["path"]
        for file in relevant_files
    ]

    final_state = planner_graph.invoke(
        {
            "repo_path": codebase["repo_path"],
            "codebase": codebase,
            "issue": {
                "title": issue.get("issue_title", ""),
                "body": issue.get("issue_body", ""),
                "labels": issue.get("labels", []),
                "comments": issue.get("comments", [])
            },
            "selected_files": selected_files,
            "retry_count": 0,
            "max_retries": 4,
            "retry_trace": []
        }
    )

    patch_success = (
        final_state.get(
            "validation_passed",
            False
        )
        and final_state.get(
            "patch_applied",
            False
        )
        and final_state.get(
            "tests_passed",
            False
        )
        and final_state.get(
            "acceptance_passed",
            False
        )
    )

    return {
        "analysis": final_state.get("plan", {}),
        "proposed_patch": {
            "can_generate_patch": patch_success,
            "reason": (
                final_state.get("acceptance_error")
                or final_state.get("validation_error")
                or final_state.get("patch_error")
                or final_state.get("test_error")
            ),
            "diff": final_state.get("patch", ""),
            "changed_files": final_state.get(
                "changed_files",
                []
            ),
            "patch_applied": final_state.get(
                "patch_applied",
                False
            ),
            "tests_passed": final_state.get(
                "tests_passed",
                False
            ),
            "test_result": final_state.get(
                "test_result",
                {}
            ),
            "retry_count": final_state.get(
                "retry_count",
                0
            ),
            "retry_trace": final_state.get(
                "retry_trace",
                []
            ),
            "acceptance_passed": final_state.get(
                "acceptance_passed",
                False
            ),
            "acceptance_violations": final_state.get(
                "acceptance_violations",
                []
            ),
        }
    }