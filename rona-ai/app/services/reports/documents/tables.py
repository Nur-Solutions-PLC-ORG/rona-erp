from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.models import ReportTable


def procurement_table(bundle: RonaContextBundle) -> ReportTable | None:
    if bundle.procurement is None:
        return None
    return ReportTable(
        name="Procurement Orders",
        columns=[
            "PO", "Supplier", "Items", "Status", "Ordered",
            "Expected", "Days late", "Total", "Currency",
        ],
        rows=[
            [
                po.po_number, po.supplier, po.item_summary, po.status.value,
                po.order_date.isoformat(),
                po.expected_delivery_date.isoformat() if po.expected_delivery_date else "-",
                po.days_late, po.total_value, po.currency,
            ]
            for po in bundle.procurement.purchase_orders
        ],
    )


def sales_table(bundle: RonaContextBundle) -> ReportTable | None:
    if bundle.sales is None:
        return None
    return ReportTable(
        name="Sales Orders",
        columns=[
            "Order", "Customer", "Products", "Quantity", "Status",
            "Order date", "Promised delivery", "Days late", "Amount", "Currency",
        ],
        rows=[
            [
                order.order_id, order.customer, order.product_summary, order.quantity,
                order.status.value, order.order_date.isoformat(),
                order.promised_delivery_date.isoformat() if order.promised_delivery_date else "-",
                order.days_late, order.total_value, order.currency,
            ]
            for order in bundle.sales.orders
        ],
    )


def alerts_table(bundle: RonaContextBundle) -> ReportTable | None:
    if not bundle.alerts:
        return None
    return ReportTable(
        name="Alerts",
        columns=["Severity", "Module", "Title", "Message", "Detected"],
        rows=[
            [a.severity.value, a.domain.value, a.title, a.message, a.detected_at.isoformat()]
            for a in bundle.alerts
        ],
    )


def pending_tasks_table(bundle: RonaContextBundle) -> ReportTable | None:
    if not bundle.pending_tasks:
        return None
    return ReportTable(
        name="Pending Tasks",
        columns=["Module", "Task", "Due date", "Overdue?"],
        rows=[
            [
                t.domain.value, t.title,
                t.due_date.isoformat() if t.due_date else "-",
                "yes" if t.is_overdue else "no",
            ]
            for t in bundle.pending_tasks
        ],
    )


#: Optional cross-domain tables appended to the management summary, in order.
SUPPLEMENTARY_TABLE_BUILDERS = (
    procurement_table,
    sales_table,
    alerts_table,
    pending_tasks_table,
)

__all__ = [
    "SUPPLEMENTARY_TABLE_BUILDERS",
    "alerts_table",
    "pending_tasks_table",
    "procurement_table",
    "sales_table",
]
