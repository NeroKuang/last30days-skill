#!/usr/bin/env bash
# Start local Research API + Knowledge Browser on port 5002 (SP convention).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${RESEARCH_PORT:-5002}"
PIDFILE="${TMPDIR:-/tmp}/l30d-knowledge-uvicorn.pid"
LOGFILE="${TMPDIR:-/tmp}/l30d-knowledge-uvicorn.log"

if [ ! -x "$ROOT/.venv-server/bin/uvicorn" ]; then
  echo "ERROR: missing .venv-server. Create with: python3 -m venv .venv-server && .venv-server/bin/pip install -r server/requirements.txt" >&2
  exit 1
fi

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Already listening on $PORT"
  curl -fsS "http://127.0.0.1:${PORT}/knowledge/" >/dev/null && echo "OK http://127.0.0.1:${PORT}/knowledge/"
  exit 0
fi

# Load local Zeabur env if present (for real RESEARCH_API_KEY); fall back for browse-only.
if [ -f "$ROOT/.env.zeabur.local" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env.zeabur.local"
  set +a
fi
export RESEARCH_API_KEY="${RESEARCH_API_KEY:-dev-local-key}"

nohup "$ROOT/.venv-server/bin/uvicorn" server.app:app \
  --host 127.0.0.1 --port "$PORT" \
  >"$LOGFILE" 2>&1 &
echo $! >"$PIDFILE"
sleep 1.5

if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: failed to start. Log:" >&2
  tail -30 "$LOGFILE" >&2
  exit 1
fi

echo "PID=$(cat "$PIDFILE")"
echo "Knowledge: http://127.0.0.1:${PORT}/knowledge/"
echo "Health:    http://127.0.0.1:${PORT}/health"
echo "Log:       $LOGFILE"
