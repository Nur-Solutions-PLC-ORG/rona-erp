from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.api.context import load_bundle, source_system
from app.api.dependencies import AdapterDep, AuthContextDep, validate_tenant_exists
from app.api.periods import resolve_period, utcnow
from app.api.schemas import (
    ERROR_RESPONSES,
    ChatRequest,
    ChatResponse,
    SupportingMetricOut,
)
from app.core.config import get_settings
from app.core.enums import domain_label
from app.services.ai_limit import consume_ai_request
from app.services.llm import LLMError, LLMQuotaError, get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, responses=ERROR_RESPONSES)
async def chat(
    request: ChatRequest,
    auth: AuthContextDep,
    adapter: AdapterDep,
) -> ChatResponse:
    settings = get_settings()
    tenant_name = await validate_tenant_exists(auth, adapter)

    await consume_ai_request(auth.tenant_id)
    period = resolve_period(
        request.period_start,
        request.period_end,
        default_month=False,
        question=request.question,
    )

    bundle = await load_bundle(
        adapter,
        auth,
        period,
        tenant_name=tenant_name,
        include_pending_tasks=False,
        language=request.language,
    )

    generated_at = utcnow()
    system = source_system(settings)

    if bundle.is_empty():
        return ChatResponse(
            answer="You do not have access to any data for this request.",
            supporting_data=[],
            recommendation=None,
            source=[],
            source_domains=[],
            data_available=False,
            tenant_id=auth.tenant_id,
            user_role=auth.user_role,
            period_label=period.label,
            generated_at=generated_at,
            source_system=system,
            partial_data=bool(bundle.failed_domains),
        )

    try:
        ai_response = await get_llm_service().generate_response(
            request.question, bundle
        )
    except LLMQuotaError as exc:
        raise _quota_http_error(exc) from exc
    except LLMError as exc:
        raise _llm_http_error(exc) from exc

    partial = bool(bundle.failed_domains) or bool(bundle.truncated_domains())

    return ChatResponse(
        answer=ai_response.answer,
        supporting_data=[
            SupportingMetricOut(**m.model_dump())
            for m in ai_response.supporting_data
        ],
        recommendation=ai_response.recommendation,
        source=[domain_label(d) for d in ai_response.source],
        source_domains=list(ai_response.source),
        kb_citations=list(ai_response.kb_citations),
        data_available=ai_response.data_available,
        tenant_id=auth.tenant_id,
        user_role=auth.user_role,
        period_label=period.label,
        generated_at=generated_at,
        source_system=system,
        partial_data=partial,
    )


def _quota_http_error(exc: LLMQuotaError) -> HTTPException:
    logger.warning(
        "LLM quota exhausted",
        extra={"retry_after_seconds": exc.retry_after_seconds},
    )
    headers = {}
    if exc.retry_after_seconds is not None:
        headers["Retry-After"] = str(exc.retry_after_seconds)
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=(
            "The AI request quota is currently exhausted. "
            "Please retry later or increase the Gemini API quota/billing plan."
        ),
        headers=headers,
    )


def _llm_http_error(exc: LLMError) -> HTTPException:
    logger.exception("LLM generation failed")
    settings = get_settings()
    detail = "The AI service is temporarily unavailable"
    if settings.environment == "development":
        detail = f"The AI service is temporarily unavailable: {exc}"
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=detail,
    )


__all__ = ["router"]
