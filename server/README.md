"""Remote Research API

## Purpose

Thin FastAPI wrapper that runs the upstream `last30days` Python engine as a
subprocess and returns Agent JSON to ChatGPT / Claude / Cursor / other agents.

Successful research response follows upstream last30days agent JSON schema.
**The REST wrapper does not own that schema.**

## Architecture

```text
Caller LLM
  → POST /v1/research (Bearer RESEARCH_API_KEY)
  → argv mapping (typed, allowlisted)
  → subprocess: last30days.py --emit=json --json-profile=agent
  → stdout Agent JSON pass-through
```

This is an **Agent REST Contract**, not upstream's `LAST30DAYS_API_BASE`
hosted submit/poll protocol.

## Upstream relationship

See [`../UPSTREAM.md`](../UPSTREAM.md). Keep wrapper code under `server/`.
Do not rewrite `skills/last30days/scripts/`.

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | no | Cheap liveness |
| GET | `/v1/capabilities` | Bearer | Upstream `--diagnose` → `available_sources` |
| POST | `/v1/research` | Bearer | Agent JSON pass-through |

## Authentication

```text
Authorization: Bearer <RESEARCH_API_KEY>
```

Environment: `RESEARCH_API_KEY` (required).

**Do not** set server auth as `LAST30DAYS_API_KEY`. That pair with
`LAST30DAYS_API_BASE` switches the local engine into remote mode and can
recurse. The runner strips both from the engine subprocess environment.

## Request example

```bash
curl -sS http://127.0.0.1:5002/v1/research \
  -H "Authorization: Bearer $RESEARCH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Claude Code developer experience","days":30,"depth":"default"}'
```

## Response pass-through policy

- HTTP 200 body = exact upstream stdout JSON (Agent profile)
- No field rename, score rewrite, summarization, or wrapper metadata in body
- Request id / upstream commit live in response headers (`X-Request-ID`,
  `X-Upstream-Commit`)

## Environment variables

| Variable | Default | Role |
|----------|---------|------|
| `RESEARCH_API_KEY` | (required) | Wrapper Bearer auth |
| `RESEARCH_TIMEOUT_SECONDS` | `600` | Engine subprocess timeout |
| `RESEARCH_MAX_CONCURRENCY` | `2` | Bounded concurrent engine runs |
| `DIAGNOSE_TIMEOUT_SECONDS` | `60` | Capabilities diagnose timeout |
| `RESEARCH_PYTHON_BIN` | `python3` | Interpreter for engine |
| `RESEARCH_PORT` | `5002` | Local listen port (SP 500x) |
| `LAST30DAYS_MEMORY_DIR` | upstream default | Writable memory dir (unchanged semantics) |

Provider keys for sources use **upstream** names (`CONFIGURATION.md`).

## Engine invocation

```text
python3 skills/last30days/scripts/last30days.py \
  "<topic>" \
  --days=30 \
  --emit=json \
  --json-profile=agent \
  --no-browser-cookies
  # + mapped optional flags
```

Always `shell=False`. stdout = JSON; stderr = logs only.

## Local run

```bash
python3 -m venv .venv-server
source .venv-server/bin/activate
pip install -r server/requirements.txt
export RESEARCH_API_KEY=dev-secret
uvicorn server.app:app --host 0.0.0.0 --port 5002
```

## Zeabur

See [`../docs/DEPLOY-ZEABUR.md`](../docs/DEPLOY-ZEABUR.md). Use root `Dockerfile` (Git-backed). Never `zeabur deploy`.

## Tests

```bash
export RESEARCH_API_KEY=test-secret
PYTHONPATH=. pytest tests/server -q
```

## Updating upstream

```bash
git fetch upstream
git merge upstream/main
```

Re-verify CLI flags with `python3 skills/last30days/scripts/last30days.py --help`
and adjust `server/argv_builder.py` only if flags changed.
