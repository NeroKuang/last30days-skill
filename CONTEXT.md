# Last30Days Remote Research API

Thin REST wrapper that exposes the upstream last30days research engine as a remote HTTP service. The wrapper owns transport and operations; upstream owns research logic and agent JSON.

## Language

**Upstream Engine**:
The Python research pipeline from `mvanhorn/last30days-skill` (notably `skills/last30days/scripts/last30days.py`). Owns retrieval, ranking, clustering, freshness, and agent JSON.
_Avoid_: Research Engine (when meaning our code), crawler, our ranking layer

**Research API**:
The FastAPI service under `server/` that authenticates, validates, maps HTTP fields to engine argv, runs the engine as a subprocess, and returns stdout JSON.
_Avoid_: Research Engine, MCP server, last30days (when meaning only the wrapper)

**Agent JSON**:
Upstream stdout produced with `--emit=json --json-profile=agent`. Schema ownership stays with upstream; the Research API passes it through unchanged.
_Avoid_: API response schema (as if wrapper-owned), wrapper envelope (for successful research)

**Fork Layout**:
This repo is a fork of upstream with additive `server/` (and wrapper docs/tests). Engine paths under `skills/last30days/` stay upstream-owned for mergeability.
_Avoid_: vendored copy, submodule wrapper, rewrite of scripts/

**Agent REST Contract**:
The public HTTP surface for callers (`/health`, `/v1/capabilities`, `/v1/research`) that returns Agent JSON from a local Upstream Engine run. Auth uses a wrapper-owned key namespace (e.g. `RESEARCH_API_KEY`), never `LAST30DAYS_API_KEY`.
_Avoid_: hosted backend, LAST30DAYS_API_BASE protocol, submit/poll remote mode, raw-profile remote contract

**Caller Auth**:
MVP uses one shared Bearer secret (`RESEARCH_API_KEY`) for wrapper authentication. No accounts, no per-caller keys, no billing identity.
_Avoid_: LAST30DAYS_API_KEY, OAuth, multi-tenant API keys (MVP)

**Auth Surface**:
`POST /v1/research` and `GET /v1/capabilities` require Bearer auth. `GET /health` is unauthenticated and must stay cheap (no research, no expensive diagnose).
_Avoid_: locking /health behind auth (breaks typical platform probes); public capabilities

**MVP Source Posture**:
Deploy for keyless-first sources that work without desktop browser cookies. Unconfigured lanes (e.g. X without a server-compatible key) stay unavailable and are reported via upstream `--diagnose` / `available_sources`.
_Avoid_: assuming Chrome/Safari cookies on Zeabur; promising full source coverage in MVP

**Shared Understanding (2026-09-07)**:
- Repo: fork upstream + additive `server/`
- Contract: independent Agent REST (not LAST30DAYS_API_BASE hosted protocol)
- Auth: single `RESEARCH_API_KEY`; research + capabilities gated; health public
- Sources: keyless-first MVP
- Remaining ops defaults accepted for implementation: `RESEARCH_TIMEOUT_SECONDS` default 600; `RESEARCH_MAX_CONCURRENCY` default 2; writable `LAST30DAYS_MEMORY_DIR`; local dev port 5002
