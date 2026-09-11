from git import Repo
import os
import shutil
import hashlib


def get_repo_name(repo_url: str) -> str:
    return repo_url.rstrip("/").split("/")[-1].replace(".git", "")


def clone_or_update_repo(repo_url: str) -> str:
    repo_name = get_repo_name(repo_url)
    repo_key = hashlib.sha256(repo_url.encode("utf-8")).hexdigest()[:12]

    base_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "repos"
    )

    os.makedirs(base_dir, exist_ok=True)

    # Keep repositories with identical names (but different owners) isolated.
    repo_path = os.path.join(base_dir, f"{repo_name}-{repo_key}")

    # First time: clone repository
    if not os.path.exists(repo_path):
        print("Cloning repository...")
        Repo.clone_from(repo_url, repo_path)

    # Repository already exists: update it
    else:
        print("Repository already exists. Updating it...")

        try:
            repo = Repo(repo_path)

            # Discard any changes made locally
            repo.git.reset("--hard")

            # Download only latest changes
            repo.remotes.origin.fetch()

            default_branch = repo.active_branch.name

            repo.git.reset(
                "--hard",
                f"origin/{default_branch}"
            )

        except Exception as error:
            print("Repository update failed. Re-cloning...")
            shutil.rmtree(repo_path)
            Repo.clone_from(repo_url, repo_path)

    return repo_path
