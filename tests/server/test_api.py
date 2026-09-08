from __future__ import annotations

import json
from typing import Any

import pytest
from fastapi.testclient import TestClient

from server.config import get_settings
from server.errors import ApiError, ENGINE_FAILED
from server.service import ResearchService


class FakeRunner:
    def __init__(self, payload: dict[str, Any] | None = None, fail: bool = False):
        self.payload = payload or {
            "schema_version": "1.2",
            "query": "test",
            "generated_at": "...",
            "window_days": 30,
            "source_status": {"reddit": "ok"},
            "freshness_verdicts": [],
            "clusters": [],
            "results": [{"title": "a"}],
            "extra_future": 1,
        }
        self.fail = fail
        self.last_args: list[str] | None = None

    def run(self, args, **kwargs):
        from server.engine_runner import EngineResult

        self.last_args = list(args)
        if self.fail:
            raise ApiError(
                code=ENGINE_FAILED,
                message="Research engine did not complete successfully",
                status_code=502,
                request_id=kwargs.get("request_id"),
            )
        return EngineResult(
            stdout=json.dumps(self.payload),
            stderr="narrate only",
            exit_code=0,
            timed_out=False,
            data=self.payload,
        )


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RESEARCH_API_KEY", "test-secret-key")
    get_settings.cache_clear()

    from server.app import app

    fake = FakeRunner()

    with TestClient(app) as test_client:
        settings = get_settings()
        service = ResearchService(settings, runner=fake)  # type: ignore[arg-type]
        test_client.app.state.research_service = service
        test_client.app.state.fake_runner = fake
        yield test_client


def test_health_public(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {
        "status": "ok",
        "service": "last30days-research-api",
    }
    assert "X-Request-ID" in res.headers


def test_research_requires_auth(client: TestClient):
    res = client.post("/v1/research", json={"topic": "x"})
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "UNAUTHORIZED"


def test_research_rejects_bad_key(client: TestClient):
    res = client.post(
        "/v1/research",
        json={"topic": "x"},
        headers={"Authorization": "Bearer wrong"},
    )
    assert res.status_code == 401


def test_research_pass_through(client: TestClient):
    res = client.post(
        "/v1/research",
        json={"topic": "Claude Code developer experience", "days": 30, "depth": "default"},
        headers={"Authorization": "Bearer test-secret-key"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["schema_version"] == "1.2"
    assert body["extra_future"] == 1
    assert "error" not in body
    # stderr must not leak into JSON body keys
    assert "narrate" not in json.dumps(body)
    fake = client.app.state.fake_runner
    assert "--emit=json" in fake.last_args
    assert "--json-profile=agent" in fake.last_args


def test_research_engine_failure(client: TestClient, monkeypatch):
    fake = FakeRunner(fail=True)
    settings = get_settings()
    client.app.state.research_service = ResearchService(settings, runner=fake)  # type: ignore[arg-type]
    res = client.post(
        "/v1/research",
        json={"topic": "x"},
        headers={"Authorization": "Bearer test-secret-key"},
    )
    assert res.status_code == 502
    assert res.json()["error"]["code"] == "ENGINE_FAILED"


def test_capabilities_requires_auth(client: TestClient):
    res = client.get("/v1/capabilities")
    assert res.status_code == 401


def test_capabilities_ok(client: TestClient):
    fake = FakeRunner(payload={"available_sources": ["reddit", "hackernews"]})
    settings = get_settings()
    client.app.state.research_service = ResearchService(settings, runner=fake)  # type: ignore[arg-type]
    res = client.get(
        "/v1/capabilities",
        headers={"Authorization": "Bearer test-secret-key"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["available_sources"] == ["reddit", "hackernews"]
    assert "wrapper_version" in data
    assert "upstream_commit" in data


def test_knowledge_browser_public(client: TestClient):
    """Synced static knowledge SPA is mounted without auth."""
    root = client.get("/knowledge/", follow_redirects=True)
    assert root.status_code == 200
    assert "text/html" in root.headers.get("content-type", "")
    body = root.content.lower()
    assert b"l30d" in body or "知識庫".encode("utf-8") in root.content

    catalog = client.get("/knowledge/catalog.json")
    assert catalog.status_code == 200
    payload = catalog.json()
    assert "topics" in payload
    assert any(t.get("slug") == "ai-coding-agents" for t in payload["topics"])

    note = client.get(
        "/knowledge/topics/ai-coding-agents/notes/01-persistent-memory.md"
    )
    assert note.status_code == 200
    assert b"Persistent Memory" in note.content

    mindmap = client.get("/knowledge/topics/ai-coding-agents/mindmap.md")
    assert mindmap.status_code == 200
    assert b"AI Coding Agents" in mindmap.content or "持久記憶".encode("utf-8") in mindmap.content
