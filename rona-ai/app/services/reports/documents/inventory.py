from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def build_inventory_document(bundle: RonaContextBundle) -> DocumentParts:
    inv = bundle.inventory
    if inv is None:
        raise ReportDataUnavailableError("Inventory data is not available for this report")

    cur = inv.currency
    summary = [
        ("Total SKUs", str(inv.total_sku_count)),
        ("Total inventory value", f"{cur} {inv.total_inventory_value:,.2f}"),
        ("Low stock", str(inv.low_stock_count)),
        ("Out of stock", str(inv.out_of_stock_count)),
        ("Overstocked", str(inv.overstocked_count)),
        ("Slow-moving", str(inv.slow_moving_count)),
        ("Slow-moving value", f"{cur} {inv.slow_moving_value:,.2f}"),
    ]

    items = ReportTable(
        name="Inventory Valuation",
        columns=[
            "SKU", "Name", "Category", "On hand", "UoM", "Reorder", "On order",
            "Unit cost", "Total value", "Days cover", "Status", "Reorder?",
        ],
        rows=[
            [
                i.sku, i.name, i.category, i.quantity_on_hand, i.unit_of_measure,
                i.reorder_level, i.quantity_on_order, i.unit_cost, i.total_value,
                i.days_of_cover if i.days_of_cover is not None else "-",
                i.stock_status.value, "yes" if i.needs_reorder else "no",
            ]
            for i in inv.items
        ],
    )
    return "Inventory Valuation Report", summary, [items]


__all__ = ["build_inventory_document"]
