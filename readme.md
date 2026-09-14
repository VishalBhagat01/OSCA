# Sentra AI (OSA) — Autonomous Code Repair Platform

Sentra AI is an intelligent, open-source automated code repair platform that converts GitHub issues into tested, validated, and human-reviewed GitHub Pull Requests.

By combining a **LangGraph-powered multi-agent Python backend**, a **Node.js/Express orchestration service**, and a **modern React/Vite dashboard**, Sentra AI provides an end-to-end autonomous engineering workflow with full Human-in-the-Loop (HITL) oversight.

---

## 🚀 Key Features

- **⚡ Dual LLM Provider Support**:
  - **Google Gemini**: High-speed, high-context inference via `gemini-2.5-flash` / `gemini-1.5-pro` (`langchain-google-genai`).
  - **Ollama**: 100% offline, privacy-first local inference using `qwen2.5-coder:7b` or `deepseek-coder`.
  - Configurable in `.env` with a single flag (`LLM_PROVIDER=gemini` or `LLM_PROVIDER=ollama`).
- **🤖 Dedicated Drafting PR Node (Post-Human Review)**:
  - Executes *after* human review of the generated code.
  - Dynamically synthesizes an executive overview, root cause analysis, file-by-file breakdown, automated test proofs, and weaves in human reviewer sign-off notes.
  - Creates the pull request on GitHub as an official **Draft Pull Request** (`draft: true`), allowing CI/CD workflows to validate before notifying repo maintainers.
- **🧩 Resilient Fuzzy Patch Application**:
  - Sliding-window Levenshtein and Myers alignment matcher (`difflib.SequenceMatcher` $\ge 0.82$).
  - Gracefully handles indentation drift, line offset shifts, and minor context discrepancies, eliminating false-negative patch application failures.
- **✂️ AST Skeletonizer (Token Pruning)**:
  - Analyzes repository files with Python AST and regex parsers, preserving class declarations, function signatures, type annotations, and docstrings while collapsing bodies to `...`.
  - Cuts related-file context token overhead by **75% to 85%**, dramatically accelerating Time To First Token (TTFT).
- **🎯 Targeted Test Impact Analysis (TIA)**:
  - On retry iterations, the test runner targets specifically modified test files or functions instead of executing the full test suite, dropping verification latency from 25s+ down to **< 0.5s**.
- **📡 Real-Time Execution Trace & Streaming**:
  - Live, step-by-step LangGraph node events streamed over WebSockets (`Socket.IO`) to the frontend dashboard.
- **👤 Interactive Human Review Gate**:
  - Inspect generated unified diffs.
  - Approve & trigger PR drafting with optional custom reviewer instructions.
  - Retry with targeted prompt feedback.
  - Reject non-viable proposals.

---

## 🔄 End-to-End Workflow

```text
[ GitHub Issue (#X) ]
        │
        ▼
[ Backend Ingestion (Node/Express + GitHub API) ]
        │
        ▼
[ Python Agent (FastAPI / LangGraph) ]
        │
        ├─► 1. Isolated Shallow Git Clone / Worktree
        ├─► 2. AST Codebase Scanner & Keyword Matcher
        ├─► 3. Planner Node (Root Cause Analysis & Target File Selection)
        ├─► 4. Concurrent Patch Generator (ThreadPoolExecutor)
        ├─► 5. Syntax & AST Validator
        ├─► 6. Resilient Fuzzy Patch Applier
        ├─► 7. Targeted Test Runner (Pytest / npm test)
        └─► 8. Fast-Path Acceptance Validator
        │
        ▼
[ 👤 Human Review Gate in Web Dashboard (awaiting_approval) ]
        │
        ├──► Retry with feedback ──► (Loops back to Patch Generator)
        ├──► Reject ───────────────► (Run marked as rejected)
        │
        └──► Approve with Review Notes
                │
                ▼
[ 🤖 Drafting PR Node (draft_pr_node) ]
        │
        ▼
[ 🐙 GitHub API: Creates Draft Pull Request (draft: true) ]
        │
        ▼
[ Run Completed & Linked in Dashboard ]
```

---

## 📁 Repository Structure

```text
OSA/
├── agent/                  # Python 3.11+ Agent Service
│   ├── agents/
│   │   ├── nodes/          # LangGraph Nodes: planner, patch_generator, validator,
│   │   │                   # patch_applier, test_runner, draft_pr, pr_metadata
│   │   ├── planner_graph.py# LangGraph State Graph definition & routing
│   │   └── issue_analyzer.py
│   ├── git_utils/          # Git clone, scanner, AST skeletonizer, file selector
│   ├── llm/                # LLM Factory: llm_provider.py (Gemini + Ollama)
│   ├── tests/              # Pytest suite (32 unit tests)
│   ├── main.py             # FastAPI HTTP service
│   └── requirements.txt
│
├── backend/                # Node.js 20+ Orchestration Service
│   ├── controllers/        # run.controller.js (HITL, approveRun, draftPR)
│   ├── services/           # github.service.js, agent.service.js, runProcessor.js
│   ├── models/             # MongoDB Run schema (status, reviews, executionTrace)
│   ├── tests/              # Node test runner suite (18 unit tests)
│   └── index.js            # Express & Socket.IO server
│
├── frontend/               # React 18 / Vite Web Dashboard
│   ├── src/
│   │   ├── pages/          # Home, History, RunDetails
│   │   ├── components/     # HumanReviewCard, RunCard, PatchCard, Timeline
│   │   └── services/       # Axios API client & Socket.IO listeners
│   └── package.json
│
└── readme.md
```

---

## 🛠️ Local Setup & Installation

### Prerequisites
- **Node.js**: v20.x or later
- **Python**: v3.11 or later
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas
- **Git**: Installed and accessible on your system path
- **LLM Choice**:
  - **Google Gemini**: A Google AI Studio API key (recommended for fastest setup).
  - **Ollama**: Local Ollama installed with `ollama pull qwen2.5-coder:7b`.

---

### 1. Configure Environment Variables

Create `.env` in all three directories by copying the examples:

#### **Agent Configuration** (`agent/.env`):
```ini
# LLM Provider: 'gemini' or 'ollama'
LLM_PROVIDER=gemini

# Google Gemini Settings (when LLM_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Ollama Settings (when LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b

# Agent Server Security
AGENT_API_KEY=your_secure_agent_api_key
FRONTEND_ORIGIN=http://localhost:5173
CALLBACK_ALLOWED_HOSTS=localhost,127.0.0.1
```

#### **Backend Configuration** (`backend/.env`):
```ini
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sentra_ai
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# GitHub Integration
GITHUB_TOKEN=your_personal_access_token_here

# Agent Connection
AGENT_API_URL=http://localhost:8000
AGENT_API_KEY=your_secure_agent_api_key
AGENT_CALLBACK_TOKEN=your_secure_callback_token
```
> **Note**: `GITHUB_TOKEN` needs `repo` scope to read issues and open pull requests.

#### **Frontend Configuration** (`frontend/.env`):
```ini
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 2. Start Services

Open three terminal windows (PowerShell / Bash):

#### Terminal 1 — Agent Service (Python):
```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Terminal 2 — Backend Service (Node.js):
```powershell
cd backend
npm install
node index.js
```

#### Terminal 3 — Frontend Dashboard (Vite / React):
```powershell
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to access the Sentra AI dashboard.

---

## 🧪 Running Tests

Both backend and agent services include comprehensive automated test suites:

### Agent Tests (Pytest)
```powershell
cd agent
python -m pytest
```
*Executes 32 test cases covering AST skeletonization, fuzzy patch applier, draft PR node, LangGraph state routing, validators, and test runner detection.*

### Backend Tests (Node Test Runner)
```powershell
cd backend
npm test
```
*Executes 18 test cases covering GitHub URL parsing, run controller input validation, and HITL state idempotency.*

### Frontend Build Validation
```powershell
cd frontend
npm run build
```

---

## 🛡️ Security & Sandboxing

- **Test Execution**: The test runner executes automated test suites (`pytest` or `npm test`) discovered inside the target repository with a 30-second timeout. For production multi-tenant deployments, run tests inside isolated Docker containers or Firecracker microVMs.
- **Repository Isolation**: Cloned repositories are isolated in operating-system temporary directories (`OSA_REPOS_DIR` or OS temp) with strict directory boundaries to prevent ascending git commands.
- **API Authentication**: Inter-service communication between Backend and Agent is protected via `AGENT_API_KEY` header verification and callback origin allowlisting.
- **Draft PR Safety**: Pull requests are created with `draft: true` on GitHub to prevent notifying maintainers until team verification is complete.

---

## 📄 License

This project is licensed under the MIT License.
