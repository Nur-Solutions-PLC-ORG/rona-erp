"""PDF report renderer."""

from __future__ import annotations

import io

from app.services.reports.models import ReportDocument
from app.services.reports.renderers.cells import pdf_cell

_SUMMARY_COL_WIDTHS_MM = (70, 120)


def _table_style():
    from reportlab.lib import colors
    from reportlab.platypus import TableStyle

    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#9ca3af")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]
    )


def _cell_styles():
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet

    styles = getSampleStyleSheet()
    body = styles["BodyText"].clone("cell")
    body.fontSize = 7
    body.leading = 9
    header = styles["BodyText"].clone("hcell")
    header.fontSize = 7
    header.leading = 9
    header.textColor = colors.white
    return styles, body, header


def render_pdf(document: ReportDocument) -> bytes:
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import mm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table

    styles, cell_style, header_cell = _cell_styles()

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        leftMargin=12 * mm,
        rightMargin=12 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
        title=document.title,
    )

    story: list[object] = [
        Paragraph(document.title, styles["Title"]),
        Paragraph(f"Tenant: {document.tenant_label}", styles["Normal"]),
        Paragraph(f"Period: {document.period_label}", styles["Normal"]),
        Paragraph(f"Generated: {document.generated_at.isoformat()}", styles["Normal"]),
        Paragraph(f"Source: {document.source_system}", styles["Normal"]),
        Spacer(1, 8 * mm),
    ]

    if document.summary:
        story.append(Paragraph("Summary", styles["Heading2"]))
        summary_data = [[Paragraph("Metric", header_cell), Paragraph("Value", header_cell)]]
        summary_data += [
            [Paragraph(str(label), cell_style), Paragraph(str(value), cell_style)]
            for label, value in document.summary
        ]
        summary_table = Table(
            summary_data,
            hAlign="LEFT",
            colWidths=[width * mm for width in _SUMMARY_COL_WIDTHS_MM],
        )
        summary_table.setStyle(_table_style())
        story.append(summary_table)
        story.append(Spacer(1, 6 * mm))

    for table in document.tables:
        story.append(Paragraph(table.name, styles["Heading2"]))
        if not table.rows:
            story.append(Paragraph("No records for this period.", styles["Italic"]))
            story.append(Spacer(1, 4 * mm))
            continue
        header = [Paragraph(str(c), header_cell) for c in table.columns]
        body = [[Paragraph(pdf_cell(v), cell_style) for v in row] for row in table.rows]
        grid = Table([header] + body, repeatRows=1)
        grid.setStyle(_table_style())
        story.append(grid)
        story.append(Spacer(1, 6 * mm))

    pdf.build(story)
    return buffer.getvalue()


__all__ = ["render_pdf"]
