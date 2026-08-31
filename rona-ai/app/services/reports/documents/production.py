from __future__ import annotations

from app.schemas import RonaContextBundle
from app.services.reports.errors import ReportDataUnavailableError
from app.services.reports.models import DocumentParts, ReportTable


def build_production_document(bundle: RonaContextBundle) -> DocumentParts:
    prod = bundle.production
    if prod is None:
        raise ReportDataUnavailableError("Production data is not available for this report")

    summary = [
        ("Target units", str(prod.total_target_units)),
        ("Produced units", str(prod.total_produced_units)),
        ("Rejected units", str(prod.total_rejected_units)),
        ("Overall efficiency", f"{prod.overall_efficiency_pct}%"),
        ("Reject rate", f"{prod.reject_rate_pct}%"),
        ("Downtime", f"{prod.total_downtime_minutes} min"),
        ("Status", prod.overall_status.value),
    ]

    lines = ReportTable(
        name="Production Lines",
        columns=[
            "Line", "Shift", "Product", "Target", "Produced", "Rejected",
            "Efficiency %", "Downtime (min)", "Status", "Blocking machine",
        ],
        rows=[
            [
                line.line_name, line.shift.value, line.product, line.target_units,
                line.produced_units, line.rejected_units, line.efficiency_pct,
                line.downtime_minutes, line.status.value, line.blocking_machine_id or "-",
            ]
            for line in prod.lines
        ],
    )
    by_shift = ReportTable(
        name="By Shift",
        columns=["Shift", "Target", "Produced", "Efficiency %"],
        rows=[
            [s.shift.value, s.target_units, s.produced_units, s.efficiency_pct]
            for s in prod.by_shift
        ],
    )
    return "Production Report", summary, [lines, by_shift]


__all__ = ["build_production_document"]
