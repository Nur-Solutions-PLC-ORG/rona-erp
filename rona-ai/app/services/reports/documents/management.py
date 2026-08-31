"""Management summary report document builder."""

from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.documents.attendance import build_attendance_document
from app.services.reports.documents.finance import build_finance_document
from app.services.reports.documents.inventory import build_inventory_document
from app.services.reports.documents.maintenance import build_maintenance_document
from app.services.reports.documents.production import build_production_document
from app.services.reports.documents.tables import SUPPLEMENTARY_TABLE_BUILDERS
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def _headline_metrics(bundle: RonaContextBundle) -> list[tuple[str, str]]:
    summary: list[tuple[str, str]] = []
    if bundle.hr:
        summary.append(("Attendance rate", f"{bundle.hr.attendance_rate_pct}%"))
        summary.append(("Absent", str(bundle.hr.absent_count)))
    if bundle.production:
        summary.append(("Production efficiency", f"{bundle.production.overall_efficiency_pct}%"))
    if bundle.inventory:
        inv = bundle.inventory
        summary.append(("Inventory value", f"{inv.currency} {inv.total_inventory_value:,.2f}"))
        summary.append(
            ("Low / out of stock", f"{inv.low_stock_count} / {inv.out_of_stock_count}")
        )
    if bundle.maintenance:
        summary.append(("Fleet availability", f"{bundle.maintenance.fleet_availability_pct}%"))
        summary.append(("Machines in breakdown", str(bundle.maintenance.breakdown_count)))
    if bundle.finance:
        fin = bundle.finance
        summary.append(("Net profit", f"{fin.currency} {fin.net_profit:,.2f}"))
    if bundle.procurement:
        summary.append(("Open POs", str(bundle.procurement.open_po_count)))
    if bundle.sales:
        sales = bundle.sales
        summary.append(("Sales revenue", f"{sales.currency} {sales.total_revenue:,.2f}"))
    return summary


def _drill_down_tables(bundle: RonaContextBundle) -> list[ReportTable]:
    # Management summaries need the same drill-down data as the specialist
    # reports so spreadsheet users can investigate headline metrics.
    tables: list[ReportTable] = []
    for payload, builder in (
        (bundle.hr, build_attendance_document),
        (bundle.production, build_production_document),
        (bundle.inventory, build_inventory_document),
        (bundle.maintenance, build_maintenance_document),
        (bundle.finance, build_finance_document),
    ):
        if payload is not None:
            _, _, detail_tables = builder(bundle)
            tables.extend(detail_tables)
    return tables


def build_management_document(bundle: RonaContextBundle) -> DocumentParts:
    summary = _headline_metrics(bundle)
    if not summary:
        raise ReportDataUnavailableError("No data available for a management summary")

    tables = _drill_down_tables(bundle)
    for build_table in SUPPLEMENTARY_TABLE_BUILDERS:
        table = build_table(bundle)
        if table is not None:
            tables.append(table)

    return "Management Summary", summary, tables


__all__ = ["build_management_document"]
