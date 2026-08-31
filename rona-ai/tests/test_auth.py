
from __future__ import annotations

import time

import jwt
import pytest
from pydantic import SecretStr

_PROTECTED = "/api/v1/summary"


def test_valid_jwt_is_accepted(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(role="factory_owner"))
    assert r.status_code == 200


def test_dev_header_auth_is_accepted_in_development(client, header_auth):
    r = client.get(_PROTECTED, headers=header_auth(role="factory_owner"))
    assert r.status_code == 200
    assert r.json()["source_system"] == "mock"


def test_no_credentials_is_401_with_challenge(client):
    r = client.get(_PROTECTED)
    assert r.status_code == 401
    assert r.headers.get("WWW-Authenticate") == "Bearer"
    body = r.json()
    assert body["error"] == "unauthorized"
    assert body["request_id"]  


def test_expired_token_is_rejected(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(exp_delta=-3600))
    assert r.status_code == 401


def test_bad_signature_is_rejected(client, mint_token, settings):

    now = int(time.time())
    forged = jwt.encode(
        {
            "tid": "demo_factory", "sub": "u-1", "role": "factory_owner",
            "aud": settings.jwt_audience, "iss": settings.jwt_issuer,
            "iat": now, "exp": now + 3600,
        },
        "totally-the-wrong-signing-key-0123456789",
        algorithm="HS256",
    )
    r = client.get(_PROTECTED, headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


def test_wrong_audience_is_rejected(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(aud="some-other-service"))
    assert r.status_code == 401


def test_wrong_issuer_is_rejected(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(iss="not-the-erp"))
    assert r.status_code == 401


def test_missing_required_claim_is_rejected(client, bearer):

    r = client.get(_PROTECTED, headers=bearer(role=None))
    assert r.status_code == 401


def test_saas_admin_is_forbidden_from_operational_data(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(role="saas_admin"))
    assert r.status_code == 403


def test_unrecognised_role_is_forbidden(client, bearer):
    r = client.get(_PROTECTED, headers=bearer(role="chief_wizard"))
    assert r.status_code == 403


def test_token_tenant_cannot_be_overridden_by_header(client, mint_token):


    token = mint_token(role="factory_owner", tid="demo_factory")
    r = client.get(
        _PROTECTED,
        headers={"Authorization": f"Bearer {token}", "X-Tenant-ID": "acme_mfg"},
    )
    assert r.status_code == 403


def test_matching_tenant_header_is_allowed(client, mint_token):

    token = mint_token(role="factory_owner", tid="demo_factory")
    r = client.get(
        _PROTECTED,
        headers={"Authorization": f"Bearer {token}", "X-Tenant-ID": "demo_factory"},
    )
    assert r.status_code == 200


def test_header_auth_refused_when_disabled(client, header_auth, settings, monkeypatch):


    monkeypatch.setattr(settings, "allow_header_auth", False)
    r = client.get(_PROTECTED, headers=header_auth(role="factory_owner"))
    assert r.status_code == 401
    assert r.headers.get("WWW-Authenticate") == "Bearer"


@pytest.mark.parametrize(
    "role, expect_granted, expect_denied",
    [
        ("hr", {"hr", "attendance", "reports"}, {"finance", "production", "inventory"}),
        ("finance", {"finance", "reports"}, {"hr", "production", "sales"}),
        ("warehouse", {"inventory", "procurement", "reports"}, {"finance", "hr", "production"}),
        ("production_manager", {"production", "maintenance", "reports"}, {"finance", "hr", "sales"}),
    ],
)
def test_role_is_scoped_to_its_domains(client, bearer, role, expect_granted, expect_denied):
    r = client.get(_PROTECTED, headers=bearer(role=role))
    assert r.status_code == 200
    body = r.json()
    granted = set(body["granted_domains"])
    denied = set(body["denied_domains"])

    assert expect_granted <= granted
    assert expect_denied <= denied
    assert not (granted & denied)  


    metric_domains = {g["domain"] for g in body["metrics"]}
    assert metric_domains <= granted
    assert not (metric_domains & expect_denied)


def test_rotation_accepts_current_and_previous_keys(client, mint_token, settings, monkeypatch):
    current = "current-signing-key-that-is-at-least-32-characters"
    previous = "previous-signing-key-that-is-at-least-32-characters"
    # Mirror Settings parsing: runtime key-ring entries are SecretStr values so
    # test setup exercises the same path used by environment configuration.
    monkeypatch.setattr(
        settings,
        "jwt_keyring",
        {"current": SecretStr(current), "previous": SecretStr(previous)},
    )
    monkeypatch.setattr(settings, "jwt_active_kid", "current")

    for kid, key in (("current", current), ("previous", previous)):
        token = mint_token(kid=kid, signing_key=key)
        response = client.get(_PROTECTED, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200


def test_rotation_rejects_missing_unknown_and_retired_key_ids(client, mint_token, settings, monkeypatch):
    current = "current-signing-key-that-is-at-least-32-characters"
    previous = "previous-signing-key-that-is-at-least-32-characters"
    monkeypatch.setattr(settings, "jwt_keyring", {"current": SecretStr(current)})
    monkeypatch.setattr(settings, "jwt_active_kid", "current")

    tokens = (
        mint_token(signing_key=current),
        mint_token(kid="unknown", signing_key=current),
        mint_token(kid="previous", signing_key=previous),
    )
    for token in tokens:
        response = client.get(_PROTECTED, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


def test_future_issued_token_is_rejected(client, bearer):
    future = int(time.time()) + 300
    response = client.get(_PROTECTED, headers=bearer(iat=future, exp=future + 300))
    assert response.status_code == 401


def test_not_before_is_enforced(client, bearer):
    response = client.get(_PROTECTED, headers=bearer(nbf=int(time.time()) + 300))
    assert response.status_code == 401


def test_excessive_token_lifetime_is_rejected(client, bearer, settings, monkeypatch):
    monkeypatch.setattr(settings, "jwt_max_lifetime_seconds", 300)
    response = client.get(_PROTECTED, headers=bearer(exp_delta=301))
    assert response.status_code == 401


@pytest.mark.parametrize("claim,value", [("sub", " "), ("tid", ""), ("role", " ")])
def test_blank_identity_claims_are_rejected(client, bearer, claim, value):
    response = client.get(_PROTECTED, headers=bearer(**{claim: value}))
    assert response.status_code == 401
