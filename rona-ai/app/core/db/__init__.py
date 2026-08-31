"""Database access layer.

Public surface mirrors the previous flat ``app.core.database`` module:

- models and the declarative base (``models``)
- engine/session lifecycle (``engine``)
- the field-encryption singleton (``encryption``)
- per-aggregate repositories (``report_jobs``, ``knowledge_documents``)
"""

from __future__ import annotations

from app.core.db.engine import (
    database_ready,
    get_engine,
    initialise_database,
    reset_database_state,
    session_scope,
)
from app.core.db.encryption import get_encryptor, reset_encryption_state
from app.core.db.knowledge_documents import (
    list_knowledge_documents,
    replace_knowledge_documents,
)
from app.core.db.models import Base, KnowledgeDocument, ReportJob, utcnow
from app.core.db.report_jobs import (
    claim_next_report_job,
    create_report_job,
    delete_expired_report_jobs,
    get_report_job,
    mark_report_failed,
    mark_report_ready,
)

__all__ = [
    "Base",
    "KnowledgeDocument",
    "ReportJob",
    "claim_next_report_job",
    "create_report_job",
    "database_ready",
    "delete_expired_report_jobs",
    "get_encryptor",
    "get_engine",
    "get_report_job",
    "initialise_database",
    "list_knowledge_documents",
    "mark_report_failed",
    "mark_report_ready",
    "replace_knowledge_documents",
    "reset_database_state",
    "reset_encryption_state",
    "session_scope",
    "utcnow",
]
