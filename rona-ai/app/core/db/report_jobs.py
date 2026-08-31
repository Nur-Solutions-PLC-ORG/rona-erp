from __future__ import annotations

import json
from datetime import timedelta

from sqlalchemy import select, update

from app.core.db.encryption import get_encryptor
from app.core.db.engine import session_scope
from app.core.db.models import ReportJob, utcnow


def create_report_job(
    *,
    report_id: str,
    tenant_id: str,
    requested_by: str,
    report_type: str,
    export_format: str,
    period_label: str,
    payload: dict,
    authorized_domains: list[str],
    max_attempts: int,
) -> ReportJob:
    encryptor = get_encryptor()
    job = ReportJob(
        report_id=report_id,
        tenant_id=tenant_id,
        requested_by=encryptor.encrypt(
            requested_by, context=f"report:{report_id}:requester"
        ),
        report_type=report_type,
        export_format=export_format,
        period_label=encryptor.encrypt(
            period_label, context=f"report:{report_id}:period"
        ),
        payload_json=encryptor.encrypt(
            json.dumps(payload, separators=(",", ":"), default=str),
            context=f"report:{report_id}:payload",
        ),
        authorized_domains_json=encryptor.encrypt(
            json.dumps(sorted(set(authorized_domains)), separators=(",", ":")),
            context=f"report:{report_id}:domains",
        ),
        status="pending",
        attempts=0,
        max_attempts=max_attempts,
        next_attempt_at=utcnow(),
    )
    with session_scope() as session:
        session.add(job)
    return job


def _decrypt_report_job(job: ReportJob | None) -> ReportJob | None:
    if job is None:
        return None
    encryptor = get_encryptor()
    job.requested_by = encryptor.decrypt(
        job.requested_by, context=f"report:{job.report_id}:requester"
    )
    job.period_label = encryptor.decrypt(
        job.period_label, context=f"report:{job.report_id}:period"
    )
    job.payload_json = encryptor.decrypt(
        job.payload_json, context=f"report:{job.report_id}:payload"
    )
    job.authorized_domains_json = encryptor.decrypt(
        job.authorized_domains_json, context=f"report:{job.report_id}:domains"
    )
    return job


def get_report_job(report_id: str, tenant_id: str) -> ReportJob | None:
    with session_scope() as session:
        job = session.scalar(
            select(ReportJob).where(
                ReportJob.report_id == report_id,
                ReportJob.tenant_id == tenant_id,
            )
        )
    # Decrypt only after the session commits/closes. Otherwise SQLAlchemy could
    # accidentally persist plaintext back to the database on session commit.
    return _decrypt_report_job(job)


def claim_next_report_job(stale_seconds: int) -> ReportJob | None:
    now = utcnow()
    stale_before = now - timedelta(seconds=stale_seconds)
    with session_scope() as session:
        candidate = session.scalar(
            select(ReportJob)
            .where(
                ReportJob.attempts < ReportJob.max_attempts,
                ReportJob.next_attempt_at <= now,
                (ReportJob.status == "pending")
                | (
                    (ReportJob.status == "processing")
                    & (ReportJob.started_at < stale_before)
                ),
            )
            .order_by(ReportJob.created_at)
            .limit(1)
        )
        if candidate is None:
            return None
        claimed = session.execute(
            update(ReportJob)
            .where(
                ReportJob.report_id == candidate.report_id,
                ReportJob.status == candidate.status,
                ReportJob.attempts == candidate.attempts,
            )
            .values(
                status="processing",
                attempts=candidate.attempts + 1,
                started_at=now,
                error_message=None,
            )
        )
        if claimed.rowcount != 1:
            return None
        session.flush()
        job = session.get(ReportJob, candidate.report_id)
    return _decrypt_report_job(job)


def mark_report_ready(
    report_id: str, *, filename: str, storage_key: str, byte_size: int
) -> None:
    with session_scope() as session:
        job = session.get(ReportJob, report_id)
        if job is None:
            return
        job.status = "ready"
        job.filename = filename
        job.storage_key = storage_key
        job.byte_size = byte_size
        job.completed_at = utcnow()
        job.error_message = None


def mark_report_failed(report_id: str, error: str, retry_seconds: float) -> None:
    with session_scope() as session:
        job = session.get(ReportJob, report_id)
        if job is None:
            return
        job.error_message = error[:500]
        if job.attempts >= job.max_attempts:
            job.status = "failed"
            job.completed_at = utcnow()
        else:
            job.status = "pending"
            job.next_attempt_at = utcnow() + timedelta(seconds=retry_seconds)


def delete_expired_report_jobs(retention_hours: int) -> list[ReportJob]:
    cutoff = utcnow() - timedelta(hours=retention_hours)
    with session_scope() as session:
        expired = list(
            session.scalars(
                select(ReportJob).where(
                    ReportJob.created_at < cutoff,
                    ReportJob.status.in_(("ready", "failed")),
                )
            )
        )
        for job in expired:
            session.delete(job)
    return expired


__all__ = [
    "claim_next_report_job",
    "create_report_job",
    "delete_expired_report_jobs",
    "get_report_job",
    "mark_report_failed",
    "mark_report_ready",
]
