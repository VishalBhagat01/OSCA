# Optimization and Performance Catalog

This document separates implemented optimizations from architectural features that reduce cost or latency. It does not claim a benchmark unless source code or a build run measured it.

## 1. LLM Cost and Latency Optimizations

### AST skeletonization

Python implementation bodies are collapsed to ellipses while signatures, docstrings, nested definitions, decorators, and class variables are retained.

Effect:

- removes implementation noise from planner prompts;
- preserves enough API structure for planning;
- supports a measured source-fallback threshold of 400 characters.

Non-Python files use a 100-line generic line skeleton by default.

### Relevant-file ranking

`extract_keywords()` removes stop words and expands semantic aliases. `select_relevant_files()` scores filename, folder, and source-content matches.

Implemented limits:

- six source files;
- one test file;
- source files under 200 KB;
- `src/` paths receive an 8-point preference;
- test paths receive a -2 point penalty;
- non-test paths receive a +2 point preference;
- `examples/` is ignored;
- source text is limited to 30,000 characters before ranking;
- stored file content is limited to 12,000 characters.

This reduces repository context and avoids sending every source file to the LLM.

### Planner prompt compaction

The planner receives:

- issue body truncated to 1,200 characters;
- at most three relevant files;
- 800 characters of skeleton per file;
- a JSON payload truncated around 3,500 characters;
- only previous analysis and human feedback on retries.

### Patch prompt compaction

The patch prompt:

- uses a compact issue representation;
- uses a compact four-step plan;
- reads only one or two target files;
- limits current file content to 150,000 characters;
- limits previous patch text to 800 characters;
- sends at most five other repository filenames;
- uses fixed repair instructions before dynamic content to improve cacheable prefix reuse.

### Acceptance prompt compaction

The acceptance validator receives:

- issue body truncated to 800 characters;
- patch truncated to 2,000 characters;
- test stdout tail truncated to 800 characters.

### Deterministic PR metadata

`OSA_PR_METADATA_LLM=1` is opt-in. PR metadata and post-review PR drafts otherwise use deterministic fallback generators.

This intentionally avoids LLM calls for:

- branch names;
- commit messages;
- default PR title/body;
- human-review sign-off formatting.

### Fast-path first-pass acceptance

If tests pass on the first attempt, LangGraph skips the acceptance-validator LLM call and moves directly to PR metadata generation.

The graph comment in code states this saves one LLM round trip. It is activated only when `retry_count <= 1`.

### Retry-specific test generation

Patch generation normally creates:

- one primary source file;
- one test file on the first attempt.

On later retries, test synthesis is included only if the prior stage was `test_syntax`; otherwise implementation repair avoids unnecessary test-file rewriting.

### LLM caching

LangChain's bounded in-memory cache can be enabled with `LLM_CACHE_ENABLED`.

- default maximum entries: 1,000;
- oldest insertion is evicted when capacity is reached;
- cache is process-local;
- no SQLite or disk-lock dependency;
- useful for repeated prompts and stateless deployments, but not durable across restarts.

### Provider singleton and sticky fallback

LLM instances are created lazily or at module initialization and reused:

- Gemini singleton;
- Ollama singleton;
- NVIDIA singleton.

Gemini quota/rate/availability failures can activate sticky fallback, routing subsequent pipeline calls to NVIDIA rather than repeatedly hitting Gemini.

### Provider pacing and backoff

Gemini calls include:

- configurable pacing sleep;
- up to seven attempts;
- retry-delay parsing;
- exponential backoff for 429;
- exponential backoff for 503;
- jitter to reduce synchronized retries;
- maximum 65-second backoff for quota errors;
- maximum 20-second backoff for 503 errors.

### Cloud API concurrency limit

Patch file generation uses one worker for Gemini and NVIDIA Nemotron. Ollama and unrecognized/local providers allow up to two workers.

This prevents TPM/RPM bursts for cloud APIs.

## 2. Test and Verification Optimizations

### Targeted test impact analysis

On retries, the test runner scans candidate changed/relevant files and identifies a test file containing `test` in the normalized path.

It can pass that file to pytest or append it to an npm test command.

This is intended to reduce verification latency, but it does not guarantee equivalent coverage for repository-level integration behavior.

### No-tests fast pass

When no test command is detected, the test runner returns success and hands the patch to acceptance validation.

This is a major speed optimization and a semantic limitation that should be distinguished from genuine tests passing.

### Test timeout

All test commands have a 30-second timeout.

### Test result truncation

The acceptance node sends only the tail of stdout, because failures and assertions are most likely to appear near the end.

## 3. Repository and Patch Optimizations

### Repository reuse

Python cloning updates existing repositories instead of always creating a fresh clone.

### Workspace reset

The patch generator and issue analyzer reset target repositories to `HEAD` after transient patch work.

The `finally` cleanup guarantees repository cleanliness inside the target repository, preventing cross-attempt modifications.

### Git diff-based patch transfer

Full file contents are written transiently and the resulting unified diff is sent onward.

This avoids transferring patch blocks from the model and provides a single backend-ready patch artifact.

### Patch stagnation guard

If a later retry generates the same diff as the previous attempt, the pipeline marks it as stagnated and terminates retry progress.

### Patch application fallback ladder

Patch application tries:

1. native `git apply --whitespace=fix`;
2. relaxed `git apply --recount --ignore-whitespace`;
3. Aider-style SEARCH/REPLACE parsing;
4. exact text replacement;
5. whitespace-normalized matching;
6. `difflib.SequenceMatcher` at a `0.82` threshold with variable window size.

This reduces false failures caused by indentation drift or line-offset shifts.

### Git command timeout

Fuzzy patch Git operations use a 15-second subprocess timeout.

### PR branch and repository cleanup

PR publication uses a dedicated temporary clone and removes it in `finally`, even after failures.

## 4. Network and Execution Optimizations

### Fire-and-forget callback trace

Execution callbacks use:

- a shared `requests.Session` for TCP/HTTP connection reuse;
- daemon threads;
- a three-second callback timeout.

The LangGraph caller is not blocked waiting for callback delivery.

### HTTP callback batching

The backend exposes an event append endpoint and updates the last trace event in place when the same node is still running.

This avoids appending duplicate running/success pairs for a node.

### Socket.IO updates

Only lightweight status and event payloads are emitted. The frontend refetches full run details on relevant updates.

### HTTP response compression

Express enables compression.

### HTTP JSON size limit

Express limits request bodies to 2 MB, avoiding unbounded JSON parsing for run actions.

### Agent HTTP timeout

The backend defaults to a 900-second agent timeout. PR drafting is separately limited to 60 seconds.

### Database pool and sockets

Mongoose uses:

- a maximum pool size of 10;
- five-second server selection timeout;
- 45-second socket timeout.

### MongoDB indexes

Mongoose indexes status and creation time for history/status queries.

### Lean reads

The run processor uses `lean()` for a live trace read to avoid loading Mongoose documents unnecessarily.

## 5. Frontend Optimizations

### Memoized derived state

History statistics and filtered runs use `useMemo`.

### Optimistic local deletion

The history UI removes a deleted run from local state without an unnecessary full refetch.

### Silent refetch

Socket-driven run-detail refreshes default to silent mode, avoiding loading placeholders for every live event.

### Shared live clock

`useLiveNow` uses one interval for all subscribers rather than one interval per component.

### Loading skeletons

Skeleton components render stable placeholder layouts while run data loads.

### Error boundaries

React render errors are contained rather than propagating to the entire application shell.

### CSS and bundle optimization

Vite performs production bundling and asset hashing. Tailwind is processed through the Vite plugin.

### HTTP client singleton

Axios is configured once and reused with a base URL and optional API-key header.

## 6. Security and Reliability Optimizations

### API-key middleware

Express and FastAPI can reject unauthorized requests before service work.

### Callback authentication

Callback events can use a dedicated callback token separate from normal API credentials.

### Callback host validation

Agent callback URLs must use an allowlisted host and HTTP/HTTPS scheme.

### CORS restriction

Both Express REST and Socket.IO paths use origin delegation.

### Helmet headers

Express adds browser security headers.

### Repository reset and temp directories

Patch generation resets source repositories and PR publication removes temporary clones.

### Graceful shutdown

Node HTTP and Socket.IO servers attempt idle/active connection shutdown and provide a four-second forced exit guard.

### Human review gate

A patch is not published directly. Approval, retry, and rejection are explicit state transitions.
