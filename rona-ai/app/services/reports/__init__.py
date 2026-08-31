"""Report generation package.

Public surface mirrors the previous ``app.services.report_service`` module.
"""

from __future__ import annotations

from app.services.reports.documents import build_document
from app.services.reports.errors import ReportDataUnavailableError, ReportError
from app.services.reports.models import (
    ReportDocument,
    ReportResult,
    ReportTable,
)
from app.services.reports.renderers import render
from app.services.reports.service import ReportService, get_report_service

__all__ = [
    "ReportDataUnavailableError",
    "ReportDocument",
    "ReportError",
    "ReportResult",
    "ReportService",
    "ReportTable",
    "build_document",
    "get_report_service",
    "render",
]
