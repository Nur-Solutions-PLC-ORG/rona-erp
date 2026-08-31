from __future__ import annotations

from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS

_ACTIVE_STATUSES = ("approved", "ordered")


def procurement_section(proc) -> list[str]:
    lines = [
        "\nPROCUREMENT",
        f"Open POs: {proc.open_po_count} | open value: {proc.currency} {proc.total_open_value:,.2f} "
        f"| overdue deliveries: {proc.overdue_delivery_count}",
    ]

    notable = [
        po
        for po in proc.purchase_orders
        if po.days_late > 0 or po.status.value in _ACTIVE_STATUSES
    ]
    notable.sort(key=lambda po: -po.days_late)
    if notable:
        lines.append("Purchase orders needing attention:")
        for po in notable[:MAX_PROMPT_ROWS]:
            late = f", {po.days_late} day(s) late" if po.days_late > 0 else ""
            lines.append(
                f"  - {po.po_number} ({po.supplier}, {po.item_summary}): "
                f"{po.currency} {po.total_value:,.2f} [{po.status.value}]{late}"
            )
    return lines


__all__ = ["procurement_section"]
