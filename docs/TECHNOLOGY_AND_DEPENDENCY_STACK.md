# Technology and Dependency Stack

## 1. Application Languages and Runtimes

| Area | Technology | Evidence |
|---|---|---|
| Agent | Python | `agent/main.py`, LangGraph, FastAPI |
| Agent runtime target | Python 3.11+ documented | README |
| Backend | JavaScript / Node.js | `backend/*.js` |
| Backend runtime target | Node.js 20+ documented | README |
| Frontend | JavaScript ES modules / JSX | `frontend/src` |
| Frontend runtime | Browser | Vite-served React application |
| Styling | CSS plus Tailwind CSS 4 | `frontend/src/index.css`, `@tailwindcss/vite` |
| Database | MongoDB | Mongoose |
| Source control | Git / GitHub | GitPython, simple-git, Octokit |

## 2. Frontend Stack

### Core libraries

- React `19.2.6`
- React DOM `19.2.6`
- React Router DOM `7.18.1`
- Vite `8.0.12`
- `@vitejs/plugin-react` `6.0.1`
- Axios `1.18.0`
- Socket.IO client `4.8.3`
- React Hot Toast `2.6.0`
- Lucide React `1.26.0`
- React Spinners `0.17.0`
- Tailwind CSS `4.3.3`
- `@tailwindcss/vite` `4.3.3`

### Frontend architecture

- `BrowserRouter` defines `/`, `/history`, and `/runs/:id`.
- `App.jsx` owns global notification and error boundaries.
- `runService.js` centralizes REST calls.
- `useRun.js` fetches and refetches individual runs.
- `useLiveNow.js` exposes a shared one-second external clock through `useSyncExternalStore`.
- Socket.IO listeners refresh run details for status and trace events.
- `useMemo` calculates history statistics and filters.
- Components are split into pages, cards, UI primitives, hooks, services, and utility formatters.
- Skeleton components provide loading placeholders.
- A React error boundary isolates rendering failures.

### Frontend build behavior

- Vite compiles JSX and production assets.
- Tailwind is loaded as a Vite plugin.
- Vite proxies `/api` to `http://localhost:5000` during development.
- Production API configuration can use `VITE_API_URL` or `VITE_API_BASE_URL`.

## 3. Backend Stack

### Core dependencies

- Express `5.2.1`
- Mongoose `9.7.4`
- Axios `1.18.1`
- Socket.IO `4.8.3`
- `@octokit/rest` `22.0.1`
- simple-git `3.36.0`
- Helmet `8.3.0`
- compression `1.8.1`
- CORS `2.8.6`
- dotenv `17.4.2`
- nodemon `3.1.14`

### Backend implementation

- MVC-style Express routes/controllers/services.
- A mixed Mongoose document stores run and HITL state.
- MongoDB indexes cover status and newest-run queries.
- A shared Socket.IO instance publishes updates and trace events.
- Axios invokes FastAPI with per-request API keys.
- Octokit invokes GitHub REST APIs.
- simple-git clones, branches, commits, pushes, and applies patches.
- `processRun()` is the asynchronous orchestration boundary.
- `express.json` limits bodies to 2 MB.
- MongoDB connection pooling is bounded to ten connections.

## 4. Python Agent Stack

The agent requirements are:

- LangGraph
- FastAPI
- Uvicorn
- Requests
- PyGithub
- GitPython
- `langchain-ollama`
- `langchain-google-genai`
- `langchain-nvidia-ai-endpoints`
- Pydantic
- python-dotenv

### Agent libraries

- `FastAPI` implements HTTP endpoints.
- `Uvicorn` is the ASGI server.
- `LangGraph` implements the repair state graph.
- `Pydantic` validates API payloads and structured LLM output.
- `python-dotenv` loads `.env`.
- `Requests` sends callback events.
- `PyGithub` is declared by requirements but the active backend GitHub integration primarily uses Node/Octokit.
- `GitPython` performs repository reset and diff operations.
- `LangChain` chat providers implement provider abstractions.

## 5. LLM Providers

### Google Gemini

Configured by:

- `LLM_PROVIDER=gemini`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_TEMPERATURE`
- `GEMINI_MAX_TOKENS`
- `GEMINI_PACING_SECONDS`

The implementation uses `ChatGoogleGenerativeAI` or a resilient subclass for backoff and paced calls.

### Ollama

Configured by:

- `LLM_PROVIDER=ollama`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TEMPERATURE`
- `OLLAMA_MAX_TOKENS`
- `OLLAMA_NUM_CTX`

The implementation uses `ChatOllama` with a ten-minute model keep-alive.

### NVIDIA Nemotron fallback

Configured by:

- `NVIDIA_API_KEY`
- `NVIDIA_MODEL`
- `NVIDIA_TEMPERATURE`
- `NVIDIA_MAX_TOKENS`
- `NVIDIA_FALLBACK_ENABLED`

The implementation uses `ChatNVIDIA`. Gemini 429/503/availability failures can switch all subsequent calls to NVIDIA until fallback is reset for a new pipeline run.

## 6. Prompt and Output Formats

The project uses several structured formats:

- Pydantic `FileEdit` for complete file content and modification decisions.
- Pydantic `AcceptanceResult` for acceptance, reason, and violations.
- Pydantic `PRMetadataOutput` for branch, commit, title, and body.
- Pydantic `PRDraftOutput` for reviewer-aware PR drafts.
- Unified diff format for patch validation and Git application.
- Aider-style `SEARCH/REPLACE` blocks as a fuzzy patch fallback.
- JSON API responses from FastAPI and Express.
- JSON mixed payloads for MongoDB run results and execution traces.

## 7. State and Communication Protocols

| Concern | Mechanism |
|---|---|
| Frontend/back-end API | HTTP REST/JSON |
| Backend/agent API | HTTP POST/JSON plus `x-api-key` |
| Agent callbacks | HTTP POST plus callback token |
| Live UI updates | Socket.IO events |
| Agent workflow | LangGraph typed state |
| Repository operations | Git CLI and GitPython/simple-git |
| GitHub operations | GitHub REST via Octokit |
| Database | MongoDB wire protocol via Mongoose |
| LLM providers | LangChain chat model HTTP calls |

## 8. Security and Configuration

Configuration is environment-driven:

- `.env` in backend and agent directories.
- `.env.example` in backend and agent directories.
- Frontend Vite variables.
- API key middleware in Express and FastAPI.
- Callback host allowlisting.
- Callback token allowlisting.
- CORS origin allowlists.
- Helmet security headers.
- GitHub tokens and provider API keys are not committed under the repository ignore rules.

The repository ignores virtual environments, dependency directories, build output, clones, cache directories, database files, credentials, and environment files.
