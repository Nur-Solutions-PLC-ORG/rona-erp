from __future__ import annotations

import base64

import pytest
from pydantic import SecretStr
from sqlalchemy import select

from app.core.database import (
    KnowledgeDocument,
    ReportJob,
    create_report_job,
    get_encryptor,
    get_report_job,
    initialise_database,
    list_knowledge_documents,
    replace_knowledge_documents,
    session_scope,
)
from app.core.encryption import DataEncryptor, EncryptionError
from app.services.report_storage import get_report_storage


def _key(byte: int) -> str:
    return base64.urlsafe_b64encode(bytes([byte]) * 32).decode("ascii")


def test_authenticated_encryption_hides_plaintext_and_detects_tampering(settings):
    encryptor = get_encryptor()
    ciphertext = encryptor.encrypt("employee salary 50000", context="field:a")

    assert ciphertext.startswith("enc:v1:")
    assert "employee" not in ciphertext
    assert encryptor.decrypt(ciphertext, context="field:a") == "employee salary 50000"

    changed = ciphertext[:-1] + ("A" if ciphertext[-1] != "A" else "B")
    with pytest.raises(EncryptionError):
        encryptor.decrypt(changed, context="field:a")
    with pytest.raises(EncryptionError):
        encryptor.decrypt(ciphertext, context="field:b")


def test_old_key_can_decrypt_during_rotation(settings):
    old = DataEncryptor({"old": base64.urlsafe_b64decode(_key(1))}, "old")
    ciphertext = old.encrypt("retained data", context="row:1")
    rotating = DataEncryptor(
        {
            "old": base64.urlsafe_b64decode(_key(1)),
            "new": base64.urlsafe_b64decode(_key(2)),
        },
        "new",
    )

    assert rotating.decrypt(ciphertext, context="row:1") == "retained data"
    assert rotating.encrypt("new data", context="row:2").startswith("enc:v1:new:")


def test_kb_and_report_payloads_are_ciphertext_in_database(settings):
    initialise_database()
    replace_knowledge_documents(
        [{"doc_id": "KB-SECRET", "domain": "finance", "title": "Salary policy", "content": "Salary is confidential", "tags": ["salary"]}]
    )
    create_report_job(
        report_id="RPT-SECRET",
        tenant_id="tenant-a",
        requested_by="employee-7",
        report_type="finance",
        export_format="json",
        period_label="August 2026",
        payload={"salary": 50000},
        authorized_domains=["finance"],
        max_attempts=3,
    )

    with session_scope() as session:
        kb = session.scalar(select(KnowledgeDocument).where(KnowledgeDocument.doc_id == "KB-SECRET"))
        job = session.get(ReportJob, "RPT-SECRET")
        assert kb is not None and job is not None
        assert kb.content.startswith("enc:v1:")
        assert "confidential" not in kb.content
        assert job.payload_json.startswith("enc:v1:")
        assert "salary" not in job.payload_json
        assert "employee-7" not in job.requested_by

    assert list_knowledge_documents()[0].content == "Salary is confidential"
    loaded = get_report_job("RPT-SECRET", "tenant-a")
    assert loaded is not None
    assert '"salary":50000' in loaded.payload_json
    assert loaded.requested_by == "employee-7"


def test_kb_rows_remain_ciphertext_after_list_knowledge_documents(settings):
    initialise_database()
    replace_knowledge_documents(
        [{"doc_id": "KB-PERSIST", "domain": "finance", "title": "Policy", "content": "secret content", "tags": []}]
    )
    assert list_knowledge_documents()[0].content == "secret content"
    with session_scope() as session:
        row = session.scalar(select(KnowledgeDocument).where(KnowledgeDocument.doc_id == "KB-PERSIST"))
        assert row is not None
        assert row.title.startswith("enc:v1:")
        assert row.content.startswith("enc:v1:")
        assert "secret content" not in row.content
        assert "Policy" not in row.title


@pytest.mark.asyncio
async def test_generated_report_file_is_encrypted_at_rest(settings):
    storage = get_report_storage()
    plaintext = b"sensitive report bytes"
    storage_key = await storage.put("report.pdf", plaintext)

    raw = __import__("pathlib").Path(storage_key).read_bytes()
    assert raw.startswith(b"enc:v1:")
    assert plaintext not in raw
    assert await storage.get(storage_key) == plaintext


def test_production_rejects_missing_encryption_keyring():
    from app.core.config import Settings

    with pytest.raises(Exception, match="DATA_ENCRYPTION_KEYRING"):
        Settings(
            _env_file=None,
            environment="production",
            debug=False,
            log_format="json",
            google_api_key=SecretStr("key"),
            jwt_secret=SecretStr("x" * 40),
            jwt_keyring={"jwt": SecretStr("y" * 40)},
            jwt_active_kid="jwt",
            allow_header_auth=False,
            database_url="postgresql+psycopg://u:p@db/name",
            trusted_hosts=["ai.example.com"],
            cors_origins=["https://erp.example.com"],
            data_encryption_keyring={},
            data_encryption_active_kid=None,
        )
