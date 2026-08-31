from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def build_maintenance_document(bundle: RonaContextBundle) -> DocumentParts:
    maint = bundle.maintenance
    if maint is None:
        raise ReportDataUnavailableError("Maintenance data is not available for this report")

    summary = [
        ("Total machines", str(maint.total_machines)),
        ("Operational", str(maint.operational_count)),
        ("Under maintenance", str(maint.under_maintenance_count)),
        ("Breakdown", str(maint.breakdown_count)),
        ("Idle", str(maint.idle_count)),
        ("Fleet availability", f"{maint.fleet_availability_pct}%"),
        ("Total failures", str(maint.total_failures)),
        ("Total downtime", f"{maint.total_downtime_hours} h"),
        ("Worst offender", maint.worst_offender_machine_id or "-"),
    ]

    machines = ReportTable(
        name="Machines",
        columns=[
            "ID", "Name", "Line", "Status", "Criticality", "Last service",
            "Next due", "Downtime (h)", "Failures", "MTBF (h)", "Availability %",
        ],
        rows=[
            [
                m.machine_id, m.machine_name, m.production_line or "-", m.status.value,
                m.criticality.value,
                m.last_service_date.isoformat() if m.last_service_date else "-",
                m.next_service_due.isoformat() if m.next_service_due else "-",
                m.downtime_hours_period, m.failure_count_period,
                m.mtbf_hours if m.mtbf_hours is not None else "-", m.availability_pct,
            ]
            for m in maint.machines
        ],
    )
    upcoming = ReportTable(
        name="Upcoming Maintenance",
        columns=["Machine", "Type", "Due date", "Days until due", "Assigned to", "Est. hours"],
        rows=[
            [
                u.machine_name, u.maintenance_type, u.due_date.isoformat(),
                u.days_until_due, u.assigned_to or "-", u.estimated_hours,
            ]
            for u in maint.upcoming_maintenance
        ],
    )
    return "Maintenance Report", summary, [machines, upcoming]


__all__ = ["build_maintenance_document"]
