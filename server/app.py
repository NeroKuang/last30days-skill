"""FastAPI entrypoint for the Last30Days Remote Research API."""

from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from server import __version__
from server.auth import require_api_key
from server.config import (
    assert_python_version,
    get_settings,
    read_upstream_commit,
)
from server.errors import (
    INTERNAL_ERROR,
    INVALID_REQUEST,
    ApiError,
)
from server.models import (
    CapabilitiesResponse,
    HealthResponse,
    ResearchRequest,
)
from server.service import ResearchService

# Repo-root knowledge browser (synced static SPA). Public read — not secrets.
_KNOWLEDGE_BROWSER_DIR = (
    Path(__file__).resolve().parent.parent / "knowledge-browser" / "public"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("research_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    assert_python_version()
    settings = get_settings()
    app.state.settings = settings
    app.state.research_service = ResearchService(settings)
    logger.info(
        "research_api_start version=%s upstream=%s concurrency=%s timeout=%s",
        settings.wrapper_version,
        read_upstream_commit(),
        settings.research_max_concurrency,
        settings.research_timeout_seconds,
    )
    yield


app = FastAPI(
    title="Last30Days Remote Research API",
    version=__version__,
    lifespan=lifespan,
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Upstream-Commit"] = read_upstream_commit()
    response.headers["X-Wrapper-Version"] = get_settings().wrapper_version
    return response


@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError):
    if not exc.request_id:
        exc = ApiError(
            code=exc.code,
            message=exc.message,
            status_code=exc.status_code,
            request_id=getattr(request.state, "request_id", None),
        )
    return JSONResponse(status_code=exc.status_code, content=exc.as_body())


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": INVALID_REQUEST,
                "message": "Request validation failed",
                "request_id": request_id,
                "details": exc.errors(),
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", None)
    logger.exception("unhandled_error request_id=%s", request_id)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": INTERNAL_ERROR,
                "message": "Internal server error",
                "request_id": request_id,
            }
        },
    )


def get_service(request: Request) -> ResearchService:
    return request.app.state.research_service


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", service="last30days-research-api")


@app.get(
    "/v1/capabilities",
    response_model=CapabilitiesResponse,
    dependencies=[Depends(require_api_key)],
)
async def capabilities(
    request: Request,
    service: ResearchService = Depends(get_service),
) -> CapabilitiesResponse:
    return await service.capabilities(
        request_id=request.state.request_id,
    )


@app.post(
    "/v1/research",
    dependencies=[Depends(require_api_key)],
)
async def research(
    body: ResearchRequest,
    request: Request,
    service: ResearchService = Depends(get_service),
) -> dict[str, Any]:
    """Pass through upstream Agent JSON on success."""
    return await service.research(
        body,
        request_id=request.state.request_id,
    )


@app.get("/knowledge", include_in_schema=False)
async def knowledge_redirect() -> RedirectResponse:
    """Browser-friendly entry without trailing slash confusion."""
    return RedirectResponse(url="/knowledge/", status_code=307)


if _KNOWLEDGE_BROWSER_DIR.is_dir():
    app.mount(
        "/knowledge",
        StaticFiles(directory=str(_KNOWLEDGE_BROWSER_DIR), html=True),
        name="knowledge_browser",
    )
