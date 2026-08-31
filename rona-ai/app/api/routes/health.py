from __future__ import annotations

from fastapi import APIRouter

from app.api.schemas import ERROR_RESPONSES, HealthResponse
from app.core.config import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, responses=ERROR_RESPONSES)
async def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        adapter_backend=settings.adapter_backend,
        environment=settings.environment,
        llm_configured=settings.llm_configured,
        data_source_reachable=True,
    )


__all__ = ["router"]
