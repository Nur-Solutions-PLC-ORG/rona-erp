"""Report document builders keyed by report type."""

from __future__ import annotations

from collections.abc import Callable

from app.core.enums import ReportType
from app.schemas import RonaContextBundle
from app.services.reports.documents.attendance import build_attendance_document
from app.services.reports.documents.finance import build_finance_document
from app.services.reports.documents.inventory import build_inventory_document
from app.services.reports.documents.maintenance import build_maintenance_document
from app.services.reports.documents.management import build_management_document
from app.services.reports.documents.production import build_production_document
from app.services.reports.models import DocumentParts, ReportDocument

DocumentBuilder = Callable[[RonaContextBundle], DocumentParts]

#: Register new report types here; the service needs no changes.
DOCUMENT_BUILDERS: dict[ReportType, DocumentBuilder] = {
    ReportType.ATTENDANCE: build_attendance_document,
    ReportType.PRODUCTION: build_production_document,
    ReportType.INVENTORY_VALUATION: build_inventory_document,
    ReportType.MAINTENANCE: build_maintenance_document,
    ReportType.FINANCE: build_finance_document,
    ReportType.MANAGEMENT_SUMMARY: build_management_document,
}


def bundle_source_system(bundle: RonaContextBundle) -> str:
    for payload in (
        bundle.hr,
        bundle.production,
        bundle.inventory,
        bundle.maintenance,
        bundle.finance,
        bundle.procurement,
        bundle.sales,
    ):
        if payload is not None:
            return payload.source_system
    return "mock"


def build_document(bundle: RonaContextBundle, report_type: ReportType) -> ReportDocument:
    """Assemble the format-agnostic document for the requested report type."""
    title, summary, tables = DOCUMENT_BUILDERS[report_type](bundle)
    return ReportDocument(
        title=title,
        tenant_label=bundle.tenant_name or bundle.tenant_id,
        period_label=bundle.period.label,
        generated_at=bundle.generated_at,
        source_system=bundle_source_system(bundle),
        summary=summary,
        tables=tables,
    )


__all__ = [
    "DOCUMENT_BUILDERS",
    "DocumentBuilder",
    "build_attendance_document",
    "build_document",
    "build_finance_document",
    "build_inventory_document",
    "build_maintenance_document",
    "build_management_document",
    "build_production_document",
    "bundle_source_system",
]
