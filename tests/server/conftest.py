from __future__ import annotations

import os

import pytest

# Must be set before Settings / app import side effects in tests.
os.environ.setdefault("RESEARCH_API_KEY", "test-secret-key")
os.environ.setdefault("RESEARCH_MAX_CONCURRENCY", "2")
os.environ.setdefault("RESEARCH_TIMEOUT_SECONDS", "120")


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    from server.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
