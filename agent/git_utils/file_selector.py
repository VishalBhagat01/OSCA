import os
import re


SOURCE_EXTENSIONS = (
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".cpp", ".c", ".go", ".rs"
)

STOP_WORDS = {
    "the", "is", "a", "an", "and", "or", "to", "of",
    "in", "for", "with", "on", "this", "that", "it",
    "please", "issue", "bug", "fix", "add", "update",
    "when", "return", "sent"
}

GENERIC_KEYWORDS = {
    "error", "handling", "improve", "clearer",
    "message"
}


def extract_keywords(issue_title: str, issue_body: str) -> list[str]:
    text = f"{issue_title} {issue_body}".lower()

    words = re.findall(r"[a-zA-Z_][a-zA-Z0-9_/-]*", text)

    keywords = {
        word
        for word in words
        if word not in STOP_WORDS and len(word) > 2
    }

    return list(keywords)


def select_relevant_files(
    repo_path: str,
    file_tree: list[str],
    keywords: list[str],
    limit: int = 8
):
    scored_files = []

    for relative_path in file_tree:
        lower_path = relative_path.lower().replace("\\", "/")

        if not lower_path.endswith(SOURCE_EXTENSIONS):
            continue

        score = 0

        for keyword in keywords:
            if keyword not in lower_path:
                continue

            if keyword in GENERIC_KEYWORDS:
                score += 1
            else:
                score += 8

        # Tests remain useful, but source code gets priority.
        if "/tests/" in f"/{lower_path}":
            score -= 2

        if os.path.basename(lower_path).startswith("test_"):
            score += 2

        if score <= 0:
            continue

        full_path = os.path.join(repo_path, relative_path)

        try:
            if os.path.getsize(full_path) > 200_000:
                continue
        except OSError:
            continue

        scored_files.append({
            "path": relative_path,
            "score": score
        })

    scored_files.sort(key=lambda item: item["score"], reverse=True)

    selected_files = []

    for item in scored_files[:limit]:
        full_path = os.path.join(repo_path, item["path"])

        try:
            with open(
                full_path,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:
                selected_files.append({
                    "path": item["path"],
                    "score": item["score"],
                    "content": file.read()[:12000]
                })
        except OSError:
            continue

    return selected_files