"""Server configuration (wrapper-owned env namespace)."""

from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parent.parent
ENGINE_SCRIPT = REPO_ROOT / "skills" / "last30days" / "scripts" / "last30days.py"
ENGINE_SCRIPTS_DIR = ENGINE_SCRIPT.parent
UPSTREAM_COMMIT_FILE = Path(__file__).resolve().parent / "UPSTREAM_COMMIT.txt"
MIN_PYTHON = (3, 12)

# Must never be used as this server's HTTP auth (upstream remote-mode trigger).
STRIP_FROM_ENGINE_ENV = frozenset(
    {
        "LAST30DAYS_API_BASE",
        "LAST30DAYS_API_KEY",
    }
)


def read_upstream_commit() -> str:
    try:
        return UPSTREAM_COMMIT_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        return "unknown"


def assert_python_version() -> None:
    if sys.version_info[:2] < MIN_PYTHON:
        req = f"{MIN_PYTHON[0]}.{MIN_PYTHON[1]}"
        raise RuntimeError(
            f"Python >= {req} required for Upstream Engine "
            f"(found {sys.version_info.major}.{sys.version_info.minor})"
        )


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    research_api_key: str = Field(
        ...,
        alias="RESEARCH_API_KEY",
        description="Bearer token for Research API auth (not LAST30DAYS_API_KEY).",
    )
    research_timeout_seconds: float = Field(
        600.0,
        alias="RESEARCH_TIMEOUT_SECONDS",
        ge=30.0,
        le=3600.0,
    )
    research_max_concurrency: int = Field(
        2,
        alias="RESEARCH_MAX_CONCURRENCY",
        ge=1,
        le=32,
    )
    diagnose_timeout_seconds: float = Field(
        60.0,
        alias="DIAGNOSE_TIMEOUT_SECONDS",
        ge=5.0,
        le=300.0,
    )
    python_bin: str = Field("python3", alias="RESEARCH_PYTHON_BIN")
    host: str = Field("0.0.0.0", alias="RESEARCH_HOST")
    port: int = Field(5002, alias="RESEARCH_PORT")
    wrapper_version: str = Field("0.1.0", alias="WRAPPER_VERSION")

    @field_validator("research_api_key")
    @classmethod
    def non_empty_key(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("RESEARCH_API_KEY must be a non-empty string")
        return cleaned


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
