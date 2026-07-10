def get_changed_files(diff: str) -> set[str]:
    changed_files = set()

    for line in diff.splitlines():
        if line.startswith("--- a/") or line.startswith("+++ b/"):
            path = line[6:].strip()

            if path != "/dev/null":
                changed_files.add(path.replace("\\", "/"))

    return changed_files


def is_test_file(path: str) -> bool:
    path = path.replace("\\", "/").lower()

    return (
        path.startswith("tests/")
        or "/tests/" in path
        or path.startswith("test_")
        or path.endswith("_test.py")
        or path.endswith(".test.js")
        or path.endswith(".spec.js")
        or path.endswith(".test.ts")
        or path.endswith(".spec.ts")
    )