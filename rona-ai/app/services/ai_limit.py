from __future__ import annotations

import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)

DAILY_SECONDS = 24 * 60 * 60

_client: httpx.AsyncClient | None = None


class _UpstashUnavailable(Exception):
        pass 


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=5.0)
    return _client


async def _command(*args: str) -> object:
    settings = get_settings()
    if not settings.upstash_redis_rest_url or not settings.upstash_redis_rest_token:
        raise _UpstashUnavailable("Upstash Redis REST credentials are not configured")

    headers = {"Authorization": f"Bearer {settings.upstash_redis_rest_token.get_secret_value()}"}
    try:
        response = await _get_client().post(
            settings.upstash_redis_rest_url.rstrip("/"),
            headers=headers,
            json=list(args),
        )
        response.raise_for_status()
        payload = response.json()
    except httpx.HTTPError as exc:
        raise _UpstashUnavailable(f"Upstash Redis REST request failed: {exc}") from exc
    except ValueError as exc:
        raise _UpstashUnavailable(f"Upstash Redis REST returned invalid JSON: {exc}") from exc
    if payload.get("error"):
        raise _UpstashUnavailable(payload["error"])
    return payload.get("result")


def _key(company_id: str) -> str:
    return f"rona:ai:limit:{company_id}"


async def create_company_limit(company_id: str, limit: int | None = None) -> None:
    settings = get_settings()
    if not settings.ai_limit_enabled:
        return
    try:
        await _command(
            "SET", _key(company_id), str(limit or settings.ai_daily_limit), "NX", "EX", str(DAILY_SECONDS)
        )
    except _UpstashUnavailable as exc:
        logger.warning("create_company_limit skipped (limiter unavailable): %s", exc)


async def consume_ai_request(company_id: str) -> None:
    settings = get_settings()
    if not settings.ai_limit_enabled:
        return
    script = """
    local current = redis.call('GET', KEYS[1])
    if not current then
      redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
      current = ARGV[1]
    end
    if tonumber(current) <= 0 then return -1 end
    return redis.call('DECR', KEYS[1])
    """
    try:
        remaining = await _command(
            "EVAL", script, "1", _key(company_id), str(settings.ai_daily_limit), str(DAILY_SECONDS)
        )
    except _UpstashUnavailable as exc:
        # Fail open: an Upstash outage must not turn every /chat request into a 500.
        logger.warning("AI limiter unavailable, allowing request: %s", exc)
        return
    if int(remaining) < 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Company AI daily limit reached",
            headers={"Retry-After": str(await _safe_ttl(company_id))},
        )


async def _ttl(company_id: str) -> int:
    ttl = await _command("TTL", _key(company_id))
    return max(1, int(ttl)) if int(ttl) >= 0 else DAILY_SECONDS


async def _safe_ttl(company_id: str) -> int:
    """TTL lookup that never fails the enclosing request."""
    try:
        return await _ttl(company_id)
    except (_UpstashUnavailable, TypeError, ValueError) as exc:
        logger.warning("AI limiter TTL lookup failed, using default window: %s", exc)
        return DAILY_SECONDS


async def get_company_limit_ttl(company_id: str) -> int:
    """Return remaining seconds in the company's current 24-hour window."""
    if not get_settings().ai_limit_enabled:
        return 0
    return await _safe_ttl(company_id)


async def reset_company_limit(company_id: str) -> None:
    """Delete a company's quota key for support or administrative reset."""
    if not get_settings().ai_limit_enabled:
        return
    try:
        await _command("DEL", _key(company_id))
    except _UpstashUnavailable as exc:
        logger.warning("reset_company_limit skipped (limiter unavailable): %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The rate limiter is temporarily unavailable; try again shortly",
        ) from exc


async def close_limiter_client() -> None:
    """Close the shared httpx client (call on application shutdown)."""
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
    _client = None
