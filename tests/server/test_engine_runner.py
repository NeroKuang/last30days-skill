from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

import pytest

from server.engine_runner import EngineRunner, build_engine_env
from server.errors import ENGINE_FAILED, ENGINE_TIMEOUT, INVALID_ENGINE_OUTPUT, ApiError


def test_build_engine_env_strips_remote_mode_vars():
    env = build_engine_env(
        {
            "PATH": "/usr/bin",
            "LAST30DAYS_API_BASE": "https://evil.example",
            "LAST30DAYS_API_KEY": "should-not-leak",
            "RESEARCH_API_KEY": "wrapper-key",
            "OTHER": "1",
        }
    )
    assert "LAST30DAYS_API_BASE" not in env
    assert "LAST30DAYS_API_KEY" not in env
    assert env["RESEARCH_API_KEY"] == "wrapper-key"
    assert "PYTHONPATH" in env


def test_runner_pass_through_json(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    script = tmp_path / "fake_engine.py"
    payload = {
        "schema_version": "1.2",
        "query": "test",
        "generated_at": "2026-01-01T00:00:00Z",
        "window_days": 30,
        "source_status": {},
        "freshness_verdicts": [],
        "clusters": [],
        "results": [],
    }
    script.write_text(
        "import sys\n"
        "print(" + json.dumps(json.dumps(payload)) + ")\n"
        "print('progress on stderr', file=sys.stderr)\n",
        encoding="utf-8",
    )
    runner = EngineRunner(engine_script=script, default_timeout=30)
    result = runner.run(["ignored-topic"], request_id="r1")
    assert result.data == payload
    assert "progress on stderr" in result.stderr
    assert result.data is not None
    assert "progress" not in json.dumps(result.data)


def test_runner_future_schema_fields_tolerated(tmp_path: Path):
    script = tmp_path / "fake_engine.py"
    payload = {
        "schema_version": "1.3",
        "query": "test",
        "brand_new_field": {"nested": True},
        "results": [],
    }
    script.write_text(
        f"print({json.dumps(json.dumps(payload))})\n",
        encoding="utf-8",
    )
    runner = EngineRunner(engine_script=script, default_timeout=30)
    result = runner.run([])
    assert result.data["schema_version"] == "1.3"
    assert result.data["brand_new_field"]["nested"] is True


def test_runner_nonzero_exit(tmp_path: Path):
    script = tmp_path / "fake_engine.py"
    script.write_text("import sys\nsys.exit(2)\n", encoding="utf-8")
    runner = EngineRunner(engine_script=script, default_timeout=30)
    with pytest.raises(ApiError) as exc:
        runner.run([])
    assert exc.value.code == ENGINE_FAILED


def test_runner_invalid_json(tmp_path: Path):
    script = tmp_path / "fake_engine.py"
    script.write_text("print('not-json')\n", encoding="utf-8")
    runner = EngineRunner(engine_script=script, default_timeout=30)
    with pytest.raises(ApiError) as exc:
        runner.run([])
    assert exc.value.code == INVALID_ENGINE_OUTPUT


def test_runner_timeout(tmp_path: Path):
    script = tmp_path / "fake_engine.py"
    script.write_text("import time\ntime.sleep(5)\n", encoding="utf-8")
    runner = EngineRunner(engine_script=script, default_timeout=0.2)
    with pytest.raises(ApiError) as exc:
        runner.run([])
    assert exc.value.code == ENGINE_TIMEOUT


def test_no_shell_execution_for_metachar_topic(tmp_path: Path, monkeypatch):
    script = tmp_path / "fake_engine.py"
    script.write_text(
        "import json,sys\n"
        "print(json.dumps({'schema_version':'1.2','query':sys.argv[1],'results':[],"
        "'source_status':{},'clusters':[],'freshness_verdicts':[],"
        "'generated_at':'t','window_days':1}))\n",
        encoding="utf-8",
    )
    calls: list[dict] = []

    real_run = subprocess.run

    def tracked_run(*args, **kwargs):
        calls.append({"args": args, "kwargs": kwargs})
        return real_run(*args, **kwargs)

    monkeypatch.setattr(subprocess, "run", tracked_run)
    runner = EngineRunner(engine_script=script, default_timeout=30)
    topic = "foo; rm -rf /"
    runner.run([topic, "--emit=json"])
    assert calls
    assert calls[0]["kwargs"].get("shell") is False
    assert topic in calls[0]["args"][0]
