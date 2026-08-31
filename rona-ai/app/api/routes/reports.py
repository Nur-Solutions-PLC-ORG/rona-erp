from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, HTTPException, Response, status

from app.api.context import load_bundle
from app.api.dependencies import AdapterDep, AuthContextDep, validate_tenant_exists
from app.api.periods import resolve_period
from app.api.presenters import (
    REPORT_REQUIRED_DOMAIN,
    report_media_type,
    report_response,
)
from app.api.schemas import ERROR_RESPONSES, ReportRequest, ReportResponse
from app.core.config import get_settings
from app.core.database import create_report_job, get_report_job
from app.core.enums import DataDomain, domain_label
from app.services.report_storage import get_report_storage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/reports/export",
    response_model=ReportResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses=ERROR_RESPONSES,
)
async def export_report(
    request: ReportRequest,
    auth: AuthContextDep,
    adapter: AdapterDep,
) -> ReportResponse:
    settings = get_settings()
    tenant_name = await validate_tenant_exists(auth, adapter)

    required_domain = REPORT_REQUIRED_DOMAIN[request.report_type]
    if required_domain is not None and required_domain not in auth.granted_domains:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have access to {domain_label(required_domain)} data",
        )

    period = resolve_period(
        request.period_start, request.period_end, default_month=True
    )
    bundle = await load_bundle(
        adapter, auth, period, tenant_name=tenant_name, include_pending_tasks=True
    )
    report_id = f"RPT-{request.report_type.value}-{uuid.uuid4().hex}"
    create_report_job(
        report_id=report_id,
        tenant_id=auth.tenant_id,
        requested_by=auth.user_id,
        report_type=request.report_type.value,
        export_format=request.export_format.value,
        period_label=period.label,
        payload=bundle.model_dump(mode="json"),
        authorized_domains=[domain.value for domain in auth.granted_domains],
        max_attempts=settings.report_job_max_attempts,
    )
    logger.info(
        "report job created",
        extra={
            "tenant_id": auth.tenant_id,
            "report_id": report_id,
            "report_type": request.report_type.value,
        },
    )
    return report_response(
        get_report_job(report_id, auth.tenant_id),
        settings=settings,
        message="Report queued for generation.",
    )


@router.get(
    "/reports/{report_id}", response_model=ReportResponse, responses=ERROR_RESPONSES
)
async def report_status(report_id: str, auth: AuthContextDep) -> ReportResponse:
    return report_response(
        _authorized_report_job(report_id, auth), settings=get_settings()
    )


@router.get("/reports/{report_id}/download", responses=ERROR_RESPONSES)
async def download_report(report_id: str, auth: AuthContextDep) -> Response:
    job = _authorized_report_job(report_id, auth)
    if job.status != "ready" or not job.storage_key or not job.filename:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report not found: {report_id}",
        )
    try:
        data = await get_report_storage().get(job.storage_key)
    except Exception as exc:
        logger.exception("report download failed", extra={"report_id": report_id})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The report file is temporarily unavailable",
        ) from exc
    return Response(
        content=data,
        media_type=report_media_type(job.export_format),
        headers={"Content-Disposition": f'attachment; filename="{job.filename}"'},
    )


def _authorized_report_job(report_id: str, auth: AuthContextDep):
    job = get_report_job(report_id, auth.tenant_id)
    if job is None or job.requested_by != auth.user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    try:
        snapshot_domains = {
            DataDomain(value) for value in json.loads(job.authorized_domains_json)
        }
    except (TypeError, ValueError, json.JSONDecodeError):
        logger.error(
            "report has invalid authorization metadata",
            extra={"report_id": report_id},
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    if not snapshot_domains.issubset(set(auth.granted_domains)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    return job
__all__ = ["router"]
