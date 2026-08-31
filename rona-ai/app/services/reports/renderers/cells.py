"""Value coercion and sheet-naming helpers shared by renderers."""

from __future__ import annotations

import re

_INVALID_SHEET_CHARS = re.compile(r"[:\\/?*\[\]]")
_MAX_SHEET_NAME = 31


def unique_sheet_name(name: str, used: set[str]) -> str:
    """Return an Excel-safe worksheet name that is unique within ``used``."""
    cleaned = _INVALID_SHEET_CHARS.sub(" ", name).strip()[:_MAX_SHEET_NAME] or "Sheet"
    candidate = cleaned
    suffix = 2
    while candidate in used:
        tail = f" {suffix}"
        candidate = cleaned[: _MAX_SHEET_NAME - len(tail)] + tail
        suffix += 1
    used.add(candidate)
    return candidate


def excel_column_letter(column_number: int) -> str:
    result = ""
    while column_number:
        column_number, remainder = divmod(column_number - 1, 26)
        result = chr(65 + remainder) + result
    return result or "A"


def excel_cell(value: object) -> object:
    """openpyxl only accepts primitives; stringify everything else."""
    if value is None or isinstance(value, (str, int, float)):
        return value
    return str(value)


def pdf_cell(value: object) -> str:
    if value is None:
        return "-"
    return str(value)


__all__ = ["excel_cell", "excel_column_letter", "pdf_cell", "unique_sheet_name"]
