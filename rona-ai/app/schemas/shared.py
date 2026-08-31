"""Cross-domain value objects: trends, tasks and alerts."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import Field

from app.core.enums import DataDomain, Severity, TrendDirection
from app.schemas.base import CanonicalModel, Percent


class TrendComparison(CanonicalModel):

    metric_label: str
    current_value: float
    previous_value: float
    change_pct: Percent
    direction: TrendDirection
    previous_period_label: str


class PendingTask(CanonicalModel):

    task_id: str
    domain: DataDomain
    title: str
    due_date: date | None = None
    is_overdue: bool = False
    assigned_to: str | None = None


class SmartAlert(CanonicalModel):

    alert_id: str
    domain: DataDomain
    severity: Severity
    title: str
    message: str
    metric_label: str
    metric_value: float
    threshold_value: float | None = None
    entity_ref: str | None = Field(
        default=None,
        description="ID of the item/machine/employee/invoice that tripped the rule.",
    )
    detected_at: datetime


__all__ = ["TrendComparison", "PendingTask", "SmartAlert"]
