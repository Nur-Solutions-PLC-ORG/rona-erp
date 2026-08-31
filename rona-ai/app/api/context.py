from __future__ import annotations

import logging
from datetime import datetime

from fastapi import HTTPException, status

from app.adapters.base import AdapterError, TenantNotFoundError
from app.api.dependencies import AdapterDep, AuthContextDep
from app.core.config import Settings
from app.core.enums import Language
from app.schemas import PeriodSpec, RonaContextBundle, assert_tenant_match

logger = logging.getLogger(__name__)


def source_system(settings: Settings) -> str:
    return "mock" if settings.using_mock_data else "rona-erp"


def greeting(now: datetime) -> str:
    hour = now.hour
    if hour < 12:
        return "Good morning"
    if hour < 18:
        return "Good afternoon"
    return "Good evening"


async def load_bundle(
    adapter: AdapterDep,
    auth: AuthContextDep,
    period: PeriodSpec,
    *,
    tenant_name: str,
    include_pending_tasks: bool,
    language: Language | None = None,
) -> RonaContextBundle:
    try:
        bundle = await adapter.build_context_bundle(
            tenant_id=auth.tenant_id,
            user_role=auth.user_role,
            granted_domains=auth.granted_domains,
            denied_domains=auth.denied_domains,
            period=period,
            language=language,
            include_alerts=True,
            include_pending_tasks=include_pending_tasks,
            tenant_name=tenant_name,
        )
    except TenantNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant not found: {auth.tenant_id}",
        )
    except AdapterError:
        logger.exception(
            "adapter failed to build bundle", extra={"tenant_id": auth.tenant_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The data source is temporarily unavailable",
        )

    assert_tenant_match(bundle.tenant_id, auth.tenant_id)
    return bundle


__all__ = ["greeting", "load_bundle", "source_system"]
