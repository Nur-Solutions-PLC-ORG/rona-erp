"""HTTP middleware: request IDs, security headers, body-size limits, audit log."""

from __future__ import annotations

import logging
import re
import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse

from app.api.schemas import ErrorResponse

logger = logging.getLogger("rona")

audit_logger = logging.getLogger("rona.audit")

_ERROR_CODES: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    413: "payload_too_large",
    422: "validation_error",
    500: "internal_error",
    501: "not_implemented",
    503: "service_unavailable",
}

_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")


def error_payload(status_code: int, detail: str | None, request_id: str | None) -> dict:
    return ErrorResponse(
        error=_ERROR_CODES.get(status_code, "error"),
        detail=detail,
        request_id=request_id,
    ).model_dump()


def request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def safe_request_id(value: str | None) -> str:
    if value and _REQUEST_ID_PATTERN.fullmatch(value):
        return value
    return uuid.uuid4().hex


def add_security_headers(response) -> None:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cache-Control"] = "no-store"


def _audit(request: Request, *, status_code: int, elapsed_ms: float) -> None:
    from app.core.config import get_settings

    if not get_settings().audit_log_enabled:
        return
    state = request.state
    audit_logger.info(
        "audit request_id=%s method=%s path=%s status=%d latency_ms=%.1f "
        "tenant=%s user=%s role=%s auth=%s",
        getattr(state, "request_id", "-"),
        request.method,
        request.url.path,
        status_code,
        elapsed_ms,
        getattr(state, "tenant_id", "-"),
        getattr(state, "user_id", "-"),
        getattr(state, "user_role", "-"),
        getattr(state, "auth_method", "-"),
    )


async def observability_middleware(request: Request, call_next):
    """Attach request IDs, enforce body-size limits, and audit every request."""
    from app.core.config import get_settings

    settings = get_settings()
    rid = safe_request_id(request.headers.get("X-Request-ID"))
    request.state.request_id = rid

    content_length = request.headers.get("content-length")
    if content_length:
        try:
            body_size = int(content_length)
        except ValueError:
            body_size = -1
        if body_size < 0 or body_size > settings.max_request_body_bytes:
            response = JSONResponse(
                status_code=413,
                content=error_payload(413, "Request body is too large", rid),
            )
            response.headers["X-Request-ID"] = rid
            add_security_headers(response)
            _audit(request, status_code=413, elapsed_ms=0.0)
            return response

    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        _audit(request, status_code=500, elapsed_ms=elapsed_ms)
        raise

    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = rid
    add_security_headers(response)

    if elapsed_ms > settings.response_target_seconds * 1000:
        logger.warning(
            "slow request request_id=%s path=%s latency_ms=%.1f target_ms=%.0f",
            rid,
            request.url.path,
            elapsed_ms,
            settings.response_target_seconds * 1000,
        )

    _audit(request, status_code=response.status_code, elapsed_ms=elapsed_ms)
    return response


__all__ = [
    "add_security_headers",
    "audit_logger",
    "error_payload",
    "observability_middleware",
    "request_id",
    "safe_request_id",
]
