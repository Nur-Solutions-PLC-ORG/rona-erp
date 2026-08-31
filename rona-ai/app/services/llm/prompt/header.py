from __future__ import annotations

from app.core.enums import domain_label
from app.schemas import RonaContextBundle

_LANGUAGE_NAMES = {"en": "English", "am": "Amharic", "om": "Afaan Oromo"}

def header_lines(bundle: RonaContextBundle) -> list[str]:
    lines = ["CONTEXT", "======="]
    lines.append(f"Tenant: {bundle.tenant_name or bundle.tenant_id}")
    lines.append(f"User role: {bundle.user_role.value}")

    language = _LANGUAGE_NAMES.get(bundle.language.value, bundle.language.value)
    lines.append(
        f"RESPONSE LANGUAGE: {language}. "
        "Always write the answer, recommendation, and supporting-data labels in this language, "
        "even when the user writes the question in another language."
    )

    lines.append(
        f"Reporting period: {bundle.period.label} "
        f"({bundle.period.start.isoformat()} to {bundle.period.end.isoformat()})"
    )
    lines.append(f"Data fetched at: {bundle.generated_at.isoformat()}")
    lines.extend(_availability_lines(bundle))
    return lines


def _availability_lines(bundle: RonaContextBundle) -> list[str]:
    lines: list[str] = []
    if bundle.granted_domains:
        lines.append(
            "Accessible modules: "
            + ", ".join(domain_label(d) for d in bundle.granted_domains)
        )
    if bundle.denied_domains:
        lines.append(
            "Restricted modules (do NOT answer from these; say access is denied): "
            + ", ".join(domain_label(d) for d in bundle.denied_domains)
        )
    if bundle.failed_domains:
        lines.append(
            "Temporarily unavailable modules (data could not be retrieved): "
            + ", ".join(domain_label(d) for d in bundle.failed_domains)
        )

    truncated = bundle.truncated_domains()
    if truncated:
        lines.append(
            "NOTE: example rows for "
            + ", ".join(domain_label(d) for d in truncated)
            + " are a partial sample the totals above them are complete."
        )
    return lines


__all__ = ["header_lines"]
