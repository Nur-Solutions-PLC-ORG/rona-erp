"""Error types raised while building or rendering reports."""

from __future__ import annotations


class ReportError(RuntimeError):
    """Raised when a report cannot be generated or rendered."""


class ReportDataUnavailableError(ReportError):
    """Raised when the source bundle lacks the data a report requires."""


__all__ = ["ReportError", "ReportDataUnavailableError"]
