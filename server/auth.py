"""Bearer authentication for the Research API."""

from __future__ import annotations

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from server.config import Settings, get_settings
from server.errors import UNAUTHORIZED, ApiError

_bearer = HTTPBearer(auto_error=False)


def require_api_key(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> None:
    request_id = getattr(request.state, "request_id", None)
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise ApiError(
            code=UNAUTHORIZED,
            message="Missing or invalid Authorization Bearer token",
            status_code=401,
            request_id=request_id,
        )
    if credentials.credentials != settings.research_api_key:
        raise ApiError(
            code=UNAUTHORIZED,
            message="Invalid API key",
            status_code=401,
            request_id=request_id,
        )
