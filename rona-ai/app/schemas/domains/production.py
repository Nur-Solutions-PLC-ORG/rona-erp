"""Production snapshot."""

from __future__ import annotations

from pydantic import Field

from app.core.enums import ProductionStatus, Shift
from app.schemas.base import CanonicalContext, CanonicalModel, NonNegInt, Percent
from app.schemas.shared import TrendComparison


class ProductionLineRecord(CanonicalModel):
    line_id: str
    line_name: str
    product: str
    shift: Shift
    target_units: NonNegInt
    produced_units: NonNegInt
    rejected_units: NonNegInt = 0
    efficiency_pct: Percent
    downtime_minutes: NonNegInt = 0
    operators_assigned: NonNegInt = 0
    status: ProductionStatus

    blocking_machine_id: str | None = None


class ShiftProductionRollup(CanonicalModel):
    shift: Shift
    target_units: NonNegInt
    produced_units: NonNegInt
    efficiency_pct: Percent


class ProductionContext(CanonicalContext):
    total_target_units: NonNegInt
    total_produced_units: NonNegInt
    total_rejected_units: NonNegInt = 0
    overall_efficiency_pct: Percent
    target_achievement_pct: Percent
    reject_rate_pct: Percent = 0.0
    total_downtime_minutes: NonNegInt = 0
    overall_status: ProductionStatus

    lines: list[ProductionLineRecord] = Field(default_factory=list)
    by_shift: list[ShiftProductionRollup] = Field(default_factory=list)
    underperforming_line_ids: list[str] = Field(default_factory=list)
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["ProductionLineRecord", "ShiftProductionRollup", "ProductionContext"]
