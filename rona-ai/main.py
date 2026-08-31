from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api import router
from app.api.dependencies import get_adapter
from app.core.config import get_settings
from app.core.database import database_ready, initialise_database
from app.exception_handlers import register_exception_handlers
from app.logging_config import configure_logging
from app.middleware import observability_middleware
from app.services.knowledge_base import get_knowledge_base
from app.services.report_storage import get_report_storage
from app.workers.report_worker import run_worker

settings = get_settings()
logger = configure_logging(settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "starting %s version=%s env=%s backend=%s header_auth=%s llm=%s",
        settings.app_name,
        settings.app_version,
        settings.environment,
        settings.adapter_backend,
        settings.allow_header_auth,
        "configured" if settings.llm_configured else "MISSING",
    )

    initialise_database()
    get_knowledge_base()

    try:
        await get_adapter()
    except Exception as exc:
        logger.warning("adapter not ready at startup: %s", exc)

    worker_task: asyncio.Task[None] | None = None
    if settings.report_worker_mode == "embedded":
        worker_task = asyncio.create_task(run_worker(), name="rona-report-worker")
        logger.info("embedded report worker started")
    elif settings.report_worker_mode == "external":
        logger.info("report worker expected as an external process")

    try:
        yield
    finally:
        if worker_task is not None:
            worker_task.cancel()
            await asyncio.gather(worker_task, return_exceptions=True)
            logger.info("embedded report worker stopped")
        from app.services.ai_limit import close_limiter_client

        await close_limiter_client()
        logger.info("shutting down %s", settings.app_name)


_is_prod = settings.is_production

app = FastAPI(
    title=settings.app_name,
    description="Rona AI — Intelligent Factory Assistant Microservice",
    version=settings.app_version,
    lifespan=lifespan,
    debug=settings.debug,
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.middleware("http")(observability_middleware)
register_exception_handlers(app)


@app.get("/ready")
async def readiness():
    db_ok = database_ready()
    storage_ok = await get_report_storage().health_check()
    if not db_ok or not storage_ok:
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "database": db_ok, "report_storage": storage_ok},
        )
    return {"status": "ready", "database": True, "report_storage": True}


app.include_router(router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "health": f"{settings.api_v1_prefix}/health",
    }


@app.get("/test")
async def test_ui():
    if _is_prod:
        raise HTTPException(status_code=404, detail="Not Found")
    test_path = Path(__file__).parent / "test-frontend.html"
    if not test_path.exists():
        raise HTTPException(status_code=404, detail="Not Found")
    return FileResponse(test_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
