"""Integration: real upstream engine with --mock → agent JSON."""

from __future__ import annotations

import sys

import pytest

from server.config import ENGINE_SCRIPT
from server.engine_runner import EngineRunner


@pytest.mark.integration
def test_real_engine_mock_agent_json():
    if not ENGINE_SCRIPT.is_file():
        pytest.skip("upstream engine missing")
    runner = EngineRunner(python_bin=sys.executable, default_timeout=120)
    result = runner.run(
        [
            "AI coding agents",
            "--days=7",
            "--quick",
            "--mock",
            "--emit=json",
            "--json-profile=agent",
            "--no-browser-cookies",
        ],
        request_id="integration-mock",
    )
    data = result.data
    assert data is not None
    for key in ("schema_version", "query", "source_status", "clusters", "results"):
        assert key in data
    assert isinstance(data["schema_version"], str)
    assert data["query"]
