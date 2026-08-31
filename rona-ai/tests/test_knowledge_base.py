from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from app.core.database import initialise_database, replace_knowledge_documents
from app.core.enums import DataDomain
from app.services.knowledge_base import KnowledgeBaseService


def _search(service: KnowledgeBaseService, query: str, *, tenant="tenant-a", domains=None):
    return asyncio.run(
        service.search(query, tenant_id=tenant, domains=domains, limit=10)
    )


def test_mock_kb_returns_chunk_and_structured_citation(settings):
    settings.kb_seed_mock_data = True
    initialise_database()
    service = KnowledgeBaseService()

    results = asyncio.run(
        service.search_with_citations(
            "When must low inventory be reordered?",
            tenant_id="tenant-a",
            domains=[DataDomain.INVENTORY],
        )
    )

    assert results
    hit, citation = results[0]
    assert citation.document_id == "KB-003"
    assert citation.chunk_id.startswith("KB-003-C")
    assert citation.version == 1
    assert hit.document.domain == DataDomain.INVENTORY


def test_kb_normalizes_punctuation_and_hyphenated_terms(settings):
    settings.kb_seed_mock_data = True
    initialise_database()
    service = KnowledgeBaseService()

    hits = _search(
        service,
        "What is the clock-in rule?",
        domains=[DataDomain.HR],
    )

    assert hits
    assert hits[0].document.doc_id == "KB-001"


def test_kb_enforces_tenant_and_domain_before_returning_hits(settings):
    settings.kb_seed_mock_data = False
    initialise_database()
    replace_knowledge_documents(
        [
            {
                "doc_id": "TENANT-A-FINANCE",
                "tenant_id": "tenant-a",
                "domain": DataDomain.FINANCE.value,
                "title": "Secret finance policy",
                "content": "The confidential zebra threshold is 42.",
                "status": "approved",
            }
        ]
    )
    service = KnowledgeBaseService()

    assert not _search(service, "zebra threshold", tenant="tenant-b", domains=[DataDomain.FINANCE])
    assert not _search(service, "zebra threshold", tenant="tenant-a", domains=[DataDomain.HR])
    assert _search(service, "zebra threshold", tenant="tenant-a", domains=[DataDomain.FINANCE])


def test_kb_excludes_draft_future_and_expired_documents(settings):
    settings.kb_seed_mock_data = False
    initialise_database()
    now = datetime.now(timezone.utc)
    replace_knowledge_documents(
        [
            {
                "doc_id": "DRAFT",
                "domain": DataDomain.HR.value,
                "title": "Draft unicorn policy",
                "content": "unicorn draft content",
                "status": "draft",
            },
            {
                "doc_id": "FUTURE",
                "domain": DataDomain.HR.value,
                "title": "Future unicorn policy",
                "content": "unicorn future content",
                "status": "approved",
                "effective_from": now + timedelta(days=1),
            },
            {
                "doc_id": "EXPIRED",
                "domain": DataDomain.HR.value,
                "title": "Expired unicorn policy",
                "content": "unicorn expired content",
                "status": "approved",
                "effective_until": now - timedelta(days=1),
            },
            {
                "doc_id": "CURRENT",
                "domain": DataDomain.HR.value,
                "title": "Current unicorn policy",
                "content": "unicorn current content",
                "status": "approved",
                "effective_from": now - timedelta(days=1),
                "effective_until": now + timedelta(days=1),
                "version": 3,
            },
        ]
    )
    service = KnowledgeBaseService()

    hits = _search(service, "unicorn", domains=[DataDomain.HR])

    assert [hit.document.doc_id for hit in hits] == ["CURRENT"]
    assert hits[0].document.version == 3


def test_prompt_snippets_contain_bounded_reference_metadata(settings):
    settings.kb_enabled = True
    settings.kb_seed_mock_data = True
    initialise_database()
    service = KnowledgeBaseService()

    snippets = asyncio.run(
        service.snippets_for_prompt(
            "maintenance safety LOTO",
            tenant_id="tenant-a",
            domains=[DataDomain.MAINTENANCE],
        )
    )

    assert snippets
    assert "document=KB-008" in snippets[0]
    assert "chunk=KB-008-C" in snippets[0]
    assert len(snippets) <= settings.kb_max_snippets
