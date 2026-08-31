"""Export-format renderers for report documents."""

from __future__ import annotations

from collections.abc import Callable

from app.core.enums import ExportFormat
from app.services.reports.errors import ReportError
from app.services.reports.models import ReportDocument
from app.services.reports.renderers.excel_renderer import render_excel
from app.services.reports.renderers.json_renderer import render_json
from app.services.reports.renderers.pdf_renderer import render_pdf

Renderer = Callable[[ReportDocument], bytes]

#: Register new export formats here; the service needs no changes.
RENDERERS: dict[ExportFormat, Renderer] = {
    ExportFormat.JSON: render_json,
    ExportFormat.EXCEL: render_excel,
    ExportFormat.PDF: render_pdf,
}


def render(document: ReportDocument, export_format: ExportFormat) -> bytes:
    """Render ``document`` into the requested export format."""
    try:
        renderer = RENDERERS[export_format]
    except KeyError as exc:
        raise ReportError(f"Unsupported export format: {export_format}") from exc
    return renderer(document)


__all__ = ["RENDERERS", "Renderer", "render", "render_excel", "render_json", "render_pdf"]
