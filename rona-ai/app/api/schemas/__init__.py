"""API request/response schemas, grouped per endpoint family."""

from __future__ import annotations

from app.api.schemas.chat import ChatRequest, ChatResponse, SupportingMetricOut
from app.api.schemas.common import (
    ERROR_RESPONSES,
    ErrorResponse,
    MAX_PERIOD_DAYS,
    PeriodRequestMixin,
)
from app.api.schemas.health import HealthResponse
from app.api.schemas.reports import ReportRequest, ReportResponse
from app.api.schemas.summary import (
    AlertOut,
    MetricGroup,
    MetricItem,
    PendingTaskOut,
    SummaryResponse,
)

__all__ = [
    "ERROR_RESPONSES",
    "AlertOut",
    "ChatRequest",
    "ChatResponse",
    "ErrorResponse",
    "HealthResponse",
    "MAX_PERIOD_DAYS",
    "MetricGroup",
    "MetricItem",
    "PendingTaskOut",
    "PeriodRequestMixin",
    "ReportRequest",
    "ReportResponse",
    "SupportingMetricOut",
    "SummaryResponse",
]
