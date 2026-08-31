
from __future__ import annotations

import logging
import time
from typing import Annotated, Any

import jwt
from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.adapters.base import BaseRonaAdapter
from app.adapters.mock_adapter import MockRonaAdapter
from app.core.config import Settings, get_settings
from app.core.enums import DataDomain, UserRole

logger = logging.getLogger(__name__)


_bearer_scheme = HTTPBearer(auto_error=False)


class AuthContext:

    def __init__(
        self,
        tenant_id: str,
        user_id: str,
        user_role: UserRole,
        granted_domains: list[DataDomain],
        denied_domains: list[DataDomain],
        auth_method: str,
    ):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.user_role = user_role
        self.granted_domains = granted_domains
        self.denied_domains = denied_domains


        self.auth_method = auth_method


_ROLE_DOMAINS: dict[UserRole, list[DataDomain]] = {
    UserRole.FACTORY_OWNER: [
        DataDomain.HR,
        DataDomain.ATTENDANCE,
        DataDomain.PRODUCTION,
        DataDomain.INVENTORY,
        DataDomain.MAINTENANCE,
        DataDomain.FINANCE,
        DataDomain.PROCUREMENT,
        DataDomain.SALES,
        DataDomain.REPORTS,
    ],
    UserRole.GENERAL_MANAGER: [
        DataDomain.HR,
        DataDomain.ATTENDANCE,
        DataDomain.PRODUCTION,
        DataDomain.INVENTORY,
        DataDomain.MAINTENANCE,
        DataDomain.FINANCE,
        DataDomain.PROCUREMENT,
        DataDomain.SALES,
        DataDomain.REPORTS,
    ],
    UserRole.PRODUCTION_MANAGER: [
        DataDomain.PRODUCTION,
        DataDomain.MAINTENANCE,
        DataDomain.REPORTS,
    ],
    UserRole.HR: [
        DataDomain.HR,
        DataDomain.ATTENDANCE,
        DataDomain.REPORTS,
    ],
    UserRole.FINANCE: [
        DataDomain.FINANCE,
        DataDomain.REPORTS,
    ],
    UserRole.WAREHOUSE: [
        DataDomain.INVENTORY,
        DataDomain.PROCUREMENT,
        DataDomain.REPORTS,
    ],
    UserRole.SAAS_ADMIN: [],  
}


def _resolve_role_domains(user_role: UserRole) -> tuple[list[DataDomain], list[DataDomain]]:
    granted = _ROLE_DOMAINS.get(user_role, [])
    denied = [d for d in DataDomain if d not in granted]
    return granted, denied


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verification_key(token: str, settings: Settings) -> str:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        logger.info("JWT header rejected: %s", type(exc).__name__)
        raise _unauthorized("Invalid authentication token") from exc

    if header.get("alg") != settings.jwt_algorithm:
        raise _unauthorized("Invalid authentication token")

    if not settings.jwt_keyring:
        return settings.jwt_secret.get_secret_value()

    kid = header.get("kid")
    if not isinstance(kid, str) or not kid.strip():
        raise _unauthorized("Authentication token is missing a key ID")
    secret = settings.jwt_keyring.get(kid)
    if secret is None:
        logger.info("JWT rejected: unknown kid")
        raise _unauthorized("Invalid authentication token")
    return secret.get_secret_value()


def _validate_claims(claims: dict[str, Any], settings: Settings) -> None:
    now = int(time.time())
    leeway = settings.jwt_leeway_seconds
    iat = claims.get("iat")
    exp = claims.get("exp")
    if isinstance(iat, bool) or not isinstance(iat, (int, float)):
        raise _unauthorized("Invalid authentication token")
    if isinstance(exp, bool) or not isinstance(exp, (int, float)):
        raise _unauthorized("Invalid authentication token")
    if iat > now + leeway:
        raise _unauthorized("Authentication token was issued in the future")
    if exp <= iat:
        raise _unauthorized("Invalid authentication token")
    if exp - iat > settings.jwt_max_lifetime_seconds:
        raise _unauthorized("Authentication token lifetime exceeds the allowed maximum")

    for name in ("sub", "tid", "role"):
        value = claims.get(name)
        if not isinstance(value, str) or not value.strip():
            raise _unauthorized("Authentication token has invalid identity claims")


def _verify_jwt(token: str, settings: Settings) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token,
            _verification_key(token, settings),
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            leeway=settings.jwt_leeway_seconds,
            options={
                "require": ["exp", "iat", "sub", "tid", "role", "aud", "iss"],
                "verify_iat": True,
                "verify_nbf": True,
            },
        )
        _validate_claims(claims, settings)
        return claims
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Authentication token has expired")
    except HTTPException:
        raise
    except jwt.InvalidTokenError as exc:
        logger.info("JWT rejected: %s", type(exc).__name__)
        raise _unauthorized("Invalid authentication token") from exc



def _build_auth_context(
*, tenant_id: str, user_id: str, role_value: str, auth_method: str
) -> AuthContext:
    tenant_id = (tenant_id or "").strip()
    user_id = (user_id or "").strip()
    if not tenant_id or not user_id:
        raise _unauthorized("Authentication is missing a tenant or user identifier")

    try:
        user_role = UserRole(role_value.strip().lower())
    except ValueError:


        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unrecognised role: {role_value}",
        )


    if user_role == UserRole.SAAS_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SAAS_ADMIN is not authorized to access operational factory data",
        )

    granted, denied = _resolve_role_domains(user_role)
    return AuthContext(
        tenant_id=tenant_id,
        user_id=user_id,
        user_role=user_role,
        granted_domains=granted,
        denied_domains=denied,
        auth_method=auth_method,
    )


async def get_auth_context(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    x_tenant_id: Annotated[str | None, Header(alias="X-Tenant-ID")] = None,
    x_user_id: Annotated[str | None, Header(alias="X-User-ID")] = None,
    x_user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
) -> AuthContext:
    settings = get_settings()

    if credentials is not None and credentials.scheme.lower() == "bearer":
        claims = _verify_jwt(credentials.credentials, settings)
        tenant_from_token = str(claims["tid"])


        if x_tenant_id is not None and x_tenant_id.strip() and x_tenant_id.strip() != tenant_from_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Token tenant does not match the requested tenant",
            )

        ctx = _build_auth_context(
            tenant_id=tenant_from_token,
            user_id=str(claims["sub"]),
            role_value=str(claims["role"]),
            auth_method="jwt",
        )
        _stash_identity(request, ctx)
        return ctx


    if not settings.allow_header_auth:
        raise _unauthorized("Authentication required: provide a Bearer token")

    if not x_tenant_id or not x_user_id or not x_user_role:
        raise _unauthorized(
            "Missing credentials: provide a Bearer token, or the "
            "X-Tenant-ID / X-User-ID / X-User-Role headers in development"
        )

    ctx = _build_auth_context(
        tenant_id=x_tenant_id,
        user_id=x_user_id,
        role_value=x_user_role,
        auth_method="header",
    )
    _stash_identity(request, ctx)
    return ctx


def _stash_identity(request: Request, ctx: AuthContext) -> None:
    request.state.tenant_id = ctx.tenant_id
    request.state.user_id = ctx.user_id
    request.state.user_role = ctx.user_role.value
    request.state.auth_method = ctx.auth_method


AuthContextDep = Annotated[AuthContext, Depends(get_auth_context)]


_adapter_cache: dict[str, BaseRonaAdapter] = {}


async def get_adapter() -> BaseRonaAdapter:
    settings = get_settings()
    backend = settings.adapter_backend

    cached = _adapter_cache.get(backend)
    if cached is not None:
        return cached

    if backend == "mock":
        adapter: BaseRonaAdapter = MockRonaAdapter()
    elif backend == "erp_http":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="ERP HTTP adapter is not yet implemented",
        )
    else:  
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unknown adapter backend: {backend}",
        )

    _adapter_cache[backend] = adapter
    return adapter


AdapterDep = Annotated[BaseRonaAdapter, Depends(get_adapter)]


def reset_adapter_cache() -> None:
    _adapter_cache.clear()


async def validate_tenant_exists(auth: AuthContext, adapter: BaseRonaAdapter) -> str:
    tenant_name = await adapter.fetch_tenant_name(auth.tenant_id)
    if tenant_name is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant not found: {auth.tenant_id}",
        )
    return tenant_name
