from concurrent.futures import ThreadPoolExecutor
import requests
from config import settings

# Shared session for HTTP connection reuse (TCP keepalive)
_session = requests.Session()
_token = settings.github_token
if _token:
    _session.headers["Authorization"] = f"token {_token}"
_session.headers["Accept"] = "application/vnd.github.v3+json"


def _fetch_json(url: str) -> dict | list:
    """GET a URL and return parsed JSON."""
    response = _session.get(url, timeout=15)
    response.raise_for_status()
    return response.json()


def get_issue_details(owner: str, repo: str, issue_number: int) -> dict:
    """Fetch issue details and comments from GitHub API in parallel.

    Uses authenticated requests (5000 req/hr) when GITHUB_TOKEN is set,
    otherwise falls back to unauthenticated (60 req/hr).
    """
    base = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}"
    comments_url = f"{base}/comments?per_page=100"

    # Fetch issue + comments concurrently (~200-400ms saved)
    with ThreadPoolExecutor(max_workers=2) as pool:
        issue_future = pool.submit(_fetch_json, base)
        comments_future = pool.submit(_fetch_json, comments_url)

        issue = issue_future.result()
        comments = comments_future.result()

    return {
        "number": issue["number"],
        "title": issue["title"],
        "body": issue["body"] or "",
        "labels": [
            label["name"]
            for label in issue.get("labels", [])
        ],
        "comments": [
            comment["body"]
            for comment in comments
        ],
    }