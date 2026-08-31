"""Backwards-compatible shim for the old flat ``report_service`` module.

The implementation now lives in :mod:`app.services.reports`. Import from there.
"""

from app.services.reports import (
    ReportDataUnavailableError,
    ReportDocument,
    ReportError,
    ReportResult,
    ReportService,
    ReportTable,
    get_report_service,
)

__all__ = [
    "ReportDataUnavailableError",
    "ReportDocument",
    "ReportError",
    "ReportResult",
    "ReportService",
    "ReportTable",
    "get_report_service",
]
