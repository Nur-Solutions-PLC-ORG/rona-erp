from __future__ import annotations

from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS


def production_section(prod) -> list[str]:
    lines = [
        "\nPRODUCTION",
        f"Target: {prod.total_target_units} units | produced: {prod.total_produced_units} "
        f"| rejected: {prod.total_rejected_units}",
        f"Overall efficiency: {prod.overall_efficiency_pct}% (status: {prod.overall_status.value}) "
        f"| reject rate: {prod.reject_rate_pct}% | downtime: {prod.total_downtime_minutes} min",
    ]
    if prod.by_shift:
        lines.append(
            "By shift: "
            + "; ".join(
                f"{s.shift.value} {s.produced_units}/{s.target_units} ({s.efficiency_pct}%)"
                for s in prod.by_shift
            )
        )
    if prod.lines:
        lines.append("Lines:")
        for line in prod.lines[:MAX_PROMPT_ROWS]:
            note = f", blocked by {line.blocking_machine_id}" if line.blocking_machine_id else ""
            lines.append(
                f"  - {line.line_name} ({line.shift.value}, {line.product}): "
                f"{line.produced_units}/{line.target_units} units, {line.efficiency_pct}% "
                f"[{line.status.value}], downtime {line.downtime_minutes} min{note}"
            )
    return lines


__all__ = ["production_section"]
