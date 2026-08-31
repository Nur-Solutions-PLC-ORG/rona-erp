"""Route modules; each module owns one endpoint group."""

from __future__ import annotations

from app.api.routes import chat, health, reports, summary

__all__ = ["chat", "health", "reports", "summary"]
