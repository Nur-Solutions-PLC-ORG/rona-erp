
from __future__ import annotations

import pytest
from pydantic import SecretStr, ValidationError

from app.core.config import Settings


def test_large_request_body_is_rejected(client, header_auth, settings, monkeypatch):
    monkeypatch.setattr(settings, "max_request_body_bytes", 10)
    response = client.post(
        "/api/v1/chat",
        headers=header_auth(role="factory_owner"),
        json={"question": "This request is intentionally larger than ten bytes."},
    )

    assert response.status_code == 413
    assert response.json()["error"] == "payload_too_large"
    assert response.headers["X-Content-Type-Options"] == "nosniff"


def test_unsafe_request_id_is_replaced(client):
    response = client.get(
        "/api/v1/health",
        headers={"X-Request-ID": "unsafe value with spaces"},
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] != "unsafe value with spaces"
    assert len(response.headers["X-Request-ID"]) == 32


def test_security_headers_are_added_to_normal_responses(client):
    response = client.get("/api/v1/health")

    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Cache-Control"] == "no-store"


def _valid_production_settings(**overrides):
    values = {
        "environment": "production",
        "debug": False,
        "log_format": "json",
        "google_api_key": SecretStr("test-google-key"),
        "adapter_backend": "mock",
        "jwt_secret": SecretStr("a-secure-test-secret-that-is-longer-than-32-characters"),
        "data_encryption_keyring": {
            "2026-08": SecretStr("MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=")
        },
        "data_encryption_active_kid": "2026-08",
        "jwt_keyring": {
            "2026-08": SecretStr("production-signing-key-that-is-longer-than-32-characters")
        },
        "jwt_active_kid": "2026-08",
        "allow_header_auth": False,
        "database_url": "postgresql+psycopg://user:password@db.example/rona",
        "database_auto_migrate": False,
        "report_worker_mode": "embedded",
        "trusted_hosts": ["ai.example.com"],
        "cors_origins": ["https://erp.example.com"],
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_valid_production_configuration_is_accepted():
    settings = _valid_production_settings()
    assert settings.is_production


def test_production_requires_rotation_keyring_and_active_kid():
    """Production must not fall back to ambiguous JWTs without a key ID."""
    with pytest.raises(ValidationError, match="JWT_KEYRING and JWT_ACTIVE_KID"):
        _valid_production_settings(jwt_keyring={}, jwt_active_kid=None)


def test_keyring_rejects_unknown_active_kid_and_weak_keys():
    """Bad rotation configuration fails at startup, before requests are served."""
    with pytest.raises(ValidationError) as raised:
        _valid_production_settings(
            jwt_keyring={"current": SecretStr("short")},
            jwt_active_kid="missing",
        )

    message = str(raised.value)
    assert "JWT_ACTIVE_KID must identify a key" in message
    assert "must be at least 32 characters" in message


def test_production_rejects_plain_text_logs():
    with pytest.raises(ValidationError, match="LOG_FORMAT must be json"):
        _valid_production_settings(log_format="text")


def test_production_rejects_local_database():
    with pytest.raises(ValidationError) as raised:
        _valid_production_settings(database_url="sqlite:///./data/rona.db")

    message = str(raised.value)
    assert "PostgreSQL" in message
