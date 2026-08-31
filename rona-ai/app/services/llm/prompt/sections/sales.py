"""Sales prompt section."""

from __future__ import annotations

from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS

_TOP_PRODUCT_LIMIT = 5


def sales_section(sales) -> list[str]:
    lines = [
        "\nSALES",
        f"Orders: {sales.total_order_count} | revenue: {sales.currency} {sales.total_revenue:,.2f} "
        f"| fulfilled: {sales.fulfilled_count} | pending: {sales.pending_count} "
        f"| overdue: {sales.overdue_count}",
    ]
    if sales.top_products:
        lines.append(
            "Top products: "
            + "; ".join(
                f"{tp.product} ({tp.units_sold} units, {sales.currency} {tp.revenue:,.2f})"
                for tp in sales.top_products[:_TOP_PRODUCT_LIMIT]
            )
        )

    overdue = [order for order in sales.orders if order.days_late > 0]
    overdue.sort(key=lambda order: -order.days_late)
    if overdue:
        lines.append("Overdue orders:")
        for order in overdue[:MAX_PROMPT_ROWS]:
            lines.append(
                f"  - {order.order_id} ({order.customer}, {order.product_summary}): "
                f"{order.currency} {order.total_value:,.2f} [{order.status.value}], "
                f"{order.days_late} day(s) late"
            )
    return lines


__all__ = ["sales_section"]
