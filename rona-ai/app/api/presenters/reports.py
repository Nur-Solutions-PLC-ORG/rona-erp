from __future__ import annotations

from fastapi import HTTPException, status

from app.api.schemas import ReportResponse
from app.core.config import Settings
from app.core.enums import DataDomain, ExportFormat, ReportType

REPORT_REQUIRED_DOMAIN: dict[ReportType, DataDomain | None] = {
    ReportType.ATTENDANCE: DataDomain.ATTENDANCE,
    ReportType.PRODUCTION: DataDomain.PRODUCTION,
    ReportType.INVENTORY_VALUATION: DataDomain.INVENTORY,
    ReportType.MAINTENANCE: DataDomain.MAINTENANCE,
    ReportType.FINANCE: DataDomain.FINANCE,
    ReportType.MANAGEMENT_SUMMARY: None,
}

MEDIA_TYPES: dict[ExportFormat, str] = {
    ExportFormat.PDF: "application/pdf",
    ExportFormat.EXCEL: (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ),
    ExportFormat.JSON: "application/json",
}

_FALLBACK_MEDIA_TYPE = "application/octet-stream"


def download_url(settings: Settings, report_id: str) -> str:
    return f"{settings.api_v1_prefix}/reports/{report_id}/download"


def report_media_type(export_format: str | ExportFormat) -> str:
    try:
        fmt = ExportFormat(export_format)
    except ValueError:
        return _FALLBACK_MEDIA_TYPE
    return MEDIA_TYPES.get(fmt, _FALLBACK_MEDIA_TYPE)


def report_response(
    job,
    *,
    settings: Settings,
    message: str | None = None,
) -> ReportResponse:
    """Render a report job row as an API response, 404-ing on missing jobs."""
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Report not found"
        )
    ready = job.status == "ready"
    return ReportResponse(
        report_id=job.report_id,
        status=job.status,
        report_type=ReportType(job.report_type),
        export_format=ExportFormat(job.export_format),
        period_label=job.period_label,
        filename=job.filename if ready else None,
        byte_size=job.byte_size if ready else None,
        download_url=download_url(settings, job.report_id) if ready else None,
        generated_at=job.completed_at or job.created_at,
        message=message or job.error_message,
    )


__all__ = [
    "MEDIA_TYPES",
    "REPORT_REQUIRED_DOMAIN",
    "download_url",
    "report_media_type",
    "report_response",
]
