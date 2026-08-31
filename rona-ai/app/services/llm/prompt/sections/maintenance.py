"""Maintenance prompt section."""

from __future__ import annotations

from app.core.enums import MachineStatus
from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS

_DUE_SOON_DAYS = 14


def maintenance_section(maint) -> list[str]:
    lines = [
        "\nMAINTENANCE",
        f"Machines: {maint.total_machines} | operational: {maint.operational_count} "
        f"| under maintenance: {maint.under_maintenance_count} | breakdown: {maint.breakdown_count} "
        f"| idle: {maint.idle_count}",
        f"Fleet availability: {maint.fleet_availability_pct}% | total failures: {maint.total_failures} "
        f"| downtime: {maint.total_downtime_hours}h",
    ]
    if maint.worst_offender_machine_id:
        lines.append(f"Worst offender (most failures): {maint.worst_offender_machine_id}")

    notable = [
        machine
        for machine in maint.machines
        if machine.status != MachineStatus.OPERATIONAL or machine.failure_count_period > 0
    ]
    notable.sort(key=lambda machine: (-machine.failure_count_period, machine.machine_id))
    if notable:
        lines.append("Machines needing attention:")
        for machine in notable[:MAX_PROMPT_ROWS]:
            lines.append(
                f"  - {machine.machine_name} ({machine.machine_id}, "
                f"{machine.criticality.value} criticality): "
                f"{machine.status.value}, {machine.failure_count_period} failure(s), "
                f"{machine.downtime_hours_period}h downtime, availability {machine.availability_pct}%"
            )

    due_soon = [u for u in maint.upcoming_maintenance if u.days_until_due <= _DUE_SOON_DAYS]
    due_soon.sort(key=lambda u: u.days_until_due)
    if due_soon:
        lines.append(f"Upcoming maintenance (next {_DUE_SOON_DAYS} days):")
        for upcoming in due_soon[:MAX_PROMPT_ROWS]:
            lines.append(
                f"  - {upcoming.machine_name}: {upcoming.maintenance_type} due "
                f"{upcoming.due_date.isoformat()} ({upcoming.days_until_due} day(s))"
            )
    return lines


__all__ = ["maintenance_section"]
