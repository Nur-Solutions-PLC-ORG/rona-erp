
from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.enums import Language

logger = logging.getLogger(__name__)


INSECURE_JWT_SECRET = ""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


    app_name: str = "Rona AI"
    environment: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: str = "INFO"
    log_format: Literal["text", "json"] = "text"
    api_v1_prefix: str = "/api/v1"

    app_version: str = "1.0.0"


    google_api_key: SecretStr | None = None


    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    gemini_max_output_tokens: int = Field(default=2048, gt=0)


    gemini_thinking_budget: int = Field(default=0, ge=0)


    gemini_timeout_seconds: float = Field(default=12.0, gt=0)


    adapter_backend: Literal["mock", "erp_http"] = "mock"


    erp_base_url: str = "https://erp.rona.local/api"
    erp_api_key: SecretStr | None = None
    erp_timeout_seconds: float = Field(default=10.0, gt=0)

    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: SecretStr | None = None
    ai_limit_enabled: bool = True
    ai_daily_limit: int = Field(default=1000, gt=0)

    jwt_algorithm: str = "HS256"
    jwt_secret: SecretStr = SecretStr(INSECURE_JWT_SECRET)
    jwt_audience: str = "rona-ai"
    jwt_issuer: str = "rona-erp"
    jwt_keyring: dict[str, SecretStr] = Field(default_factory=dict)
    jwt_active_kid: str | None = None
    jwt_max_lifetime_seconds: int = Field(default=3600, gt=0)


    jwt_leeway_seconds: int = Field(default=10, ge=0)


    allow_header_auth: bool = True


    database_url: str = "sqlite:///./data/rona_ai.db"
    database_auto_migrate: bool = True
    database_pool_pre_ping: bool = True
    data_encryption_keyring: dict[str, SecretStr] = Field(default_factory=dict)
    data_encryption_active_kid: str | None = None


    kb_enabled: bool = False
    kb_max_snippets: int = Field(default=3, gt=0, le=10)
    kb_seed_mock_data: bool = True


    report_output_dir: str = "generated_reports"
    report_retention_hours: int = Field(default=24, gt=0)
    report_worker_mode: Literal["embedded", "external", "disabled"] = "embedded"
    report_worker_poll_seconds: float = Field(default=1.0, gt=0)
    report_job_max_attempts: int = Field(default=3, ge=1, le=10)
    report_job_retry_seconds: float = Field(default=5.0, ge=0)
    report_job_stale_seconds: int = Field(default=300, gt=0)


    trusted_hosts: list[str] = Field(default=["localhost", "127.0.0.1", "testserver"])
    max_request_body_bytes: int = Field(default=1_048_576, gt=0)


    default_language: Language = Language.EN


    response_target_seconds: float = Field(default=3.0, gt=0)
    audit_log_enabled: bool = True


    max_context_records_per_domain: int = Field(default=150, gt=0)

    cors_origins: list[str] = Field(default=["http://localhost:3000", "http://localhost:5173"], description="CORS allowed origins")


    @field_validator("cors_origins", "trusted_hosts", mode="before")
    @classmethod
    def _split_csv_values(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        text = value.strip()
        if text.startswith("["):
            try:
                parsed = json.loads(text)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        return [item.strip() for item in text.split(",") if item.strip()]

    @field_validator("data_encryption_keyring", mode="before")
    @classmethod
    def _parse_encryption_keyring(cls, value: object) -> object:
        if value is None or value == "":
            return {}
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
            except json.JSONDecodeError as exc:
                raise ValueError("DATA_ENCRYPTION_KEYRING must be valid JSON") from exc
            if not isinstance(parsed, dict):
                raise ValueError("DATA_ENCRYPTION_KEYRING must be a JSON object")
            return parsed
        return value

    @model_validator(mode="after")
    def _check_cross_field_invariants(self) -> Settings:
        problems: list[str] = []

        normalized_encryption = {
            kid.strip(): secret
            for kid, secret in self.data_encryption_keyring.items()
            if str(kid).strip()
        }
        if len(normalized_encryption) != len(self.data_encryption_keyring):
            problems.append("DATA_ENCRYPTION_KEYRING cannot contain empty key IDs.")
        self.data_encryption_keyring = normalized_encryption
        if self.data_encryption_keyring:
            if not self.data_encryption_active_kid or self.data_encryption_active_kid not in self.data_encryption_keyring:
                problems.append("DATA_ENCRYPTION_ACTIVE_KID must identify a key in DATA_ENCRYPTION_KEYRING.")
            else:
                import base64
                for kid, secret in self.data_encryption_keyring.items():
                    try:
                        decoded = base64.urlsafe_b64decode(secret.get_secret_value())
                    except Exception:
                        problems.append(f"DATA_ENCRYPTION_KEYRING key '{kid}' must be URL-safe base64.")
                        continue
                    if len(decoded) != 32:
                        problems.append(f"DATA_ENCRYPTION_KEYRING key '{kid}' must decode to 32 bytes.")
        elif self.data_encryption_active_kid:
            problems.append("DATA_ENCRYPTION_ACTIVE_KID requires DATA_ENCRYPTION_KEYRING.")
        if self.is_production and not self.data_encryption_keyring:
            problems.append("DATA_ENCRYPTION_KEYRING and DATA_ENCRYPTION_ACTIVE_KID are required in production.")

        if self.jwt_algorithm not in {"HS256", "HS384", "HS512"}:
            problems.append(
                "JWT_ALGORITHM must be one of HS256, HS384, or HS512. "
                "Asymmetric/JWKS verification requires a dedicated issuer integration."
            )
        normalized_keyring = {kid.strip(): secret for kid, secret in self.jwt_keyring.items() if kid.strip()}
        if len(normalized_keyring) != len(self.jwt_keyring):
            problems.append("JWT_KEYRING cannot contain empty key IDs.")
        self.jwt_keyring = normalized_keyring
        if self.jwt_keyring:
            if not self.jwt_active_kid or self.jwt_active_kid not in self.jwt_keyring:
                problems.append("JWT_ACTIVE_KID must identify a key in JWT_KEYRING.")
            for kid, secret in self.jwt_keyring.items():
                if len(secret.get_secret_value()) < 32:
                    problems.append(f"JWT_KEYRING key '{kid}' must be at least 32 characters.")
        elif self.jwt_active_kid:
            problems.append("JWT_ACTIVE_KID requires JWT_KEYRING.")

        if self.is_production:
            if self.allow_header_auth:
                problems.append(
                    "ALLOW_HEADER_AUTH must be false when ENVIRONMENT=production: "
                    "header-based auth lets a caller choose their own role and tenant."
                )
            if not self.jwt_keyring:
                problems.append(
                    "JWT_KEYRING and JWT_ACTIVE_KID are required in production so signing "
                    "keys can rotate without accepting ambiguous keyless tokens."
                )
            if self.jwt_secret.get_secret_value() == INSECURE_JWT_SECRET:
                problems.append(
                    "JWT_SECRET is still the shipped default. Set a real signing key "
                    "before deploying to production."
                )
            if len(self.jwt_secret.get_secret_value()) < 32:
                problems.append(
                    "JWT_SECRET must be at least 32 characters for HS256 to be worth "
                    "anything."
                )
            if self.debug:
                problems.append("DEBUG must be false when ENVIRONMENT=production.")
            if self.log_format != "json":
                problems.append("LOG_FORMAT must be json in production for structured log ingestion.")
            if self.database_url.startswith("sqlite"):
                problems.append(
                    "DATABASE_URL must use durable PostgreSQL in production; SQLite "
                    "cannot safely coordinate multiple instances or survive ephemeral disks."
                )
            if self.report_worker_mode == "disabled":
                problems.append(
                    "REPORT_WORKER_MODE cannot be disabled in production; choose embedded "
                    "or external so queued reports are processed."
                )
            if not self.trusted_hosts or "*" in self.trusted_hosts:
                problems.append("TRUSTED_HOSTS must explicitly list production hostnames.")
            insecure_origins = [origin for origin in self.cors_origins if not origin.startswith("https://")]
            if insecure_origins:
                problems.append("Every CORS_ORIGINS entry must use https:// in production.")
        elif "null" not in self.cors_origins:


            self.cors_origins.append("null")


        if self.is_production and self.kb_enabled and self.kb_seed_mock_data:
            problems.append(
                "KB_SEED_MOCK_DATA must be false when the KB is enabled in production; "
                "production KB content must come from an approved ingestion workflow."
            )

        if self.google_api_key is None and self.environment != "development":
            problems.append(
                "GOOGLE_API_KEY is required outside development — without it every "
                "/chat request fails at runtime."
            )

        if self.adapter_backend == "erp_http" and self.erp_api_key is None:
            problems.append(
                "ERP_API_KEY is required when ADAPTER_BACKEND=erp_http."
            )

        parsed_database = urlparse(self.database_url.replace("postgresql+psycopg", "postgresql", 1))
        if self.is_production and parsed_database.scheme.startswith("postgres") and not parsed_database.hostname:
            problems.append("DATABASE_URL is not a valid PostgreSQL URL.")

        if problems:
            raise ValueError(
                "Invalid configuration:\n  - " + "\n  - ".join(problems)
            )

        if self.google_api_key is None:
            logger.warning(
                "GOOGLE_API_KEY is not set — /chat will return 503. Every other "
                "endpoint works, because they do not call the model."
            )

        return self


    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def using_mock_data(self) -> bool:
        return self.adapter_backend == "mock"

    @property
    def llm_configured(self) -> bool:
        return self.google_api_key is not None


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    if not settings.data_encryption_keyring:
        if settings.is_production:
            # Production validation should have caught this already; refuse to
            # silently fall back to the public development key.
            raise RuntimeError(
                "DATA_ENCRYPTION_KEYRING and DATA_ENCRYPTION_ACTIVE_KID are required in production."
            )
        import logging

        from app.core.encryption import _DEV_KEY

        logging.getLogger(__name__).warning(
            "DATA_ENCRYPTION_KEYRING not configured; falling back to the public development "
            "encryption key. Data encrypted with it is NOT confidential. "
            "Set DATA_ENCRYPTION_KEYRING and DATA_ENCRYPTION_ACTIVE_KID for real deployments."
        )
        settings.data_encryption_keyring = {"dev": SecretStr(_DEV_KEY)}
        settings.data_encryption_active_kid = "dev"
    return settings

