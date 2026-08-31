"""Maintenance snapshot."""

from __future__ import annotations

from datetime import date

from pydantic import Field

from app.core.enums import Criticality, MachineStatus
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
    Percent,
)
from app.schemas.shared import TrendComparison


class MachineRecord(CanonicalModel):
    machine_id: str
    machine_name: str
    production_line: str | None = None
    status: MachineStatus
    criticality: Criticality = Criticality.MEDIUM
    last_service_date: date | None = None
    next_service_due: date | None = None
    downtime_hours_period: NonNegFloat = 0.0
    failure_count_period: NonNegInt = 0
    mtbf_hours: float | None = Field(default=None, description="Mean time between failures.")
    availability_pct: Percent = 100.0


class UpcomingMaintenanceRecord(CanonicalModel):
    machine_id: str
    machine_name: str
    maintenance_type: str = Field(description="e.g. 'preventive', 'calibration', 'inspection'.")
    due_date: date
    days_until_due: int = Field(description="Negative when already overdue.")
    assigned_to: str | None = None
    estimated_hours: NonNegFloat = 0.0


class MaintenanceContext(CanonicalContext):
    total_machines: NonNegInt
    operational_count: NonNegInt = 0
    under_maintenance_count: NonNegInt = 0
    breakdown_count: NonNegInt = 0
    idle_count: NonNegInt = 0
    total_downtime_hours: NonNegFloat = 0.0
    total_failures: NonNegInt = 0
    fleet_availability_pct: Percent = 100.0

    machines: list[MachineRecord] = Field(default_factory=list)
    upcoming_maintenance: list[UpcomingMaintenanceRecord] = Field(default_factory=list)
    worst_offender_machine_id: str | None = Field(
        default=None, description="Most failures this period 'which machine failed the most?'."
    )
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["MachineRecord", "UpcomingMaintenanceRecord", "MaintenanceContext"]
