
from __future__ import annotations

import asyncio
import json
import logging

from app.core.config import get_settings
from app.core.database import (
    claim_next_report_job,
    delete_expired_report_jobs,
    initialise_database,
    mark_report_failed,
    mark_report_ready,
)
from app.core.enums import ExportFormat, ReportType
from app.schemas import RonaContextBundle
from app.services.reports import get_report_service
from app.services.report_storage import get_report_storage

logger = logging.getLogger(__name__)

# How often the retention sweep runs while the worker is idle.
_RETENTION_SWEEP_SECONDS = 300.0


async def process_one() -> bool:
    settings = get_settings()
    job = claim_next_report_job(settings.report_job_stale_seconds)
    if job is None:
        return False
    try:
        bundle = RonaContextBundle.model_validate(json.loads(job.payload_json))
        data = await get_report_service().render_bytes(
            bundle=bundle,
            report_type=ReportType(job.report_type),
            export_format=ExportFormat(job.export_format),
        )
        extension = {ExportFormat.PDF: "pdf", ExportFormat.EXCEL: "xlsx", ExportFormat.JSON: "json"}[ExportFormat(job.export_format)]
        filename = f"{job.report_id}.{extension}"
        storage_key = await get_report_storage().put(filename, data)
        mark_report_ready(job.report_id, filename=filename, storage_key=storage_key, byte_size=len(data))
        logger.info("report job completed report_id=%s bytes=%d", job.report_id, len(data))
    except Exception as exc:
        logger.exception("report job failed report_id=%s", job.report_id)
        try:
            mark_report_failed(job.report_id, str(exc), get_settings().report_job_retry_seconds)
        except Exception:
            logger.exception("failed to record failure for report_id=%s", job.report_id)
    return True


async def _sweep_expired_reports() -> None:
    """Delete finished report jobs (and their files) past the retention window."""
    settings = get_settings()
    expired = delete_expired_report_jobs(settings.report_retention_hours)
    if not expired:
        return
    storage = get_report_storage()
    for job in expired:
        if job.storage_key:
            await storage.delete(job.storage_key)
    logger.info("retention sweep removed %d expired report job(s)", len(expired))


async def run_worker() -> None:
    settings = get_settings()
    initialise_database()
    logger.info("report worker started poll_seconds=%s", settings.report_worker_poll_seconds)
    time_since_sweep = 0.0
    while True:
        try:
            if await process_one():
                time_since_sweep += settings.report_worker_poll_seconds
            else:
                await asyncio.sleep(settings.report_worker_poll_seconds)
                time_since_sweep += settings.report_worker_poll_seconds
            if time_since_sweep >= _RETENTION_SWEEP_SECONDS:
                await _sweep_expired_reports()
                time_since_sweep = 0.0
        except asyncio.CancelledError:
            raise
        except Exception:
            # A transient error (e.g. database hiccup) must not kill the
            # worker permanently; back off and try again.
            logger.exception("report worker cycle failed; backing off")
            await asyncio.sleep(5.0)
            time_since_sweep = 0.0


if __name__ == "__main__":
    asyncio.run(run_worker())
