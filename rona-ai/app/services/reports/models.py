from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from app.core.enums import ExportFormat, ReportType

EXTENSIONS: dict[ExportFormat, str] = {
    ExportFormat.PDF: "pdf",
    ExportFormat.EXCEL: "xlsx",
    ExportFormat.JSON: "json",
}


@dataclass(frozen=True)
class ReportTable:
    name: str
    columns: list[str]
    rows: list[list[object]]


@dataclass(frozen=True)
class ReportDocument:
    title: str
    tenant_label: str
    period_label: str
    generated_at: datetime
    source_system: str
    summary: list[tuple[str, str]] = field(default_factory=list)
    tables: list[ReportTable] = field(default_factory=list)


@dataclass(frozen=True)
class ReportResult:
    report_id: str
    tenant_id: str
    report_type: ReportType
    export_format: ExportFormat
    filename: str
    path: Path
    byte_size: int
    generated_at: datetime


#: Builders return the report title, summary rows and detail tables.
DocumentParts = tuple[str, list[tuple[str, str]], list[ReportTable]]

__all__ = [
    "EXTENSIONS",
    "DocumentParts",
    "ReportDocument",
    "ReportResult",
    "ReportTable",
]
