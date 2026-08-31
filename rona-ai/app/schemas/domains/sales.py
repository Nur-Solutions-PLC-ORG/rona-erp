"""Sales snapshot."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from app.core.enums import SalesOrderStatus
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
)
from app.schemas.shared import TrendComparison


class SalesOrderRecord(CanonicalModel):
    order_id: str
    customer: str
    product_summary: str
    quantity: NonNegFloat
    total_value: NonNegFloat
    currency: str = "ETB"
    order_date: date
    promised_delivery_date: date | None = None
    days_late: int = 0
    status: SalesOrderStatus


class ProductSalesRollup(CanonicalModel):
    product: str
    units_sold: NonNegFloat
    revenue: NonNegFloat


class SalesContext(CanonicalContext):
    currency: str = "ETB"
    total_order_count: NonNegInt = 0
    total_revenue: NonNegFloat = 0.0
    fulfilled_count: NonNegInt = 0
    pending_count: NonNegInt = 0
    overdue_count: NonNegInt = 0
    orders: list[SalesOrderRecord] = Field(default_factory=list)
    top_products: list[ProductSalesRollup] = Field(default_factory=list)
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["SalesOrderRecord", "ProductSalesRollup", "SalesContext"]
