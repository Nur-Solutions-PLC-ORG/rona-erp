"""Application logging configuration."""

from __future__ import annotations

import logging

from pythonjsonlogger.json import JsonFormatter

from app.core.config import Settings


def configure_logging(settings: Settings) -> logging.Logger:
    """Install the root logging handler and return the app logger."""
    handler = logging.StreamHandler()
    if settings.log_format == "json":
        handler.setFormatter(
            JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
        )
    else:
        handler.setFormatter(
            logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s")
        )
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
        handlers=[handler],
        force=True,
    )
    return logging.getLogger("rona")


__all__ = ["configure_logging"]
