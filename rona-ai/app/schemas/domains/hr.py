"""HR / attendance snapshot."""

from __future__ import annotations

from pydantic import Field

from app.core.enums import AttendanceStatus, Shift
from app.schemas.base import (
    CanonicalContext,
    CanonicalModel,
    NonNegFloat,
    NonNegInt,
    Percent,
)
from app.schemas.shared import TrendComparison


class EmployeeAttendanceRecord(CanonicalModel):

    employee_id: str
    full_name: str
    department: str
    position: str
    production_line: str | None = None
    shift: Shift
    status: AttendanceStatus
    check_in_time: str | None = Field(default=None, description="Local HH:MM, null if absent.")
    check_out_time: str | None = None
    late_minutes: NonNegInt = 0
    overtime_hours: NonNegFloat = 0.0
    absence_reason: str | None = None


class AttendanceRollup(CanonicalModel):

    group_name: str
    headcount: NonNegInt
    present: NonNegInt
    absent: NonNegInt
    late: NonNegInt
    on_leave: NonNegInt
    absenteeism_rate_pct: Percent
    total_overtime_hours: NonNegFloat


class HRContext(CanonicalContext):

    total_headcount: NonNegInt
    present_count: NonNegInt
    absent_count: NonNegInt
    late_count: NonNegInt
    on_leave_count: NonNegInt
    not_recorded_count: NonNegInt = Field(
        default=0, description="Employees with no attendance entry the 'missing attendance' alert."
    )
    attendance_rate_pct: Percent
    absenteeism_rate_pct: Percent
    total_overtime_hours: NonNegFloat
    employees_on_overtime: NonNegInt

    records: list[EmployeeAttendanceRecord] = Field(default_factory=list)
    by_department: list[AttendanceRollup] = Field(default_factory=list)
    by_production_line: list[AttendanceRollup] = Field(default_factory=list)
    trends: list[TrendComparison] = Field(default_factory=list)


__all__ = ["EmployeeAttendanceRecord", "AttendanceRollup", "HRContext"]
