"""Report endpoint request/response models."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.api.schemas.common import PeriodRequestMixin
from app.core.enums import ExportFormat, ReportType


class ReportRequest(PeriodRequestMixin):

    report_type: ReportType
    export_format: ExportFormat = ExportFormat.PDF


class ReportResponse(BaseModel):

    report_id: str
    status: Literal["pending", "processing", "ready", "failed"]
    report_type: ReportType
    export_format: ExportFormat
    period_label: str
    filename: str | None = None
    byte_size: int | None = None
    download_url: str | None = None
    generated_at: datetime
    message: str | None = None


__all__ = ["ReportRequest", "ReportResponse"]
