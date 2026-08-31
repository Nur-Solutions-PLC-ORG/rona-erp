"""Procurement snapshot."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from app.core.enums import PurchaseOrderStatus
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
)
from app.schemas.shared import TrendComparison


class PurchaseOrderRecord(CanonicalModel):
    po_number: str
    supplier: str
    item_summary: str
    total_value: NonNegFloat
    currency: str = "ETB"
    order_date: date
    expected_delivery_date: date | None = None
    days_late: int = 0
    status: PurchaseOrderStatus


class ProcurementContext(CanonicalContext):
    currency: str = "ETB"
    open_po_count: NonNegInt = 0
    total_open_value: NonNegFloat = 0.0
    overdue_delivery_count: NonNegInt = 0
    purchase_orders: list[PurchaseOrderRecord] = Field(default_factory=list)
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["PurchaseOrderRecord", "ProcurementContext"]
