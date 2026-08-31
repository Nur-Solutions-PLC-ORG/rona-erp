from __future__ import annotations
from app.schemas import RonaContextBundle
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def build_attendance_document(bundle: RonaContextBundle) -> DocumentParts:
    hr = bundle.hr
    if hr is None:
        raise ReportDataUnavailableError("Attendance data is not available for this report")

    summary = [
        ("Total headcount", str(hr.total_headcount)),
        ("Present", str(hr.present_count)),
        ("Late", str(hr.late_count)),
        ("Absent", str(hr.absent_count)),
        ("On leave", str(hr.on_leave_count)),
        ("Not recorded", str(hr.not_recorded_count)),
        ("Attendance rate", f"{hr.attendance_rate_pct}%"),
        ("Absenteeism rate", f"{hr.absenteeism_rate_pct}%"),
        ("Total overtime", f"{hr.total_overtime_hours} h"),
    ]

    by_employee = ReportTable(
        name="Attendance by Employee",
        columns=[
            "Employee", "Department", "Line", "Shift", "Status",
            "Late (min)", "Overtime (h)", "Reason",
        ],
        rows=[
            [
                r.full_name, r.department, r.production_line or "-", r.shift.value,
                r.status.value, r.late_minutes, r.overtime_hours, r.absence_reason or "-",
            ]
            for r in hr.records
        ],
    )
    by_dept = ReportTable(
        name="By Department",
        columns=[
            "Department", "Headcount", "Present", "Late", "Absent",
            "On leave", "Absenteeism %", "Overtime (h)",
        ],
        rows=[
            [
                r.group_name, r.headcount, r.present, r.late, r.absent, r.on_leave,
                r.absenteeism_rate_pct, r.total_overtime_hours,
            ]
            for r in hr.by_department
        ],
    )
    return "Attendance Report", summary, [by_employee, by_dept]


__all__ = ["build_attendance_document"]
