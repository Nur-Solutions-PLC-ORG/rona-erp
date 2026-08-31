from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone

from app.schemas import PeriodSpec

_COMPARISON_PHRASES = ("compared to", "compare", "versus", "vs", "against")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def custom_period(period_start: date, period_end: date) -> PeriodSpec:
    if period_start == period_end:
        label = period_start.strftime("%d %b %Y")
    else:
        label = (
            f"{period_start.strftime('%d %b %Y')} – "
            f"{period_end.strftime('%d %b %Y')}"
        )
    return PeriodSpec(start=period_start, end=period_end, label=label)


def period_from_question(question: str, today: date) -> PeriodSpec | None:
    normalized = re.sub(r"[^a-z0-9]+", " ", question.lower()).strip()
    words = set(normalized.split())
    asks_comparison = any(phrase in normalized for phrase in _COMPARISON_PHRASES)

    if "today" in words and "yesterday" in words and asks_comparison:
        return PeriodSpec.for_day(today)
    if "yesterday" in words:
        return PeriodSpec.for_day(today - timedelta(days=1))
    if "today" in words:
        return PeriodSpec.for_day(today)
    if "last week" in normalized or "previous week" in normalized:
        return PeriodSpec.for_week_ending(today - timedelta(days=7))
    if "this week" in normalized or "weekly report" in normalized or "weekly" in words:
        return PeriodSpec.for_week_ending(today)
    return None


def resolve_period(
    period_start: date | None,
    period_end: date | None,
    *,
    default_month: bool,
    question: str | None = None,
) -> PeriodSpec:
    
    if period_start is not None and period_end is not None:
        return custom_period(period_start, period_end)

    today = utcnow().date()
    if question and not default_month:
        inferred = period_from_question(question, today)
        if inferred is not None:
            return inferred
    return PeriodSpec.for_month(today) if default_month else PeriodSpec.for_day(today)


__all__ = [
    "custom_period",
    "period_from_question",
    "resolve_period",
    "utcnow",
]
