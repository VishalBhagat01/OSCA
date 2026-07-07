import os

IMPORTANT_FILE_NAMES = {
    "README.md",
    "CONTRIBUTING.md",
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Dockerfile"
}

IGNORE_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build"
}


def scan_repository(repo_path: str):
    file_tree = []
    important_files = {}

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file_name in files:
            full_path = os.path.join(root, file_name)

            relative_path = os.path.relpath(full_path, repo_path)
            file_tree.append(relative_path)

            if relative_path == file_name and file_name in IMPORTANT_FILE_NAMES:
                try:
                    with open(
                        full_path,
                        "r",
                        encoding="utf-8",
                        errors="ignore"
                    ) as file:
                        important_files[relative_path] = file.read()[:10000]
                except Exception:
                    pass

    return {
        "file_tree": file_tree,
        "important_files": important_files
    }