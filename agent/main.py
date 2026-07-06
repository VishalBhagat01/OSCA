from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from repos.repo_info import repo_info

app = FastAPI()


class RepoURL(BaseModel):
    repo_url: str


@app.get("/")
def home():
    return {"message": "Agent Running"}


@app.post("/repo-info")
def get_repo_info(payload: RepoURL):
    try:
        return repo_info(payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
