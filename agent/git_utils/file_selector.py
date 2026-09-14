import os
import re

SOURCE_EXTENSIONS = (
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".cpp", ".c", ".go", ".rs",
)

STOP_WORDS = frozenset({
    "the", "is", "a", "an", "and", "or", "to", "of", "in",
    "for", "with", "on", "this", "that", "it", "please",
    "issue", "bug", "fix", "add", "update", "when", "return",
    "sent", "from", "into", "have", "has", "had", "also",
    "but", "are", "was", "were", "you", "your", "they",
    "them", "we", "our", "now", "then", "than", "very",
    "more", "most", "some", "any", "all", "can", "could",
    "would", "should", "will", "may", "might", "make",
    "makes", "made", "use", "using", "used", "way", "right",
    "case", "cases", "lot", "sense", "imagine", "large",
    "multiple", "consisting", "account", "take", "handled",
})

GENERIC_KEYWORDS = frozenset({
    "error", "handling", "improve", "clearer",
    "message", "name", "names", "function",
    "functions", "application", "applications",
})

# Pre-compiled pattern for keyword extraction
_KEYWORD_PATTERN = re.compile(r"[a-zA-Z_][a-zA-Z0-9_/-]*")

# Translate issue concepts into likely codebase terms
_SEMANTIC_ALIASES = {
    "endpoint": ["route", "routing", "url", "view", "rule"],
    "endpoints": ["route", "routing", "url", "view", "rule"],
    "url": ["route", "routing", "rule"],
    "urls": ["route", "routing", "rule"],
    "dotted": ["blueprint", "endpoint", "routing"],
    "module": ["blueprint", "app", "scaffold"],
}


def extract_keywords(issue_title: str, issue_body: str) -> list[str]:
    text = f"{issue_title} {issue_body}".lower()

    words = _KEYWORD_PATTERN.findall(text)

    keywords = {
        word
        for word in words
        if word not in STOP_WORDS and len(word) > 2
    }

    expanded_keywords = set(keywords)
    for keyword in keywords:
        if keyword in _SEMANTIC_ALIASES:
            expanded_keywords.update(_SEMANTIC_ALIASES[keyword])

    return sorted(expanded_keywords)


def is_test_path(path: str) -> bool:
    normalized = path.lower().replace("\\", "/")
    filename = os.path.basename(normalized)
    return (
        normalized.startswith("tests/")
        or "/tests/" in normalized
        or filename.startswith("test_")
        or filename.endswith("_test.py")
    )


def select_relevant_files(
    repo_path: str,
    file_tree: list[str],
    keywords: list[str],
    limit: int = 8,
):
    scored_files = []

    for relative_path in file_tree:
        normalized_path = relative_path.lower().replace("\\", "/")

        if not normalized_path.endswith(SOURCE_EXTENSIONS):
            continue

        # Ignore generated/example code for core implementation search.
        if normalized_path.startswith("examples/"):
            continue

        full_path = os.path.join(repo_path, relative_path)

        try:
            if os.path.getsize(full_path) > 200_000:
                continue

            with open(
                full_path,
                "r",
                encoding="utf-8",
                errors="ignore",
            ) as file:
                content = file.read(30_000).lower()

        except OSError:
            continue

        path_score = 0
        content_score = 0

        for keyword in keywords:
            # Keyword in file/folder name is useful.
            if keyword in normalized_path:
                path_score += 4

            # Keyword inside source code is much stronger evidence.
            if keyword in content:
                content_score += 2

        score = path_score + content_score

        # Prefer source code directories.
        if normalized_path.startswith("src/"):
            score += 8

        # Tests are useful, but should not dominate implementation files.
        if is_test_path(normalized_path):
            score -= 2
        else:
            score += 2

        if score <= 0:
            continue

        scored_files.append({
            "path": relative_path,
            "score": score,
            "content": content[:12000],
        })

    scored_files.sort(key=lambda item: item["score"], reverse=True)

    source_files = [
        file for file in scored_files
        if not is_test_path(file["path"])
    ]

    test_files = [
        file for file in scored_files
        if is_test_path(file["path"])
    ]

    selected_files = source_files[:6]

    if test_files:
        selected_files.append(test_files[0])

    return selected_files[:limit]