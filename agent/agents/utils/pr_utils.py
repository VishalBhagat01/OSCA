"""PR and git branch utility helpers."""

import re


def sanitize_branch_name(name: str, issue_number: int | str = 0) -> str:
    """Sanitize a string into a valid, convention-compliant git branch name."""
    cleaned = re.sub(r"[^a-zA-Z0-9._/-]", "-", name.strip())
    cleaned = re.sub(r"-+", "-", cleaned)
    cleaned = cleaned.strip("-./")
    if not cleaned:
        cleaned = f"fix/issue-{issue_number}-patch"
    if not any(cleaned.startswith(prefix) for prefix in ("fix/", "feat/", "osa/")):
        cleaned = f"fix/{cleaned}"
    return cleaned[:80]


def slugify_title(title: str, max_length: int = 40) -> str:
    """Create a URL/git-friendly slug from an issue title."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")[:max_length]
    return slug or "patch"
