
from __future__ import annotations

import time

import jwt
import pytest
from fastapi.testclient import TestClient

import main
from app.api.dependencies import reset_adapter_cache
from app.core.config import get_settings
from app.core.database import reset_database_state
from app.services.knowledge_base import reset_knowledge_base
from app.services.report_storage import reset_report_storage


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture(autouse=True)
def _isolate_process_state(tmp_path, settings):
    original_database_url = settings.database_url
    original_report_output_dir = settings.report_output_dir
    original_worker_mode = settings.report_worker_mode
    original_ai_limit_enabled = settings.ai_limit_enabled
    settings.database_url = f"sqlite:///{(tmp_path / 'rona-test.db').as_posix()}"
    settings.report_output_dir = str(tmp_path / "reports")
    settings.report_worker_mode = "disabled"
    settings.ai_limit_enabled = False
    reset_adapter_cache()
    reset_database_state()
    reset_knowledge_base()
    reset_report_storage()
    yield
    reset_adapter_cache()
    reset_database_state()
    reset_knowledge_base()
    reset_report_storage()
    settings.database_url = original_database_url
    settings.report_output_dir = original_report_output_dir
    settings.report_worker_mode = original_worker_mode
    settings.ai_limit_enabled = original_ai_limit_enabled


@pytest.fixture
def client():


    with TestClient(main.app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def mint_token(settings):

    def _mint(
        role="factory_owner",
        tid="demo_factory",
        sub="u-1",
        *,
        exp_delta=3600,
        signing_key=None,
        algorithm=None,
        kid=None,
        **claims,
    ):
        now = int(time.time())
        payload = {
            "tid": tid,
            "sub": sub,
            "role": role,
            "aud": settings.jwt_audience,
            "iss": settings.jwt_issuer,
            "iat": now,
            "exp": now + exp_delta,
        }
        payload.update(claims)
        payload = {k: v for k, v in payload.items() if v is not None}
        headers = {"kid": kid} if kid is not None else None
        return jwt.encode(
            payload,
            signing_key or settings.jwt_secret.get_secret_value(),
            algorithm=algorithm or settings.jwt_algorithm,
            headers=headers,
        )

    return _mint


@pytest.fixture
def bearer(mint_token):

    def _hdr(role="factory_owner", tid="demo_factory", sub="u-1", **kw):
        return {"Authorization": f"Bearer {mint_token(role=role, tid=tid, sub=sub, **kw)}"}

    return _hdr


@pytest.fixture
def header_auth():

    def _hdr(role="factory_owner", tid="demo_factory", sub="u-1"):
        return {"X-Tenant-ID": tid, "X-User-ID": sub, "X-User-Role": role}

    return _hdr


@pytest.fixture
def stub_llm(monkeypatch):
    from app.core.enums import DataDomain
    from app.schemas import RonaAIResponse, SupportingMetric

    captured: dict = {}

    class _FakeLLM:
        async def generate_response(self, question, bundle):
            captured["question"] = question
            captured["bundle"] = bundle
            loaded = bundle.loaded_domains()
            return RonaAIResponse(
                answer="Stubbed answer.",
                supporting_data=[SupportingMetric(label="Efficiency", value="88%")],
                recommendation="Reassign operators to Line 2.",
                source=loaded[:1] or [DataDomain.PRODUCTION],
                data_available=True,
            )


    import importlib

    chat_module = importlib.import_module("app.api.routes.chat")
    monkeypatch.setattr(chat_module, "get_llm_service", lambda: _FakeLLM())
    return captured
