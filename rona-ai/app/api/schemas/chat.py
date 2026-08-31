from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.api.schemas.common import PeriodRequestMixin
from app.core.enums import DataDomain, Language, UserRole
from app.schemas import KBCitation


class ChatRequest(PeriodRequestMixin):

    question: str = Field(
        ..., min_length=1, max_length=1000, description="Natural language question"
    )
    language: Language | None = Field(
        default=None,
        description="Answer language Defaults to DEFAULT_LANGUAGE when omitted.",
    )


class SupportingMetricOut(BaseModel):

    model_config = ConfigDict(extra="forbid")

    label: str
    value: str
    unit: str | None = None
    comparison: str | None = None


class ChatResponse(BaseModel):

    answer: str
    supporting_data: list[SupportingMetricOut] = Field(default_factory=list)
    recommendation: str | None = None
    source: list[str] = Field(
        default_factory=list,
        description='Module display names e.g. ["Attendance Module"].',
    )
    source_domains: list[DataDomain] = Field(
        default_factory=list,
        description="The same citations as stable machine tokens prefer these in code.",
    )
    data_available: bool
    tenant_id: str
    user_role: UserRole
    period_label: str

    generated_at: datetime

    kb_citations: list[KBCitation] = Field(
        default_factory=list,
        description="Approved knowledge-base references used by the answer.",
    )
    source_system: str = "mock"
    partial_data: bool = Field(
        default=False,
        description="True when a granted module failed to load or its rows were capped.",
    )


__all__ = ["ChatRequest", "ChatResponse", "SupportingMetricOut"]
