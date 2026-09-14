from git import Repo
import os
import shutil
import hashlib
import tempfile


def get_repo_name(repo_url: str) -> str:
    return repo_url.rstrip("/").split("/")[-1].replace(".git", "")


def clone_or_update_repo(repo_url: str) -> str:
    """Clone or update a repository with optimized git operations.

    Optimizations:
    - Shallow clone (--depth 1) skips full history — massive speedup on large repos
    - Single-branch avoids fetching all branches
    - Fetch --depth 1 for updates instead of full fetch
    """
    repo_name = get_repo_name(repo_url)
    repo_key = hashlib.sha256(repo_url.encode("utf-8")).hexdigest()[:12]

    # Store cloned repos in OS temp directory completely isolated from OSA project git repo.
    # This ensures uvicorn's StatReload watcher does not reload the server during patch generation
    # and ensures git commands can never ascend to the parent OSA repository.
    from config import settings

    base_dir = settings.repos_dir
    os.makedirs(base_dir, exist_ok=True)

    # Keep repositories with identical names (but different owners) isolated.
    repo_path = os.path.join(base_dir, f"{repo_name}-{repo_key}")
    git_dir = os.path.join(repo_path, ".git")

    # First time: shallow clone (--depth 1, --single-branch)
    if not os.path.exists(repo_path) or not os.path.isdir(git_dir):
        if os.path.exists(repo_path):
            shutil.rmtree(repo_path, ignore_errors=True)
        print("Cloning repository (shallow)...")
        Repo.clone_from(
            repo_url,
            repo_path,
            depth=1,
            single_branch=True,
        )

    # Repository already exists: fast update
    else:
        print("Repository already exists. Updating it...")

        try:
            repo = Repo(repo_path, search_parent_directories=False)

            # Discard any changes made locally
            repo.git.reset("--hard")

            # Shallow fetch only latest changes
            repo.remotes.origin.fetch(depth=1)

            default_branch = repo.active_branch.name
            repo.git.reset("--hard", f"origin/{default_branch}")

        except Exception as error:
            print(f"Repository update failed ({error}). Re-cloning...")
            shutil.rmtree(repo_path, ignore_errors=True)
            Repo.clone_from(
                repo_url,
                repo_path,
                depth=1,
                single_branch=True,
            )

    return repo_path
