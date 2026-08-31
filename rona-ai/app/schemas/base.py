from __future__ import annotations

from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import DataDomain

Percent = Annotated[float, Field(description="Percentage value.")]
NonNegFloat = Annotated[float, Field(ge=0)]
NonNegInt = Annotated[int, Field(ge=0)]


class CanonicalModel(BaseModel):

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CanonicalContext(CanonicalModel):

    tenant_id: str = Field(description="Company ID.")
    domain: DataDomain = Field(description="ERP module.")
    period_label: str = Field(description="Reporting period.")
    period_start: date
    period_end: date
    generated_at: datetime = Field(description="Snapshot time.")
    source_system: str = Field(
        default="mock",
        description="Data source name.",
    )
    record_count_truncated: bool = Field(
        default=False,
        description=(
            "True when the row list reached its limit."
        ),
    )


__all__ = [
    "Percent",
    "NonNegFloat",
    "NonNegInt",
    "CanonicalModel",
    "CanonicalContext",
]
