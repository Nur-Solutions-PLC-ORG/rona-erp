from __future__ import annotations

from fastapi import APIRouter
from app.api.context import greeting, load_bundle, source_system
from app.api.dependencies import AdapterDep, AuthContextDep, validate_tenant_exists
from app.api.periods import utcnow
from app.api.presenters import build_metric_groups
from app.api.schemas import (
    ERROR_RESPONSES,
    AlertOut,
    PendingTaskOut,
    SummaryResponse,
)
from app.core.config import get_settings
from app.schemas import PeriodSpec

router = APIRouter()
@router.get("/summary", response_model=SummaryResponse, responses=ERROR_RESPONSES)
async def summary(
    auth: AuthContextDep,
    adapter: AdapterDep,
) -> SummaryResponse:
    settings = get_settings()
    tenant_name = await validate_tenant_exists(auth, adapter)
    now = utcnow()
    period = PeriodSpec.for_day(now.date())

    bundle = await load_bundle(
        adapter, auth, period, tenant_name=tenant_name, include_pending_tasks=True
    )

    return SummaryResponse(
        greeting=greeting(now),
        tenant_id=auth.tenant_id,
        tenant_name=bundle.tenant_name or tenant_name,
        period_label=period.label,
        period_start=period.start,
        period_end=period.end,
        metrics=build_metric_groups(bundle),
        alerts=[AlertOut(**a.model_dump()) for a in bundle.alerts],
        pending_tasks=[PendingTaskOut(**t.model_dump()) for t in bundle.pending_tasks],
        granted_domains=list(bundle.granted_domains),
        denied_domains=list(bundle.denied_domains),
        unavailable_domains=list(bundle.failed_domains),
        generated_at=now,
        source_system=source_system(settings),
    )


__all__ = ["router"]
