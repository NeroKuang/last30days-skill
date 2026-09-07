"""Research service shared by REST (and future MCP) adapters."""

from __future__ import annotations

import asyncio
import logging
import os
import stat
import tempfile
from pathlib import Path
from typing import Any

from server.argv_builder import (
    build_diagnose_argv,
    build_research_argv,
    serialize_competitors_plan,
)
from server.config import Settings, read_upstream_commit
from server.engine_runner import EngineRunner
from server.errors import SERVER_BUSY, ApiError
from server.models import CapabilitiesResponse, ResearchRequest

logger = logging.getLogger("research_api.service")


class ResearchService:
    def __init__(self, settings: Settings, runner: EngineRunner | None = None) -> None:
        self.settings = settings
        self.runner = runner or EngineRunner(
            python_bin=settings.python_bin,
            default_timeout=settings.research_timeout_seconds,
        )
        self._semaphore = asyncio.Semaphore(settings.research_max_concurrency)

    async def research(
        self,
        request: ResearchRequest,
        *,
        request_id: str,
    ) -> dict[str, Any]:
        await self._acquire_or_busy(request_id)
        plan_path: Path | None = None
        try:
            if request.competitors_plan:
                plan_path = _write_competitors_plan(request.competitors_plan)
            argv = build_research_argv(
                request,
                competitors_plan_path=plan_path,
            )
            result = await asyncio.to_thread(
                self.runner.run,
                argv,
                timeout=self.settings.research_timeout_seconds,
                request_id=request_id,
                parse_json=True,
            )
            assert result.data is not None
            return result.data
        finally:
            self._semaphore.release()
            if plan_path is not None:
                _safe_unlink(plan_path)

    async def capabilities(self, *, request_id: str) -> CapabilitiesResponse:
        await self._acquire_or_busy(request_id)
        try:
            result = await asyncio.to_thread(
                self.runner.run,
                build_diagnose_argv(),
                timeout=self.settings.diagnose_timeout_seconds,
                request_id=request_id,
                parse_json=True,
            )
            assert result.data is not None
            sources = result.data.get("available_sources") or []
            if not isinstance(sources, list):
                sources = []
            safe_sources = [str(item) for item in sources]
            return CapabilitiesResponse(
                available_sources=safe_sources,
                wrapper_version=self.settings.wrapper_version,
                upstream_commit=read_upstream_commit(),
            )
        finally:
            self._semaphore.release()

    async def _acquire_or_busy(self, request_id: str) -> None:
        if self._semaphore.locked():
            raise ApiError(
                code=SERVER_BUSY,
                message="Too many concurrent research requests",
                status_code=429,
                request_id=request_id,
            )
        await self._semaphore.acquire()


def _write_competitors_plan(plan: dict) -> Path:
    payload = serialize_competitors_plan(plan)
    fd, name = tempfile.mkstemp(prefix="l30d-competitors-", suffix=".json")
    path = Path(name)
    try:
        os.fchmod(fd, stat.S_IRUSR | stat.S_IWUSR)
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(payload)
    except Exception:
        _safe_unlink(path)
        raise
    return path


def _safe_unlink(path: Path) -> None:
    try:
        path.unlink(missing_ok=True)
    except OSError as exc:
        logger.warning("temp_cleanup_failed path=%s err=%s", path, exc)
