"""Reporting period window, with the comparison window used for trends."""

from __future__ import annotations

from datetime import date

from pydantic import Field, model_validator

from app.schemas.base import CanonicalModel


class PeriodSpec(CanonicalModel):

    start: date
    end: date
    label: str = Field(description="Period label.")
    previous_start: date | None = None
    previous_end: date | None = None
    previous_label: str | None = None

    @model_validator(mode="after")
    def _check_ordering(self) -> "PeriodSpec":
        if self.end < self.start:
            raise ValueError(
                f"period end {self.end.isoformat()} is before start {self.start.isoformat()}"
            )
        if self.previous_start is not None and self.previous_end is not None:
            if self.previous_end < self.previous_start:
                raise ValueError(
                    f"comparison period end {self.previous_end.isoformat()} is before "
                    f"start {self.previous_start.isoformat()}"
                )
        elif self.previous_start is not None or self.previous_end is not None:
            raise ValueError(
                "previous_start and previous_end must be set together a half specified "
                "comparison window would make has_comparison lie."
            )
        return self

    @property
    def day_count(self) -> int:
        return (self.end - self.start).days + 1

    @property
    def has_comparison(self) -> bool:
        return self.previous_start is not None and self.previous_end is not None

    @classmethod
    def for_day(cls, day: date) -> "PeriodSpec":
        previous = date.fromordinal(day.toordinal() - 1)
        return cls(
            start=day,
            end=day,
            label=day.strftime("%d %b %Y"),
            previous_start=previous,
            previous_end=previous,
            previous_label="yesterday",
        )

    @classmethod
    def for_week_ending(cls, day: date) -> "PeriodSpec":
        start = date.fromordinal(day.toordinal() - 6)
        return cls(
            start=start,
            end=day,
            label=f"{start.strftime('%d %b')} – {day.strftime('%d %b %Y')}",
            previous_start=date.fromordinal(start.toordinal() - 7),
            previous_end=date.fromordinal(start.toordinal() - 1),
            previous_label="previous week",
        )

    @classmethod
    def for_month(cls, day: date) -> "PeriodSpec":
        start = day.replace(day=1)
        end = (start.replace(year=start.year + 1, month=1) if start.month == 12
               else start.replace(month=start.month + 1))
        end = date.fromordinal(end.toordinal() - 1)
        prev_end = date.fromordinal(start.toordinal() - 1)
        return cls(
            start=start,
            end=end,
            label=start.strftime("%B %Y"),
            previous_start=prev_end.replace(day=1),
            previous_end=prev_end,
            previous_label=prev_end.strftime("%B %Y"),
        )


__all__ = ["PeriodSpec"]
