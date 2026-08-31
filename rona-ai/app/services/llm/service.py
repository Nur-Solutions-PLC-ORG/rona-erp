"""LLMService: builds the prompt, calls Gemini, sanitizes the answer."""

from __future__ import annotations

import logging
import time
from contextvars import ContextVar

from app.core.config import get_settings
from app.schemas import RonaAIResponse, RonaContextBundle
from app.services.knowledge_base import KnowledgeBaseService, get_knowledge_base
from app.services.llm.client import GeminiClient
from app.services.llm.prompt import CitationRecord, build_prompt
from app.services.llm.sanitizer import sanitize_response

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, knowledge_base: KnowledgeBaseService | None = None) -> None:
        self.settings = get_settings()
        self._kb = knowledge_base or get_knowledge_base()
        self._client = GeminiClient(self.settings)

        self._kb_citations: ContextVar[tuple[CitationRecord, ...]] = ContextVar(
            "kb_citations", default=()
        )

    @property
    def client(self):
        return self._client.client

    @property
    def last_kb_citations(self) -> list[dict[str, object]]:
        """KB references supplied to the model for the current request."""
        return [dict(record) for record in self._kb_citations.get()]

    async def generate_response(
        self, question: str, bundle: RonaContextBundle
    ) -> RonaAIResponse:
        prompt, allowed_citations = await build_prompt(
            question, bundle, kb=self._kb, settings=self.settings
        )
        self._kb_citations.set(allowed_citations)

        started = time.perf_counter()
        response = await self._client.generate(prompt, tenant_id=bundle.tenant_id)
        logger.info(
            "LLM response generated",
            extra={
                "tenant_id": bundle.tenant_id,
                "user_role": bundle.user_role.value,
                "model": self.settings.gemini_model,
                "elapsed_s": round(time.perf_counter() - started, 2),
            },
        )
        return sanitize_response(response, bundle, allowed_citations)


_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


__all__ = ["LLMService", "get_llm_service"]
