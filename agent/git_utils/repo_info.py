from github import Github
from dotenv import load_dotenv
import os

load_dotenv()

token = os.getenv("GITHUB_TOKEN")
git = Github(token)

def repo_info(data: dict):

    repo_url = data["repo_url"]

    parts = repo_url.rstrip("/").split("/")

    owner = parts[-2]
    repo_name = parts[-1].replace(".git", "")

    repo = git.get_repo(f"{owner}/{repo_name}")

    issues = []

    for issue in repo.get_issues(state="open")[:10]:

        if issue.pull_request:
            continue

        issues.append({
            "number": issue.number,
            "title": issue.title
        })

    return {
        "name": repo.name,
        "description": repo.description,
        "stars": repo.stargazers_count,
        "issues": issues
    } 