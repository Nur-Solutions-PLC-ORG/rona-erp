from __future__ import annotations

from app.core.enums import domain_label
from app.schemas import RonaContextBundle
from app.services.llm.prompt.formatting import MAX_PROMPT_ROWS


def alert_lines(bundle: RonaContextBundle) -> list[str]:
    if not bundle.alerts:
        return []

    lines = [
        f"\nALERTS FOR REPORTING PERIOD {bundle.period.label} "
        "(cite the module in parentheses as a source)"
    ]
    for alert in bundle.alerts[:MAX_PROMPT_ROWS]:
        entity = f" ({alert.entity_ref})" if alert.entity_ref else ""
        lines.append(
            f"- [{alert.severity.value}] {alert.title} ({domain_label(alert.domain)})"
            f"{entity}: {alert.message}"
        )
        if alert.metric_value is not None:
            threshold = (
                f" (threshold {alert.threshold_value:g})"
                if alert.threshold_value is not None
                else ""
            )
            lines.append(
                f"    metric={alert.metric_label}={alert.metric_value:g}{threshold}"
            )
    return lines


__all__ = ["alert_lines"]
