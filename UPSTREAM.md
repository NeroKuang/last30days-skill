# Upstream tracking

## Upstream repository

https://github.com/mvanhorn/last30days-skill

## Upstream commit SHA

`56ba5ace27e4697aedc60aa0b1e1bfdcd592ff20`

(Also mirrored in `server/UPSTREAM_COMMIT.txt` for runtime headers.)

## Integration date

2026-09-07

## Local wrapper changes

Additive only under:

- `server/` — FastAPI Remote Research API (Agent REST Contract)
- `tests/server/` — wrapper tests (not research-quality tests)
- `CONTEXT.md` — domain glossary for this fork
- `.cursor/goals.md` — local goal tracking

Do **not** rewrite research logic under `skills/last30days/scripts/`.

## Syncing upstream

```bash
git fetch upstream
git merge upstream/main
# expect conflicts mainly outside server/ if any
```

Remote name: `upstream` → `https://github.com/mvanhorn/last30days-skill.git`
