from __future__ import annotations

import json

from sqlalchemy import select

from app.core.db.encryption import get_encryptor
from app.core.db.engine import session_scope
from app.core.db.models import KnowledgeDocument, utcnow


def replace_knowledge_documents(documents: list[dict]) -> None:
    encryptor = get_encryptor()
    with session_scope() as session:
        for item in documents:
            existing = session.get(KnowledgeDocument, item["doc_id"])
            values = {
                "tenant_id": item.get("tenant_id"),
                "domain": item["domain"],
                "title": encryptor.encrypt(
                    item["title"], context=f"kb:{item['doc_id']}:title"
                ),
                "content": encryptor.encrypt(
                    item["content"], context=f"kb:{item['doc_id']}:content"
                ),
                "category": item.get("category", "policy"),
                "tags_json": encryptor.encrypt(
                    json.dumps(item.get("tags", [])),
                    context=f"kb:{item['doc_id']}:tags",
                ),
                "version": int(item.get("version", 1)),
                "status": item.get("status", "approved"),
                "effective_from": item.get("effective_from"),
                "effective_until": item.get("effective_until"),
                "source_ref": (
                    encryptor.encrypt(
                        item["source_ref"],
                        context=f"kb:{item['doc_id']}:source_ref",
                    )
                    if item.get("source_ref")
                    else None
                ),
                "updated_at": utcnow(),
            }
            if existing is None:
                session.add(KnowledgeDocument(doc_id=item["doc_id"], **values))
            else:
                for key, value in values.items():
                    setattr(existing, key, value)


def list_knowledge_documents() -> list[KnowledgeDocument]:
    with session_scope() as session:
        rows = list(
            session.scalars(
                select(KnowledgeDocument).order_by(KnowledgeDocument.doc_id)
            )
        )
    encryptor = get_encryptor()
    for row in rows:
        row.title = encryptor.decrypt(row.title, context=f"kb:{row.doc_id}:title")
        row.content = encryptor.decrypt(
            row.content, context=f"kb:{row.doc_id}:content"
        )
        row.tags_json = encryptor.decrypt(
            row.tags_json, context=f"kb:{row.doc_id}:tags"
        )
        if row.source_ref:
            row.source_ref = encryptor.decrypt(
                row.source_ref, context=f"kb:{row.doc_id}:source_ref"
            )
    return rows


__all__ = ["list_knowledge_documents", "replace_knowledge_documents"]
