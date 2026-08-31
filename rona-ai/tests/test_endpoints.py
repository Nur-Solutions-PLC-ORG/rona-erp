
from __future__ import annotations

import asyncio
from datetime import date, datetime, timedelta, timezone

from app.api.periods import period_from_question as _period_from_question
from app.services.llm.errors import LLMQuotaError, retry_after_seconds
from app.workers.report_worker import process_one

_CHAT = "/api/v1/chat"
_SUMMARY = "/api/v1/summary"
_EXPORT = "/api/v1/reports/export"


def test_health_ok(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["adapter_backend"] == "mock"
    assert r.headers.get("X-Request-ID")


def test_root_banner(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["health"] == "/api/v1/health"


def test_incoming_request_id_is_echoed(client):
    r = client.get("/api/v1/health", headers={"X-Request-ID": "trace-xyz-001"})
    assert r.headers.get("X-Request-ID") == "trace-xyz-001"


def test_request_id_generated_when_absent(client):
    r = client.get("/api/v1/health")
    assert r.headers.get("X-Request-ID")  


def test_natural_language_periods():
    today = date(2026, 8, 18)

    assert _period_from_question("What is attendance today?", today).start == today
    yesterday = _period_from_question("What is attendance yesterday?", today)
    assert yesterday.start == date(2026, 8, 17)
    comparison = _period_from_question(
        "What is today's attendance rate compared to yesterday?", today
    )
    assert comparison.start == today
    assert comparison.previous_start == date(2026, 8, 17)
    assert _period_from_question("Show this week attendance", today).day_count == 7
    assert _period_from_question("Generate a weekly report", today).end == today
    last_week = _period_from_question("Show last week attendance", today)
    assert last_week.end == date(2026, 8, 11)


def test_natural_language_periods_ignore_unrelated_questions():
    assert _period_from_question("What is the attendance rate?", date(2026, 8, 18)) is None


def test_gemini_retry_delay_is_parsed():
    error = RuntimeError("Please retry in 54.578207085s. retryDelay: 54s")
    assert retry_after_seconds(error) == 54


def test_chat_happy_path(client, header_auth, stub_llm):
    r = client.post(_CHAT, headers=header_auth(role="factory_owner"), json={"question": "How is production today?"})
    assert r.status_code == 200
    body = r.json()
    assert body["data_available"] is True
    assert body["answer"] == "Stubbed answer."
    assert body["source"]  
    assert body["source_domains"]
    assert body["source_system"] == "mock"

    assert stub_llm["question"] == "How is production today?"


def test_chat_uses_yesterday_period(client, header_auth, stub_llm):
    r = client.post(
        _CHAT,
        headers=header_auth(role="hr"),
        json={"question": "What is the attendance rate of yesterday?"},
    )
    assert r.status_code == 200
    yesterday = datetime.now(timezone.utc).date() - timedelta(days=1)
    bundle = stub_llm["bundle"]
    assert bundle.period.start == yesterday
    assert bundle.period.end == yesterday
    assert r.json()["period_label"] == yesterday.strftime("%d %b %Y")


def test_chat_today_compared_to_yesterday_uses_today_period(client, header_auth, stub_llm):
    r = client.post(
        _CHAT,
        headers=header_auth(role="hr"),
        json={"question": "What is today's attendance rate compared to yesterday?"},
    )
    assert r.status_code == 200
    today = datetime.now(timezone.utc).date()
    bundle = stub_llm["bundle"]
    assert bundle.period.start == today
    assert bundle.period.previous_start == today - timedelta(days=1)
    assert r.json()["period_label"] == today.strftime("%d %b %Y")


def test_chat_yesterday_critical_conditions_load_period_alerts(client, header_auth, stub_llm):
    r = client.post(
        _CHAT,
        headers=header_auth(role="factory_owner"),
        json={"question": "Give me yesterday's critical conditions"},
    )
    assert r.status_code == 200
    yesterday = datetime.now(timezone.utc).date() - timedelta(days=1)
    bundle = stub_llm["bundle"]
    assert bundle.period.end == yesterday
    assert bundle.alerts
    assert all(alert.detected_at.date() == yesterday for alert in bundle.alerts)


def test_chat_uses_selected_response_language(client, header_auth, stub_llm):
    r = client.post(
        _CHAT,
        headers=header_auth(role="hr"),
        json={"question": "What is the attendance rate?", "language": "am"},
    )
    assert r.status_code == 200
    assert stub_llm["bundle"].language.value == "am"


def test_chat_explicit_period_overrides_question(client, header_auth, stub_llm):
    r = client.post(
        _CHAT,
        headers=header_auth(role="hr"),
        json={
            "question": "What was the attendance rate yesterday?",
            "period_start": "2026-08-01",
            "period_end": "2026-08-07",
        },
    )
    assert r.status_code == 200
    bundle = stub_llm["bundle"]
    assert bundle.period.start == date(2026, 8, 1)
    assert bundle.period.end == date(2026, 8, 7)


def test_chat_returns_429_when_gemini_quota_is_exhausted(client, header_auth, monkeypatch):
    class _QuotaLLM:
        async def generate_response(self, question, bundle):
            raise LLMQuotaError("quota exhausted", retry_after_seconds=54)

    import importlib

    chat_module = importlib.import_module("app.api.routes.chat")
    monkeypatch.setattr(chat_module, "get_llm_service", lambda: _QuotaLLM())
    r = client.post(_CHAT, headers=header_auth(role="hr"), json={"question": "attendance today"})

    assert r.status_code == 429
    assert r.headers["Retry-After"] == "54"
    assert r.json()["error"] == "error"
    assert "quota" in r.json()["detail"].lower()


def test_chat_only_sees_granted_domains(client, header_auth, stub_llm):

    r = client.post(_CHAT, headers=header_auth(role="hr"), json={"question": "anything"})
    assert r.status_code == 200
    bundle = stub_llm["bundle"]
    assert bundle.finance is None
    assert bundle.production is None
    assert bundle.hr is not None


def test_chat_rejects_empty_body(client, header_auth):
    r = client.post(_CHAT, headers=header_auth(role="factory_owner"), json={})
    assert r.status_code == 422
    body = r.json()
    assert body["error"] == "validation_error"
    assert body["request_id"]


def test_chat_requires_auth(client):
    r = client.post(_CHAT, json={"question": "hi"})
    assert r.status_code == 401

def test_summary_happy_path(client, header_auth):
    r = client.get(_SUMMARY, headers=header_auth(role="factory_owner"))
    assert r.status_code == 200
    body = r.json()
    assert body["tenant_name"] == "Rona Demo Factory"
    assert body["greeting"]
    assert len(body["metrics"]) >= 1
    assert "generated_at" in body


def test_multiple_companies_receive_their_own_identity_and_data(client, header_auth):
    """The authenticated tenant claim selects one isolated company context."""
    demo = client.get(
        _SUMMARY,
        headers=header_auth(role="factory_owner", tid="demo_factory", sub="demo-owner"),
    )
    acme = client.get(
        _SUMMARY,
        headers=header_auth(role="factory_owner", tid="acme_mfg", sub="acme-owner"),
    )

    assert demo.status_code == 200
    assert acme.status_code == 200
    assert demo.json()["tenant_id"] == "demo_factory"
    assert demo.json()["tenant_name"] == "Rona Demo Factory"
    assert acme.json()["tenant_id"] == "acme_mfg"
    assert acme.json()["tenant_name"] == "ACME Manufacturing"
    # Mock values are deterministically seeded with tenant_id, so one company's
    # operational snapshot cannot accidentally be reused for another company.
    assert demo.json()["metrics"] != acme.json()["metrics"]


def test_chat_passes_only_the_authenticated_company_to_the_llm(
    client, header_auth, stub_llm
):
    response = client.post(
        _CHAT,
        headers=header_auth(role="factory_owner", tid="tech_prod", sub="tech-owner"),
        json={"question": "How is production today?"},
    )

    assert response.status_code == 200
    bundle = stub_llm["bundle"]
    assert bundle.tenant_id == "tech_prod"
    assert bundle.tenant_name == "Tech Production Ltd"
    assert response.json()["tenant_id"] == "tech_prod"


def test_summary_unknown_tenant_is_404(client, header_auth):
    r = client.get(_SUMMARY, headers=header_auth(role="factory_owner", tid="ghost_co"))
    assert r.status_code == 404
    body = r.json()
    assert body["error"] == "not_found"
    assert body["request_id"]


def _complete_report(client, export, headers):
    assert export.status_code == 202
    queued = export.json()
    assert queued["status"] == "pending"
    assert queued["download_url"] is None

    assert asyncio.run(process_one()) is True
    status = client.get(f"/api/v1/reports/{queued['report_id']}", headers=headers)
    assert status.status_code == 200
    ready = status.json()
    assert ready["status"] == "ready"
    assert ready["byte_size"] > 0
    assert ready["download_url"]
    return ready


def test_report_export_and_download_roundtrip(client, header_auth):
    headers = header_auth(role="factory_owner")
    export = client.post(
        _EXPORT,
        headers=headers,
        json={"report_type": "management_summary", "export_format": "json"},
    )
    body = _complete_report(client, export, headers)

    got = client.get(body["download_url"], headers=headers)
    assert got.status_code == 200
    assert got.headers["content-type"].startswith("application/json")


def test_report_export_pdf_content_type(client, header_auth):
    headers = header_auth(role="factory_owner")
    export = client.post(
        _EXPORT,
        headers=headers,
        json={"report_type": "production", "export_format": "pdf"},
    )
    body = _complete_report(client, export, headers)
    got = client.get(body["download_url"], headers=headers)
    assert got.status_code == 200
    assert got.headers["content-type"] == "application/pdf"


def test_report_export_enforces_rbac(client, header_auth):

    r = client.post(
        _EXPORT,
        headers=header_auth(role="hr"),
        json={"report_type": "finance", "export_format": "json"},
    )
    assert r.status_code == 403


def test_report_download_is_tenant_scoped(client, header_auth):
    owner_headers = header_auth(role="factory_owner", tid="demo_factory")
    export = client.post(
        _EXPORT,
        headers=owner_headers,
        json={"report_type": "management_summary", "export_format": "json"},
    )
    ready = _complete_report(client, export, owner_headers)


    poached_status = client.get(
        f"/api/v1/reports/{ready['report_id']}",
        headers=header_auth(role="factory_owner", tid="acme_mfg"),
    )
    assert poached_status.status_code == 404
    poached = client.get(
        ready["download_url"],
        headers=header_auth(role="factory_owner", tid="acme_mfg"),
    )
    assert poached.status_code == 404


def test_report_is_requester_scoped_within_tenant(client, header_auth):
    owner_headers = header_auth(role="factory_owner", sub="owner-1")
    export = client.post(
        _EXPORT,
        headers=owner_headers,
        json={"report_type": "management_summary", "export_format": "json"},
    )
    ready = _complete_report(client, export, owner_headers)

    other_user = header_auth(role="factory_owner", sub="owner-2")
    assert client.get(f"/api/v1/reports/{ready['report_id']}", headers=other_user).status_code == 404
    assert client.get(ready["download_url"], headers=other_user).status_code == 404


def test_report_access_is_revoked_when_role_loses_snapshot_domains(client, header_auth):
    owner_headers = header_auth(role="factory_owner", sub="role-change-user")
    export = client.post(
        _EXPORT,
        headers=owner_headers,
        json={"report_type": "finance", "export_format": "json"},
    )
    ready = _complete_report(client, export, owner_headers)

    downgraded = header_auth(role="hr", sub="role-change-user")
    assert client.get(f"/api/v1/reports/{ready['report_id']}", headers=downgraded).status_code == 404
    assert client.get(ready["download_url"], headers=downgraded).status_code == 404



def test_report_download_unknown_id_is_404(client, header_auth):
    r = client.get(
        "/api/v1/reports/RPT-does-not-exist/download",
        headers=header_auth(role="factory_owner"),
    )
    assert r.status_code == 404
