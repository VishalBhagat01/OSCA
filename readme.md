# Sentra AI

Sentra AI turns a GitHub issue into a reviewed pull request. The React dashboard creates and follows a run; the Node service stores it and publishes events; the Python/LangGraph service plans, generates, validates, and tests a patch.

## Workflow

1. Submit a GitHub repository URL and issue number.
2. The backend reads the issue title, description, labels, and comments from GitHub.
3. The agent clones the repository into an isolated cache, proposes a patch, validates it, and runs a detected test command.
4. A successful patch waits for human review. Approval applies that exact diff on a new branch and opens a pull request.

## Local setup

Prerequisites: Node.js 20+, Python 3.11+, MongoDB, Git, and Ollama with `qwen2.5-coder:7b` pulled.

Copy every `.env.example` file to `.env` and set the required values. `GITHUB_TOKEN` needs repository read access; creating pull requests requires write access to the target repository. Do not expose the API without setting `API_KEY` and `AGENT_CALLBACK_TOKEN`.

```powershell
cd agent; python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; uvicorn main:app --reload --port 8000
cd backend; npm install; node index.js
cd frontend; npm install; npm run dev
```

## Security and limits

Only run repositories you trust. Test execution evaluates repository code and should be run in a sandboxed container with restricted network, CPU, memory, and filesystem access in production. Set `FRONTEND_ORIGIN`, `CALLBACK_ALLOWED_HOSTS`, `API_KEY`, and `AGENT_CALLBACK_TOKEN`; do not use wildcard CORS. The current test runner supports Python projects and npm projects with a `test` script, with a 60-second command timeout.

## Current scope

The system supports public or token-authorized GitHub repositories. Pull-request creation happens only after explicit human approval. Add CI tests and container-based execution before deploying this system for untrusted multi-user workloads.

