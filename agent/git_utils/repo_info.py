import os

from github import Github


from config import settings

_github_client: Github | None = None


def _get_github_client() -> Github:
    """Lazy-initialize the GitHub client to avoid module-level side effects."""
    global _github_client
    if _github_client is None:
        token = settings.github_token or None
        _github_client = Github(token)
    return _github_client


def repo_info(data: dict):
    repo_url = data["repo_url"]

    parts = repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo_name = parts[-1].replace(".git", "")

    git = _get_github_client()
    repo = git.get_repo(f"{owner}/{repo_name}")

    issues = []
    for issue in repo.get_issues(state="open").get_page(0)[:10]:
        if issue.pull_request:
            continue

        issues.append({
            "number": issue.number,
            "title": issue.title,
        })

    return {
        "name": repo.name,
        "description": repo.description,
        "stars": repo.stargazers_count,
        "issues": issues,
    }