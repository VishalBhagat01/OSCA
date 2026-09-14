import os
from git import Repo
from agents.planner_graph import planner_graph


def analyze_issue(
    issue,
    codebase,
    retry=False,
    feedback=None,
    previous_result=None,
    callback_url=None,
    callback_token=None,
):
    relevant_files = codebase.get("relevant_files", [])
    selected_files = [file["path"] for file in relevant_files]
    repo_path = codebase["repo_path"]

    # Preserve any previous retry trace if available
    previous_retry_trace = []
    if isinstance(previous_result, dict):
        proposed = previous_result.get("proposed_patch", {})
        previous_retry_trace = proposed.get("retry_trace", []) or previous_result.get("retry_trace", [])

    try:
        final_state = planner_graph.invoke(
            {
                "repo_path": repo_path,
                "codebase": codebase,
                "issue": {
                    "number": issue.get("number", 0),
                    "title": issue.get("title", ""),
                    "body": issue.get("body", ""),
                    "labels": issue.get("labels", []),
                    "comments": issue.get("comments", []),
                },
                "selected_files": selected_files,
                "retry": retry,
                "feedback": feedback,
                "previous_result": previous_result,
                "callback_url": callback_url,
                "callback_token": callback_token,
                "retry_count": 0,
                "max_retries": 3,
                "retry_trace": list(previous_retry_trace),
                "execution_trace": [],
            }
        )

        patch_success = (
            final_state.get("validation_passed", False)
            and final_state.get("patch_applied", False)
            and final_state.get("tests_passed", False)
            and final_state.get("acceptance_passed", final_state.get("tests_passed", False))
        )

        pr_metadata = final_state.get("pr_metadata", {})

        return {
            "analysis": final_state.get("plan", {}),
            "execution_trace": final_state.get("execution_trace", []),
            "pr_metadata": pr_metadata,
            "proposed_patch": {
                "can_generate_patch": patch_success,
                "reason": (
                    final_state.get("acceptance_error")
                    or final_state.get("validation_error")
                    or final_state.get("patch_error")
                    or final_state.get("test_error")
                ),
                "diff": final_state.get("patch", ""),
                "changed_files": final_state.get("changed_files", []),
                "patch_applied": final_state.get("patch_applied", False),
                "tests_passed": final_state.get("tests_passed", False),
                "test_result": final_state.get("test_result", {}),
                "retry_count": final_state.get("retry_count", 0),
                "retry_trace": final_state.get("retry_trace", []),
                "acceptance_passed": final_state.get("acceptance_passed", False),
                "acceptance_violations": final_state.get("acceptance_violations", []),
                "pr_metadata": pr_metadata,
            },
        }
    finally:
        # Guarantee workspace cleanliness strictly inside target repo_path without ascending
        try:
            if os.path.isdir(os.path.join(repo_path, ".git")):
                repo = Repo(repo_path, search_parent_directories=False)
                repo.git.reset("--hard", "HEAD")
        except Exception:
            pass
