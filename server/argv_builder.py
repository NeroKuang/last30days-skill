"""Centralized HTTP field → engine argv mapping."""

from __future__ import annotations

import json
from pathlib import Path

from server.models import Depth, ResearchRequest


def build_research_argv(
    request: ResearchRequest,
    *,
    competitors_plan_path: Path | None = None,
) -> list[str]:
    """Return argv values after the engine script path (shell=False safe)."""
    argv: list[str] = [
        request.topic,
        f"--days={request.days}",
        "--emit=json",
        "--json-profile=agent",
        "--no-browser-cookies",
    ]

    if request.depth is Depth.quick:
        argv.append("--quick")
    elif request.depth is Depth.deep:
        argv.append("--deep")

    if request.search:
        argv.append(f"--search={','.join(request.search)}")

    if request.subreddits:
        argv.append(f"--subreddits={','.join(request.subreddits)}")

    if request.x_handle:
        argv.append(f"--x-handle={request.x_handle}")

    if request.github_user:
        argv.append(f"--github-user={request.github_user}")

    if request.audience_register.value != "default":
        argv.append(f"--register={request.audience_register.value}")

    if request.verify_freshness:
        argv.append("--verify-freshness")

    if request.hiring_signals:
        argv.append("--hiring-signals")

    if competitors_plan_path is not None:
        argv.append(f"--competitors-plan={competitors_plan_path}")

    return argv


def serialize_competitors_plan(plan: dict) -> str:
    """Serialize competitors_plan for a temp file consumed by upstream."""
    payload = {
        name: target.model_dump(exclude_none=True)
        if hasattr(target, "model_dump")
        else target
        for name, target in plan.items()
    }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def build_diagnose_argv() -> list[str]:
    return ["--diagnose"]
