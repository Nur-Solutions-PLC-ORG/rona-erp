"""JSON report renderer."""

from __future__ import annotations

import json

from app.services.reports.models import ReportDocument


def render_json(document: ReportDocument) -> bytes:
    payload = {
        "title": document.title,
        "tenant": document.tenant_label,
        "period": document.period_label,
        "generated_at": document.generated_at.isoformat(),
        "source_system": document.source_system,
        "summary": [{"label": label, "value": value} for label, value in document.summary],
        "tables": [
            {"name": t.name, "columns": t.columns, "rows": t.rows}
            for t in document.tables
        ],
    }
    return json.dumps(payload, indent=2, default=str, ensure_ascii=False).encode("utf-8")


__all__ = ["render_json"]
