"""Summary endpoint response models."""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import DataDomain, Severity


class MetricItem(BaseModel):

    model_config = ConfigDict(extra="forbid")

    key: str = Field(description="Stable identifier, e.g. 'attendance_rate_pct'.")
    label: str = Field(description="Display label, e.g. 'Attendance rate'.")
    value: str = Field(description="Preformatted for display, units included.")
    numeric_value: float | None = Field(
        default=None, description="Same figure unformatted, for charting."
    )
    unit: str | None = None


class MetricGroup(BaseModel):

    model_config = ConfigDict(extra="forbid")

    domain: DataDomain
    label: str = Field(description='Module display name, e.g. "Production Module".')
    metrics: list[MetricItem] = Field(default_factory=list)


class AlertOut(BaseModel):

    model_config = ConfigDict(extra="forbid")

    alert_id: str
    domain: DataDomain
    severity: Severity
    title: str
    message: str
    metric_label: str
    metric_value: float
    threshold_value: float | None = None
    entity_ref: str | None = None
    detected_at: datetime


class PendingTaskOut(BaseModel):

    model_config = ConfigDict(extra="forbid")

    task_id: str
    domain: DataDomain
    title: str
    due_date: date | None = None
    is_overdue: bool = False
    assigned_to: str | None = None


class SummaryResponse(BaseModel):

    greeting: str
    tenant_id: str
    tenant_name: str | None = None
    period_label: str
    period_start: date
    period_end: date
    metrics: list[MetricGroup] = Field(default_factory=list)
    alerts: list[AlertOut] = Field(default_factory=list)
    pending_tasks: list[PendingTaskOut] = Field(default_factory=list)
    granted_domains: list[DataDomain] = Field(default_factory=list)
    denied_domains: list[DataDomain] = Field(default_factory=list)
    unavailable_domains: list[DataDomain] = Field(
        default_factory=list,
        description="Granted but failed to load",
    )
    generated_at: datetime
    source_system: str = "mock"


__all__ = [
    "AlertOut",
    "MetricGroup",
    "MetricItem",
    "PendingTaskOut",
    "SummaryResponse",
]
