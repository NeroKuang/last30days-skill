"""Pydantic request/response models for the Research API."""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class Depth(str, Enum):
    quick = "quick"
    default = "default"
    deep = "deep"


class Register(str, Enum):
    default = "default"
    exec = "exec"
    dev = "dev"
    creator = "creator"
    eli5 = "eli5"


class CompetitorTarget(BaseModel):
    """Per-entity targeting; fields mirror upstream --competitors-plan entries."""

    model_config = {"extra": "allow"}

    x_handle: str | None = None
    x_related: list[str] | str | None = None
    subreddits: list[str] | None = None
    github_user: str | None = None
    github_repos: list[str] | None = None
    trustpilot_domain: str | None = None
    context: str | None = None


class ResearchRequest(BaseModel):
    model_config = {"populate_by_name": True}

    topic: str = Field(..., min_length=1, max_length=500)
    days: int = Field(30, ge=1, le=365)
    depth: Depth = Depth.default
    search: list[str] | None = None
    subreddits: list[str] | None = None
    x_handle: str | None = Field(None, max_length=128)
    github_user: str | None = Field(None, max_length=128)
    audience_register: Register = Field(
        default=Register.default,
        alias="register",
    )
    verify_freshness: bool = False
    hiring_signals: bool = False
    competitors_plan: dict[str, CompetitorTarget] | None = None

    @field_validator("topic")
    @classmethod
    def topic_stripped(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("topic must be non-empty")
        return cleaned

    @field_validator("search")
    @classmethod
    def search_tokens(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [item.strip() for item in value if item and item.strip()]
        if not cleaned:
            raise ValueError("search must contain at least one source token")
        for token in cleaned:
            if any(ch in token for ch in " \t\n\r;|&`$"):
                raise ValueError(f"invalid search token: {token!r}")
        return cleaned

    @field_validator("subreddits")
    @classmethod
    def subreddit_names(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [
            item.strip().removeprefix("r/")
            for item in value
            if item and item.strip()
        ]
        if not cleaned:
            raise ValueError("subreddits must contain at least one name")
        return cleaned

    @field_validator("x_handle", "github_user")
    @classmethod
    def strip_at(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().lstrip("@")
        return cleaned or None


class HealthResponse(BaseModel):
    status: str
    service: str


class CapabilitiesResponse(BaseModel):
    available_sources: list[str]
    wrapper_version: str
    upstream_commit: str


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


# Successful research body is opaque upstream Agent JSON.
AgentJson = dict[str, Any]
