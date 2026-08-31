"""Inventory snapshot."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from app.core.enums import StockStatus
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
)
from app.schemas.shared import TrendComparison


class InventoryItemRecord(CanonicalModel):
    item_id: str
    sku: str
    name: str
    category: str
    unit_of_measure: str
    quantity_on_hand: float
    reorder_level: float
    quantity_on_order: float = 0.0
    unit_cost: NonNegFloat
    total_value: NonNegFloat
    monthly_consumption: NonNegFloat = 0.0
    days_of_cover: float | None = Field(
        default=None,
        description="Days until stock runs out.",
    )
    last_movement_date: date | None = None
    warehouse_location: str | None = None
    stock_status: StockStatus
    needs_reorder: bool = False


class InventoryContext(CanonicalContext):
    currency: str = "ETB"
    total_sku_count: NonNegInt
    total_inventory_value: NonNegFloat
    low_stock_count: NonNegInt = 0
    out_of_stock_count: NonNegInt = 0
    overstocked_count: NonNegInt = 0
    slow_moving_count: NonNegInt = 0
    slow_moving_value: NonNegFloat = 0.0

    items: list[InventoryItemRecord] = Field(default_factory=list)
    reorder_recommendations: list[str] = Field(
        default_factory=list, description="Item IDs at or below reorder level."
    )
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["InventoryItemRecord", "InventoryContext"]
