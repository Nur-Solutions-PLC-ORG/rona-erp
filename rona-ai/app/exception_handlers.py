"""Centralised FastAPI exception handlers producing the canonical error envelope."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.adapters.base import AdapterError, TenantNotFoundError
from app.middleware import add_security_headers, error_payload, request_id
from app.services.llm import LLMError
from app.services.reports import ReportError

logger = logging.getLogger("rona")


def register_exception_handlers(app: FastAPI) -> None:
    """Attach all exception handlers to the application instance."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        headers = getattr(exc, "headers", None) or {}
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(exc.status_code, exc.detail, request_id(request)),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        if errors:
            first = errors[0]
            loc = ".".join(str(p) for p in first.get("loc", ()) if p != "body")
            detail = f"{loc}: {first.get('msg')}" if loc else str(first.get("msg"))
        else:
            detail = "Request validation failed"
        return JSONResponse(
            status_code=422,
            content=error_payload(422, detail, request_id(request)),
        )

    @app.exception_handler(TenantNotFoundError)
    async def tenant_not_found_handler(request: Request, exc: TenantNotFoundError):
        return JSONResponse(
            status_code=404,
            content=error_payload(404, str(exc) or "Tenant not found", request_id(request)),
        )

    @app.exception_handler(AdapterError)
    async def adapter_error_handler(request: Request, exc: AdapterError):
        logger.error("adapter error request_id=%s error=%s", request_id(request), exc)
        return JSONResponse(
            status_code=503,
            content=error_payload(503, "The data source is temporarily unavailable", request_id(request)),
        )

    @app.exception_handler(LLMError)
    async def llm_error_handler(request: Request, exc: LLMError):
        logger.error("llm error request_id=%s error=%s", request_id(request), exc)
        return JSONResponse(
            status_code=503,
            content=error_payload(503, "The AI service is temporarily unavailable", request_id(request)),
        )

    @app.exception_handler(ReportError)
    async def report_error_handler(request: Request, exc: ReportError):
        logger.error("report error request_id=%s error=%s", request_id(request), exc)
        return JSONResponse(
            status_code=503,
            content=error_payload(503, "The report could not be generated", request_id(request)),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        rid = request_id(request)
        logger.error("unhandled exception request_id=%s error=%s", rid, exc)
        response = JSONResponse(
            status_code=500,
            content=error_payload(500, "An unexpected error occurred", rid),
            headers={"X-Request-ID": rid} if rid else {},
        )
        add_security_headers(response)
        return response


__all__ = ["register_exception_handlers"]
