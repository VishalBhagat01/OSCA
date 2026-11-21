# Project Audit

## 1. Scope

This audit covers the authored application source in:

- `agent/`
- `backend/`
- `frontend/`
- the repository root documentation

Generated dependencies, virtual environments, build output, and cloned target repositories were excluded.

## 2. Validation Results

| Check | Result |
|---|---|
| Frontend `npm run build` | Passed |
| Backend `npm test` (`node --check`) | Passed |
| Agent `python -m compileall -q` | Passed |
| Graphify code extraction | Could not complete because the Graphify process exited unexpectedly with code `-1073741819` |

The frontend build produced a 397.91 KB JavaScript bundle and 43.28 KB CSS bundle. The application source is syntactically valid according to the checks performed.

## 3. Architecture Findings

### Confirmed strengths

- Clear three-service separation.
- Explicit LangGraph stages and routing.
- Shared `AgentState` contract.
- HITL approval, retry, and rejection states.
- Execution trace events and Socket.IO updates.
- Draft-PR default and human review gate.
- Python AST skeletonization for context reduction.
- Fuzzy patch application fallback.
- Targeted test-file selection on retries.
- Provider abstraction with Gemini, Ollama, and NVIDIA support.

### Design risks

1. **Test runner runs target-repository commands on the host process**
   - `subprocess.run(..., timeout=30)` executes commands from cloned repositories.
   - Untrusted repositories should be isolated in containers or microVMs.

2. **Patch publication is split across multiple services**
   - The agent analyzes and produces a diff.
   - The backend applies that diff to a fresh clone and creates the PR.
   - Partial failures can leave branches or commits locally before rollback.

3. **No durable queue or worker**
   - `processRun()` is started directly from the request flow.
   - A Node process restart can lose in-flight work.

4. **MongoDB is the only run transaction store**
   - State transitions are separate database updates and lack distributed transactions.
   - Concurrent HITL actions can race unless row-level application guards are strengthened.

5. **Patch verification is heuristic**
   - Unified-diff validation does not compile or semantically verify patches.
   - Tests pass as success, but no-test repositories are treated as successful after a textual detection fallback.

6. **Relevant-file search is lexical**
   - Stop words, path names, and source-text substring counts drive ranking.
   - It does not build call graphs or symbol/type indexes.

7. **LLM JSON parsing depends on defensive fallbacks**
   - The planner has multiple parse and regex fallback stages.
   - A fallback plan can look successful while being inferred from incomplete model output.

8. **Callback authentication is host allowlist-based**
   - Callback URL validation permits configured hosts but does not bind callback requests to run-specific cryptographic secrets beyond the callback token.

## 4. Test Coverage Findings

No current `agent/tests/` or `backend/tests/` directories were present in the audited working tree, despite the root README claiming 32 Python tests and 18 backend tests.

Existing validation is limited to:

- frontend production compilation;
- backend JavaScript syntax checks;
- Python bytecode compilation.

Behavioral tests should cover at minimum:

- LangGraph routing at every retry boundary;
- AST skeletonization for syntax variants;
- fuzzy patch exact and partial-match behavior;
- test-command detection;
- run lifecycle transitions;
- Socket.IO event ordering;
- API-key and callback-host security;
- GitHub PR rollback behavior.

## 5. Documentation Reconciliation

The root README contains useful product-level behavior but should not be treated as a test or implementation guarantee. This audit confirmed:

- the AST skeletonizer exists and is integrated;
- frontend and backend build systems exist;
- LangGraph routes exist;
- no visible authored test suites were present;
- the Graphify graph could not be regenerated in this environment.

## 6. Operational Recommendations

1. Add containerized test execution with strict time and memory limits.
2. Add BullMQ, RabbitMQ, Redis Streams, or another durable queue.
3. Persist an attempt/event model instead of only an array of mixed trace objects.
4. Add focused unit and integration suites for the agent and backend.
5. Add AST parsers for JavaScript/TypeScript and a call-symbol index if token budget permits.
6. Keep PR publishing idempotent; recover or cancel existing branches on failure.
7. Split secrets and credentials from logs and execution trace payloads.
8. Make test detection distinguish “no tests” from “tests not yet run.”
9. Add CI gates for all three services.
