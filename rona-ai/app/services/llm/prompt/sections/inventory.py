"""Inventory prompt section."""

from __future__ import annotations

from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS

_ATTENTION_STATUSES = ("low", "out_of_stock", "overstocked")
_NO_COVER_SORT_KEY = 1e9


def inventory_section(inv) -> list[str]:
    lines = [
        "\nINVENTORY",
        f"SKUs: {inv.total_sku_count} | total value: {inv.currency} {inv.total_inventory_value:,.2f}",
        f"Low: {inv.low_stock_count} | out of stock: {inv.out_of_stock_count} "
        f"| overstocked: {inv.overstocked_count} | slow-moving: {inv.slow_moving_count}",
    ]

    notable = [
        item
        for item in inv.items
        if item.needs_reorder or item.stock_status.value in _ATTENTION_STATUSES
    ]
    # Items closest to running out come first; unknown cover sorts last.
    notable.sort(
        key=lambda item: item.days_of_cover if item.days_of_cover is not None else _NO_COVER_SORT_KEY
    )
    if notable:
        lines.append("Items needing attention:")
        for item in notable[:MAX_PROMPT_ROWS]:
            cover = f", {item.days_of_cover}d cover" if item.days_of_cover is not None else ""
            lines.append(
                f"  - {item.name} ({item.sku}): {item.quantity_on_hand} {item.unit_of_measure} on hand, "
                f"reorder at {item.reorder_level} [{item.stock_status.value}]{cover}"
            )
    return lines


__all__ = ["inventory_section"]
