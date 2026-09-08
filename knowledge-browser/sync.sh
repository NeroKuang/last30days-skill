#!/usr/bin/env bash
# Sync ~/Documents/Last30Days/knowledge → knowledge-browser/public
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${LAST30DAYS_KNOWLEDGE_DIR:-$HOME/Documents/Last30Days/knowledge}"
DST="$ROOT/knowledge-browser/public"

if [ ! -d "$SRC" ]; then
  echo "ERROR: knowledge source missing: $SRC" >&2
  exit 1
fi

mkdir -p "$DST"

# SPA chrome stays; refresh catalog + topics (+ optional README)
cp "$SRC/catalog.json" "$DST/catalog.json"
cp "$SRC/README.md" "$DST/README.md" 2>/dev/null || true
rm -rf "$DST/topics" "$DST/knowledge"
cp -R "$SRC/topics" "$DST/topics"

echo "Synced $SRC → $DST"
echo "Next: commit knowledge-browser/public + server mount, then push & Zeabur redeploy"
