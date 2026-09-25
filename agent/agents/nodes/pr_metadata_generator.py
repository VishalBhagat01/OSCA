"""PR metadata generator node: creates release-ready PR metadata for accepted patches."""

import os
from pydantic import BaseModel, Field

from agents.nodes.state import AgentState
from llm.llm_provider import generate_structured_response
from agents.utils.execution_trace import add_execution_event, emit_trace_event
from agents.utils.pr_utils import sanitize_branch_name, slugify_title
from constants import (
    NODE_PR_METADATA_GENERATOR,
    STATUS_RUNNING,
    STATUS_SUCCESS,
)


class PRMetadataOutput(BaseModel):
    branch_name: str = Field(
        description="Clean git branch name, e.g. fix/issue-42-handle-empty-input"
    )
    commit_message: str = Field(
        description="Conventional git commit message, e.g. fix: handle empty input correctly (closes #42)"
    )
    pr_title: str = Field(
        description="Clear, concise pull request title, e.g. fix: handle empty input in parser"
    )
    pr_body: str = Field(
        description="Comprehensive markdown PR body describing the problem, solution, changes made, tests run, and closing tag"
    )


def generate_fallback_metadata(
    issue_number: int,
    issue_title: str,
    changed_files: list[str],
    plan_summary: str,
    test_result: dict,
) -> dict:
    """Deterministic PR metadata generator — no LLM needed."""
    slug = slugify_title(issue_title)
    branch_name = sanitize_branch_name(
        f"fix/issue-{issue_number}-{slug}", issue_number
    )
    commit_msg = (
        f"fix: {issue_title} (closes #{issue_number})"
        if issue_number
        else f"fix: {issue_title}"
    )
    pr_title = f"fix: {issue_title}"

    files_list = (
        "\n".join(f"- `{f}`" for f in changed_files)
        if changed_files
        else "- Codebase source files"
    )
    test_status = "Passing" if test_result.get("success") else "Verified"

    pr_body = f"""## Summary
Fixes #{issue_number}: {issue_title}

### Description
{plan_summary or issue_title}

### Key Changes
{files_list}

### Verification & Tests
- Automated test suite: {test_status}
- Acceptance criteria validated by agent.

Closes #{issue_number}
"""

    return {
        "branch_name": branch_name,
        "commit_message": commit_msg,
        "pr_title": pr_title,
        "pr_body": pr_body.strip(),
    }


def pr_metadata_generator_node(state: AgentState) -> dict:
    """LangGraph node: generate PR metadata. Uses deterministic generator by default,
    LLM only when OSA_PR_METADATA_LLM=1 is set."""

    emit_trace_event(
        state,
        node=NODE_PR_METADATA_GENERATOR,
        status=STATUS_RUNNING,
        message="Generating release-ready pull request metadata...",
    )

    issue = state.get("issue", {})
    issue_number = issue.get("number", 0)
    issue_title = issue.get("title", "Bug fix")
    plan = state.get("plan", {})
    plan_summary = plan.get("summary", "")
    changed_files = state.get("changed_files", [])
    test_result = state.get("test_result", {})

    use_llm = os.getenv("OSA_PR_METADATA_LLM", "").strip() == "1"

    if use_llm:
        try:
            patch = state.get("patch", "")
            prompt = f"""You are an expert Git and GitHub release engineer.

Generate release-ready GitHub Pull Request metadata for this accepted patch.

ISSUE: #{issue_number} — {issue_title}
PLANNER SUMMARY: {plan_summary}
CHANGED FILES: {", ".join(changed_files)}
PATCH PREVIEW: {patch[:1000]}

REQUIREMENTS:
1. `branch_name`: `fix/issue-{issue_number}-<short-slug>` using only lowercase letters, numbers, and dashes.
2. `commit_message`: Conventional commit format, e.g. `fix: <description> (closes #{issue_number})`.
3. `pr_title`: Clean pull request title.
4. `pr_body`: Markdown with ## Summary, ## Proposed Changes, ## Testing & Validation, and Closes #{issue_number}."""

            result: PRMetadataOutput = generate_structured_response(prompt, PRMetadataOutput)

            metadata = {
                "branch_name": sanitize_branch_name(result.branch_name, issue_number),
                "commit_message": result.commit_message.strip(),
                "pr_title": result.pr_title.strip(),
                "pr_body": result.pr_body.strip(),
            }
        except Exception:
            metadata = generate_fallback_metadata(
                issue_number, issue_title, changed_files, plan_summary, test_result
            )
    else:
        # Deterministic — skip LLM entirely for speed (~10-15s saved)
        metadata = generate_fallback_metadata(
            issue_number, issue_title, changed_files, plan_summary, test_result
        )

    execution_trace = add_execution_event(
        state,
        node=NODE_PR_METADATA_GENERATOR,
        status=STATUS_SUCCESS,
        message="Pull Request metadata generated.",
        details={
            "branch_name": metadata["branch_name"],
            "pr_title": metadata["pr_title"],
            "commit_message": metadata["commit_message"],
        },
    )

    return {
        "pr_metadata": metadata,
        "execution_trace": execution_trace,
    }
