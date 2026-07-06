from git import Repo
import os


def clone_repo(repo_url):
    repo_name = repo_url.split("/")[-1].replace(".git", "")
    path = os.path.join("repos", repo_name)

    if not os.path.exists(path):
        Repo.clone_from(repo_url, path)
        print(f"Cloned {repo_name}")
    else:
        print(f"{repo_name} already exists")

    return path


clone_repo("https://github.com/langchain-ai/langchain.git")