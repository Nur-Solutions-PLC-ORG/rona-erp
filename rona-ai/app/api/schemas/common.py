"""Shared request/response models and error documentation."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator

MAX_PERIOD_DAYS = 366


class ErrorResponse(BaseModel):

    error: str = Field(description="Stable, machine-readable code, e.g. 'forbidden'.")
    detail: str | None = Field(default=None, description="Human-readable explanation.")
    request_id: str | None = None


ERROR_RESPONSES: dict[int | str, dict[str, object]] = {
    400: {"model": ErrorResponse, "description": "Invalid request"},
    401: {"model": ErrorResponse, "description": "Missing or invalid credentials"},
    403: {"model": ErrorResponse, "description": "Role is not permitted this data"},
    404: {"model": ErrorResponse, "description": "Unknown tenant"},
    429: {"model": ErrorResponse, "description": "AI provider request quota exhausted"},
    503: {"model": ErrorResponse, "description": "Upstream data source or model unavailable"},
}


class PeriodRequestMixin(BaseModel):

    period_start: date | None = Field(
        default=None, description="Optional custom period start (inclusive)"
    )
    period_end: date | None = Field(
        default=None, description="Optional custom period end (inclusive)"
    )

    @model_validator(mode="after")
    def _validate_period(self) -> PeriodRequestMixin:
        if (self.period_start is None) != (self.period_end is None):
            raise ValueError("period_start and period_end must be provided together")
        if self.period_start is not None and self.period_end is not None:
            if self.period_end < self.period_start:
                raise ValueError("period_end must not be before period_start")
            span_days = (self.period_end - self.period_start).days + 1
            if span_days > MAX_PERIOD_DAYS:
                raise ValueError(
                    f"period spans {span_days} days; the maximum is {MAX_PERIOD_DAYS}"
                )
        return self


__all__ = [
    "ERROR_RESPONSES",
    "ErrorResponse",
    "MAX_PERIOD_DAYS",
    "PeriodRequestMixin",
]
