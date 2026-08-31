from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import DataDomain


class SupportingMetric(BaseModel):

    model_config = ConfigDict(extra="forbid")

    label: str = Field(description="Metric name.")
    value: str = Field(description="Formatted metric value.")
    unit: str | None = Field(default=None, description="Metric unit.")
    comparison: str | None = Field(
        default=None,
        description="Change from the earlier period.",
    )


class KBCitation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    document_id: str
    title: str
    version: int
    chunk_id: str
    section: str
    domain: DataDomain


class RonaAIResponse(BaseModel):

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(description="Direct answer in the user's language.")
    supporting_data: list[SupportingMetric] = Field(
        default_factory=list,
        description="Figures that support the answer.",
    )
    recommendation: str | None = Field(
        default=None,
        description="One useful next step, when needed.",
    )
    kb_citations: list[KBCitation] = Field(
        default_factory=list,
        description="Knowledge base sources used in the answer.",
    )
    source: list[DataDomain] = Field(
        default_factory=list,
        description="ERP modules used for the answer.",
    )
    data_available: bool = Field(
        default=True,
        description="True when the context has the requested data.",
    )


__all__ = ["SupportingMetric", "KBCitation", "RonaAIResponse"]
