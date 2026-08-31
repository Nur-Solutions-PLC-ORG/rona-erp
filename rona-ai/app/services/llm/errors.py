from __future__ import annotations

import asyncio
import re

from google.genai import errors as genai_errors


class LLMError(Exception):
    pass


class LLMNotConfiguredError(LLMError):
    pass


class LLMTimeoutError(LLMError):
    pass


class LLMQuotaError(LLMError):
    def __init__(self, message: str, retry_after_seconds: int | None = None) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class LLMResponseError(LLMError):
    pass


def is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, asyncio.TimeoutError):
        return True
    code = getattr(exc, "code", None) or getattr(exc, "status_code", None)
    if isinstance(code, int) and 500 <= code < 600:
        return True
    server_error = getattr(genai_errors, "ServerError", None)
    return server_error is not None and isinstance(exc, server_error)


def retry_after_seconds(exc: Exception) -> int | None:
    match = re.search(r"retry(?:Delay| in)[^0-9]*(\d+(?:\.\d+)?)\s*s", str(exc), re.IGNORECASE)
    if match is None:
        return None
    return max(1, int(float(match.group(1))))


def is_quota_error(exc: Exception) -> bool:
    return getattr(exc, "code", None) == 429 or getattr(exc, "status_code", None) == 429


__all__ = [
    "LLMError",
    "LLMNotConfiguredError",
    "LLMTimeoutError",
    "LLMQuotaError",
    "LLMResponseError",
    "is_retryable",
    "retry_after_seconds",
    "is_quota_error",
]
