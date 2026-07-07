def analyze_issue(issue: dict, codebase: dict):
    important_files = codebase.get("important_files", {})
    relevant_files = codebase.get("relevant_files", [])

    # Detect stack from root dependency/config files
    tech_stack = []

    if "package.json" in important_files:
        tech_stack.append("JavaScript / Node.js")

    if "requirements.txt" in important_files or "pyproject.toml" in important_files:
        tech_stack.append("Python")

    if "pom.xml" in important_files:
        tech_stack.append("Java / Maven")

    if "Cargo.toml" in important_files:
        tech_stack.append("Rust")

    if not tech_stack:
        tech_stack.append("Unknown")

    # Files selected by your file-ranking system
    likely_files_to_change = []

    for file in relevant_files:
        path = file.get("path", "")
        score = file.get("score", 0)

        if not path:
            continue

        reason = "Matched issue keywords in the repository path."

        normalized_path = path.replace("\\", "/").lower()

        if "/tests/" in f"/{normalized_path}" or normalized_path.startswith("tests/"):
            reason = "Likely regression-test location for this issue."
        elif "/json/" in f"/{normalized_path}":
            reason = "Likely implementation module related to JSON handling."

        likely_files_to_change.append({
            "path": path,
            "reason": reason,
            "relevance_score": score
        })

    # Basic issue classification
    labels = [label.lower() for label in issue.get("labels", [])]
    title = issue.get("title", "").lower()
    body = issue.get("body", "").lower()
    full_text = f"{title} {body}"

    if "good first issue" in labels:
        difficulty = "easy"
    elif any(word in full_text for word in ["refactor", "architecture", "migration"]):
        difficulty = "hard"
    else:
        difficulty = "medium"

    # Placeholder confidence based on available context
    confidence = 0.45

    if relevant_files:
        confidence += 0.20

    if issue.get("comments"):
        confidence += 0.10

    if "CONTRIBUTING.md" in important_files:
        confidence += 0.10

    confidence = min(confidence, 0.90)

    needs_human_clarification = len(issue.get("comments", [])) == 0

    clarifying_questions = []

    if needs_human_clarification:
        clarifying_questions.append(
            "Is there a preferred expected behavior or error message for this issue?"
        )

    return {
        "summary": (
            f"The issue requests: {issue.get('title', 'No title provided')}."
        ),
        "root_cause_hypothesis": (
            "The exact root cause is not confirmed yet. "
            "The selected files should be inspected to identify where the current behavior is implemented."
        ),
        "detected_tech_stack": tech_stack,
        "likely_files_to_change": likely_files_to_change,
        "implementation_plan": [
            "Read the issue description, labels, and maintainer comments.",
            "Review README.md and CONTRIBUTING.md for repository conventions.",
            "Inspect the selected implementation files to locate the current behavior.",
            "Identify the smallest safe change that satisfies the issue requirements.",
            "Update or add a regression test for the expected behavior.",
            "Run the relevant test suite and lint or formatting checks."
        ],
        "test_plan": [
            "Add or update a test that reproduces the reported issue.",
            "Verify the expected behavior after the code change.",
            "Run related existing tests to check for regressions."
        ],
        "difficulty": difficulty,
        "confidence": confidence,
        "needs_human_clarification": needs_human_clarification,
        "clarifying_questions": clarifying_questions
    }