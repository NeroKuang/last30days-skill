"""Wrapper error codes and HTTP mapping."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class ApiError(Exception):
    code: str
    message: str
    status_code: int
    request_id: str | None = None

    def as_body(self) -> dict[str, Any]:
        err: dict[str, Any] = {
            "code": self.code,
            "message": self.message,
        }
        if self.request_id:
            err["request_id"] = self.request_id
        return {"error": err}


INVALID_REQUEST = "INVALID_REQUEST"
UNAUTHORIZED = "UNAUTHORIZED"
ENGINE_TIMEOUT = "ENGINE_TIMEOUT"
ENGINE_FAILED = "ENGINE_FAILED"
INVALID_ENGINE_OUTPUT = "INVALID_ENGINE_OUTPUT"
SERVER_BUSY = "SERVER_BUSY"
INTERNAL_ERROR = "INTERNAL_ERROR"

STATUS_BY_CODE = {
    INVALID_REQUEST: 400,
    UNAUTHORIZED: 401,
    ENGINE_TIMEOUT: 504,
    ENGINE_FAILED: 502,
    INVALID_ENGINE_OUTPUT: 502,
    SERVER_BUSY: 429,
    INTERNAL_ERROR: 500,
}
