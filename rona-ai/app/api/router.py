from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import chat, health, reports, summary

router = APIRouter()
router.include_router(health.router)
router.include_router(chat.router)
router.include_router(summary.router)
router.include_router(reports.router)

__all__ = ["router"]
