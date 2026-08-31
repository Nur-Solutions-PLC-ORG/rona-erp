"""Health endpoint response model."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):

    status: Literal["ok", "degraded"] = "ok"
    version: str
    adapter_backend: str
    environment: str

    llm_configured: bool
    data_source_reachable: bool = True


__all__ = ["HealthResponse"]
