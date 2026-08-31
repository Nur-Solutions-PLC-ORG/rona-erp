"""HR & attendance prompt section."""

from __future__ import annotations

from app.core.enums import AttendanceStatus
from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS


def hr_section(hr) -> list[str]:
    lines = [
        "\nHR & ATTENDANCE",
        f"Headcount: {hr.total_headcount} | present: {hr.present_count} "
        f"| late: {hr.late_count} | absent: {hr.absent_count} "
        f"| on leave: {hr.on_leave_count} | not recorded: {hr.not_recorded_count}",
        f"Attendance rate: {hr.attendance_rate_pct}% | absenteeism: {hr.absenteeism_rate_pct}%",
        f"Overtime: {hr.total_overtime_hours}h across {hr.employees_on_overtime} employee(s)",
    ]
    if hr.by_department:
        lines.append(
            "By department: "
            + "; ".join(
                f"{r.group_name} (present {r.present}/{r.headcount}, absent {r.absent})"
                for r in hr.by_department
            )
        )

    notable = [r for r in hr.records if r.status != AttendanceStatus.PRESENT]
    if notable:
        lines.append("Employees needing attention:")
        for record in notable[:MAX_PROMPT_ROWS]:
            detail = record.status.value
            if record.status == AttendanceStatus.LATE:
                detail += f" by {record.late_minutes} min"
            elif record.absence_reason:
                detail += f" ({record.absence_reason})"
            line = f"  - {record.full_name} [{record.department}"
            line += f"/{record.production_line}]" if record.production_line else "]"
            lines.append(f"{line}: {detail}")
    return lines


__all__ = ["hr_section"]
