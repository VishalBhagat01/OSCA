import requests


def get_issue_details(owner: str, repo: str, issue_number: int):
    issue_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repo}/issues/{issue_number}"
    )

    comments_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repo}/issues/{issue_number}/comments"
    )

    issue_response = requests.get(issue_url)
    issue_response.raise_for_status()

    comments_response = requests.get(comments_url)
    comments_response.raise_for_status()

    issue = issue_response.json()
    comments = comments_response.json()

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
        ]
    }