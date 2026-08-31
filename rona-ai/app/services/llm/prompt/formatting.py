from __future__ import annotations

MAX_PROMPT_ROWS = 20
def trends_lines(payload, domain_name: str) -> list[str]:
    if not payload.trends:
        return []
    lines = [f"\n{domain_name} trends (current vs {payload.trends[0].previous_period_label}):"]
    for trend in payload.trends[:MAX_PROMPT_ROWS]:
        arrow = "+" if trend.change_pct >= 0 else ""
        lines.append(
            f"  - {trend.metric_label}: {trend.current_value:g} vs {trend.previous_value:g} "
            f"({arrow}{trend.change_pct:g}%, {trend.direction.value})"
        )
    return lines
__all__ = ["MAX_PROMPT_ROWS", "trends_lines"]
