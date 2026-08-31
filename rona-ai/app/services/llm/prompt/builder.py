from __future__ import annotations

from app.core.config import Settings
from app.schemas import RonaContextBundle
from app.services.knowledge_base import KnowledgeBaseService
from app.services.llm.prompt.alerts import alert_lines
from app.services.llm.prompt.formatting import trends_lines
from app.services.llm.prompt.header import header_lines
from app.services.llm.prompt.knowledge import CitationRecord, build_knowledge_block
from app.services.llm.prompt.sections import (
    finance_section,
    hr_section,
    inventory_section,
    maintenance_section,
    procurement_section,
    production_section,
    sales_section,
)
_DOMAIN_SECTIONS = (
    ("hr", hr_section, "HR & Attendance"),
    ("production", production_section, "Production"),
    ("inventory", inventory_section, "Inventory"),
    ("maintenance", maintenance_section, "Maintenance"),
    ("finance", finance_section, "Finance"),
    ("procurement", procurement_section, "Procurement"),
    ("sales", sales_section, "Sales"),
)


async def build_prompt(
    question: str,
    bundle: RonaContextBundle,
    *,
    kb: KnowledgeBaseService,
    settings: Settings,
) -> tuple[str, tuple[CitationRecord, ...]]:
    parts = header_lines(bundle)
    parts.extend(domain_lines(bundle))
    parts.extend(alert_lines(bundle))

    kb_lines, allowed_citations = await build_knowledge_block(
        question, bundle, kb=kb, settings=settings
    )
    parts.extend(kb_lines)

    parts.append(f"\nQUESTION: {question}")
    return "\n".join(parts), allowed_citations


def domain_lines(bundle: RonaContextBundle) -> list[str]:
    lines: list[str] = []
    for attribute, render, trend_heading in _DOMAIN_SECTIONS:
        payload = getattr(bundle, attribute)
        if payload is None:
            continue
        lines.extend(render(payload))
        lines.extend(trends_lines(payload, trend_heading))
    return lines


__all__ = ["build_prompt", "domain_lines"]
