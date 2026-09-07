"""Safe Upstream Engine subprocess runner."""

from __future__ import annotations

import json
import logging
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from server.config import (
    ENGINE_SCRIPT,
    ENGINE_SCRIPTS_DIR,
    STRIP_FROM_ENGINE_ENV,
    assert_python_version,
)
from server.errors import (
    ENGINE_FAILED,
    ENGINE_TIMEOUT,
    INVALID_ENGINE_OUTPUT,
    ApiError,
)

logger = logging.getLogger("research_api.engine")

_SECRET_RE = re.compile(
    r"(?i)(authorization|api[_-]?key|token|cookie|password|secret)\s*[:=]\s*\S+"
)


def redact(text: str) -> str:
    return _SECRET_RE.sub(r"\1=[REDACTED]", text)


@dataclass
class EngineResult:
    stdout: str
    stderr: str
    exit_code: int
    timed_out: bool
    data: dict[str, Any] | None = None


def build_engine_env(
    base: Mapping[str, str] | None = None,
) -> dict[str, str]:
    """Copy process env, strip remote-mode vars, set PYTHONPATH for engine lib."""
    env = dict(base if base is not None else os.environ)
    for key in STRIP_FROM_ENGINE_ENV:
        env.pop(key, None)
    env["PYTHONPATH"] = str(ENGINE_SCRIPTS_DIR)
    return env


class EngineRunner:
    def __init__(
        self,
        *,
        python_bin: str | None = None,
        engine_script: str | Path | None = None,
        default_timeout: float = 600.0,
    ) -> None:
        assert_python_version()
        self.python_bin = python_bin or sys.executable or "python3"
        self.engine_script = Path(engine_script) if engine_script else ENGINE_SCRIPT
        self.default_timeout = default_timeout
        if not self.engine_script.is_file():
            raise FileNotFoundError(f"Upstream engine not found: {self.engine_script}")

    def run(
        self,
        args: list[str],
        *,
        timeout: float | None = None,
        request_id: str | None = None,
        parse_json: bool = True,
        env: Mapping[str, str] | None = None,
    ) -> EngineResult:
        timeout_s = self.default_timeout if timeout is None else timeout
        argv = [self.python_bin, str(self.engine_script), *args]
        child_env = build_engine_env(env)

        logger.info(
            "engine_start request_id=%s timeout=%s argv_flags=%s",
            request_id,
            timeout_s,
            _safe_flag_summary(args),
        )

        try:
            completed = subprocess.run(
                argv,
                capture_output=True,
                text=True,
                timeout=timeout_s,
                env=child_env,
                shell=False,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            stdout = exc.stdout or ""
            stderr = exc.stderr or ""
            if isinstance(stdout, bytes):
                stdout = stdout.decode("utf-8", errors="replace")
            if isinstance(stderr, bytes):
                stderr = stderr.decode("utf-8", errors="replace")
            logger.error(
                "engine_timeout request_id=%s stderr=%s",
                request_id,
                redact(stderr)[:4000],
            )
            raise ApiError(
                code=ENGINE_TIMEOUT,
                message="Research engine timed out",
                status_code=504,
                request_id=request_id,
            ) from exc

        result = EngineResult(
            stdout=completed.stdout or "",
            stderr=completed.stderr or "",
            exit_code=int(completed.returncode),
            timed_out=False,
        )

        if result.stderr:
            logger.info(
                "engine_stderr request_id=%s exit=%s stderr=%s",
                request_id,
                result.exit_code,
                redact(result.stderr)[:4000],
            )

        if result.exit_code != 0:
            logger.error(
                "engine_failed request_id=%s exit=%s",
                request_id,
                result.exit_code,
            )
            raise ApiError(
                code=ENGINE_FAILED,
                message="Research engine did not complete successfully",
                status_code=502,
                request_id=request_id,
            )

        if not parse_json:
            return result

        try:
            parsed = json.loads(result.stdout)
        except json.JSONDecodeError as exc:
            logger.error(
                "invalid_engine_json request_id=%s stdout_prefix=%s",
                request_id,
                redact(result.stdout[:500]),
            )
            raise ApiError(
                code=INVALID_ENGINE_OUTPUT,
                message="Research engine returned invalid JSON",
                status_code=502,
                request_id=request_id,
            ) from exc

        if not isinstance(parsed, dict):
            raise ApiError(
                code=INVALID_ENGINE_OUTPUT,
                message="Research engine JSON must be an object",
                status_code=502,
                request_id=request_id,
            )

        result.data = parsed
        return result


def _safe_flag_summary(args: list[str]) -> list[str]:
    summary: list[str] = []
    for item in args:
        if item.startswith("--"):
            summary.append(item.split("=", 1)[0])
        elif not summary:
            summary.append("<topic>")
    return summary
