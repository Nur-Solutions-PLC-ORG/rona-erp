"""Gemini transport: client creation, generation config, retries, parsing.

Isolated from prompt building and sanitizing so retry and timeout behaviour
can be tested without constructing a context bundle.
"""

from __future__ import annotations

import asyncio
import logging

from google import genai
from google.genai import errors as genai_errors, types

from app.core.config import Settings
from app.schemas import RonaAIResponse
from app.services.llm.errors import (
    LLMNotConfiguredError,
    LLMQuotaError,
    LLMResponseError,
    LLMTimeoutError,
    is_quota_error,
    is_retryable,
    retry_after_seconds,
)
from app.services.llm.instructions import SYSTEM_INSTRUCTION

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
RETRY_BASE_DELAY_SECONDS = 0.5

# Model families that support a thinking budget.
_THINKING_MODEL_MARKERS = ("2.5", "3")


class GeminiClient:
    """Thin wrapper around the Gemini SDK with retries and error mapping."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client: genai.Client | None = None

    @property
    def client(self) -> genai.Client:
        if self._client is None:
            api_key = self._settings.google_api_key
            if api_key is None:
                raise LLMNotConfiguredError("GOOGLE_API_KEY is not set")
            self._client = genai.Client(api_key=api_key.get_secret_value())
        return self._client

    def generation_config(self) -> types.GenerateContentConfig:
        config = types.GenerateContentConfig(
            temperature=self._settings.gemini_temperature,
            max_output_tokens=self._settings.gemini_max_output_tokens,
            response_mime_type="application/json",
            response_json_schema=RonaAIResponse.model_json_schema(),
            system_instruction=SYSTEM_INSTRUCTION,
        )
        if any(marker in self._settings.gemini_model for marker in _THINKING_MODEL_MARKERS):
            config.thinking_config = types.ThinkingConfig(
                thinking_budget=self._settings.gemini_thinking_budget
            )
        return config

    async def generate(self, prompt: str, *, tenant_id: str) -> RonaAIResponse:
        config = self.generation_config()
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                response = await asyncio.wait_for(
                    self.client.aio.models.generate_content(
                        model=self._settings.gemini_model,
                        contents=prompt,
                        config=config,
                    ),
                    timeout=self._settings.gemini_timeout_seconds,
                )
                return parse_response(response)
            except LLMNotConfiguredError:
                raise
            except genai_errors.ClientError as exc:
                raise self._client_error(exc, tenant_id) from exc
            except asyncio.TimeoutError as exc:
                if attempt < MAX_ATTEMPTS:
                    await self._backoff(attempt, tenant_id, "timed out")
                    continue
                logger.warning("LLM call timed out", extra={"tenant_id": tenant_id})
                raise LLMTimeoutError(
                    f"Gemini did not respond within {self._settings.gemini_timeout_seconds}s"
                ) from exc
            except Exception as exc:
                if attempt < MAX_ATTEMPTS and is_retryable(exc):
                    await self._backoff(attempt, tenant_id, "transient failure")
                    continue
                logger.exception("LLM call failed", extra={"tenant_id": tenant_id})
                raise LLMResponseError("Gemini request failed") from exc

        raise LLMResponseError("Gemini request failed after retries")

    async def _backoff(self, attempt: int, tenant_id: str, reason: str) -> None:
        delay = RETRY_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
        logger.warning(
            "LLM %s (attempt %d/%d), retrying in %.1fs",
            reason,
            attempt,
            MAX_ATTEMPTS,
            delay,
            extra={"tenant_id": tenant_id},
        )
        await asyncio.sleep(delay)

    def _client_error(self, exc: Exception, tenant_id: str) -> Exception:
        if is_quota_error(exc):
            retry_after = retry_after_seconds(exc)
            logger.warning(
                "Gemini quota exhausted",
                extra={
                    "tenant_id": tenant_id,
                    "model": self._settings.gemini_model,
                    "retry_after_seconds": retry_after,
                },
            )
            return LLMQuotaError(
                "Gemini request quota has been exhausted",
                retry_after_seconds=retry_after,
            )
        logger.exception("Gemini client request failed", extra={"tenant_id": tenant_id})
        return LLMResponseError("Gemini request failed")


def parse_response(response: object) -> RonaAIResponse:
    
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, RonaAIResponse):
        return parsed

    text = getattr(response, "text", None)
    if text:
        try:
            return RonaAIResponse.model_validate_json(text)
        except Exception as exc:
            raise LLMResponseError("Model output did not match the response schema") from exc

    raise LLMResponseError("Model returned an empty response")


__all__ = ["GeminiClient", "parse_response", "MAX_ATTEMPTS", "RETRY_BASE_DELAY_SECONDS"]
