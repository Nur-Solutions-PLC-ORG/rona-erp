from __future__ import annotations

import json
import logging
import math
import re
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone

from app.core.config import get_settings
from app.core.database import list_knowledge_documents, replace_knowledge_documents
from app.core.encryption import EncryptionError
from app.core.enums import DataDomain
from app.services.knowledge_seed import mock_knowledge_documents

logger = logging.getLogger(__name__)

_STOPWORDS = frozenset(
    {
        "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "is", "are",
        "was", "were", "be", "how", "what", "which", "who", "when", "why", "many",
        "much", "do", "does", "did", "my", "our", "we", "i", "this", "that",
    }
)
_TOKEN_RE = re.compile(r"[\w]+(?:[-'][\w]+)*", re.UNICODE)
_MAX_CHUNK_WORDS = 120


@dataclass(frozen=True)
class KBDocument:
    doc_id: str
    title: str
    content: str
    domain: DataDomain
    tenant_id: str | None = None
    category: str = "policy"
    tags: tuple[str, ...] = ()
    version: int = 1
    status: str = "approved"
    effective_from: datetime | None = None
    effective_until: datetime | None = None
    source_ref: str | None = None


@dataclass(frozen=True)
class KBChunk:
    chunk_id: str
    document: KBDocument
    section: str
    content: str
    index: int


@dataclass(frozen=True)
class KBCitation:
    document_id: str
    title: str
    version: int
    chunk_id: str
    section: str
    domain: DataDomain


@dataclass(frozen=True)
class KBSearchHit:
    chunk: KBChunk
    score: float

    @property
    def document(self) -> KBDocument:
        return self.chunk.document


class KnowledgeBaseService:

    def __init__(self) -> None:
        self.settings = get_settings()
        self._initialized = False
        self._index: tuple[list[KBChunk], list[list[str]]] | None = None

    def initialize_mock_kb(self) -> None:
        if self._initialized:
            return
        if self.settings.kb_seed_mock_data and self.settings.adapter_backend == "mock":
            replace_knowledge_documents(mock_knowledge_documents())
            self._index = None
            logger.info("Seeded mock knowledge base")
        self._initialized = True

    def invalidate_index(self) -> None:
        self._index = None

    @staticmethod
    def _load_documents() -> list[KBDocument]:
        documents: list[KBDocument] = []
        for row in list_knowledge_documents():
            try:
                tags = tuple(json.loads(row.tags_json))
                documents.append(
                    KBDocument(
                        doc_id=row.doc_id,
                        title=row.title,
                        content=row.content,
                        domain=DataDomain(row.domain),
                        tenant_id=row.tenant_id,
                        category=row.category,
                        tags=tags,
                        version=getattr(row, "version", 1),
                        status=getattr(row, "status", "approved"),
                        effective_from=getattr(row, "effective_from", None),
                        effective_until=getattr(row, "effective_until", None),
                        source_ref=getattr(row, "source_ref", None),
                    )
                )
            except (EncryptionError, ValueError, TypeError, json.JSONDecodeError):
                logger.error("Skipping invalid knowledge document", extra={"doc_id": row.doc_id})
        return documents

    @staticmethod
    def _visible_domains(domains: list[DataDomain] | None) -> set[DataDomain] | None:
        if domains is None:
            return None
        expanded = set(domains)
        if DataDomain.HR in expanded or DataDomain.ATTENDANCE in expanded:
            expanded |= {DataDomain.HR, DataDomain.ATTENDANCE}
        return expanded

    @staticmethod
    def _tokens(value: str) -> set[str]:
        return {
            token.casefold()
            for token in _TOKEN_RE.findall(value)
            if token.casefold() not in _STOPWORDS and len(token) > 2
        }

    @staticmethod
    def _chunks(document: KBDocument) -> list[KBChunk]:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n|(?<=[.!?])\s+", document.content) if p.strip()]
        chunks: list[KBChunk] = []
        current: list[str] = []
        count = 0
        index = 0
        for paragraph in paragraphs:
            words = paragraph.split()
            if current and count + len(words) > _MAX_CHUNK_WORDS:
                text = " ".join(current)
                chunks.append(KBChunk(f"{document.doc_id}-C{index + 1:03d}", document, document.title, text, index))
                index += 1
                current, count = [], 0
            current.append(paragraph)
            count += len(words)
        if current:
            chunks.append(KBChunk(f"{document.doc_id}-C{index + 1:03d}", document, document.title, " ".join(current), index))
        return chunks

    @staticmethod
    def _is_current(document: KBDocument, now: datetime) -> bool:
        if document.status != "approved":
            return False

        def comparable(value: datetime | None) -> datetime | None:
            if value is None:
                return None
            return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value

        effective_from = comparable(document.effective_from)
        effective_until = comparable(document.effective_until)
        if effective_from is not None and effective_from > now:
            return False
        if effective_until is not None and effective_until <= now:
            return False
        return True

    @staticmethod
    def _tfidf_vectors(texts: list[list[str]]) -> list[dict[str, float]]:
        document_frequency: Counter[str] = Counter()
        for tokens in texts:
            document_frequency.update(set(tokens))
        document_count = len(texts)
        vectors: list[dict[str, float]] = []
        for tokens in texts:
            counts = Counter(tokens)
            vector = {
                token: (count / len(tokens)) * math.log((document_count + 1) / (document_frequency[token] + 1)) + 1.0
                for token, count in counts.items()
            } if tokens else {}
            norm = math.sqrt(sum(value * value for value in vector.values()))
            vectors.append({token: value / norm for token, value in vector.items()} if norm else {})
        return vectors

    @staticmethod
    def _cosine_similarity(left: dict[str, float], right: dict[str, float]) -> float:
        if len(left) > len(right):
            left, right = right, left
        return sum(value * right.get(token, 0.0) for token, value in left.items())

    def _build_index(self) -> tuple[list[KBChunk], list[list[str]]]:
        if self._index is not None:
            return self._index
        chunks: list[KBChunk] = []
        tokenized_chunks: list[list[str]] = []
        for document in self._load_documents():
            title_tokens = list(self._tokens(document.title))
            tag_tokens = list(self._tokens(" ".join(document.tags)))
            for chunk in self._chunks(document):
                chunks.append(chunk)
                tokenized_chunks.append(title_tokens * 3 + tag_tokens * 2 + list(self._tokens(chunk.content)))
        self._index = (chunks, tokenized_chunks)
        return self._index

    async def search(
        self,
        query: str,
        *,
        tenant_id: str,
        domains: list[DataDomain] | None = None,
        limit: int = 5,
    ) -> list[KBSearchHit]:
        
        if not self._initialized:
            self.initialize_mock_kb()
        allowed = self._visible_domains(domains)
        query_tokens = list(self._tokens(query))
        if not query_tokens:
            return []
        now = datetime.now(timezone.utc)
        all_chunks, all_tokenized = self._build_index()
        chunks: list[KBChunk] = []
        tokenized_chunks: list[list[str]] = []
        for chunk, tokens in zip(all_chunks, all_tokenized):
            document = chunk.document
            if document.tenant_id is not None and document.tenant_id != tenant_id:
                continue
            if allowed is not None and document.domain not in allowed:
                continue
            if not self._is_current(document, now):
                continue
            chunks.append(chunk)
            tokenized_chunks.append(tokens)
        if not chunks:
            return []
        vectors = self._tfidf_vectors([query_tokens, *tokenized_chunks])
        query_vector, *chunk_vectors = vectors
        hits: list[KBSearchHit] = []
        for chunk, vector in zip(chunks, chunk_vectors):
            score = self._cosine_similarity(query_vector, vector)
            if score > 0:
                hits.append(KBSearchHit(chunk=chunk, score=score))
        hits.sort(key=lambda hit: (-hit.score, hit.chunk.document.doc_id, hit.chunk.index))
        return hits[: max(1, min(limit, 20))]

    async def search_with_citations(self, query: str, *, tenant_id: str, domains: list[DataDomain] | None = None, limit: int = 5) -> list[tuple[KBSearchHit, KBCitation]]:
        hits = await self.search(query, tenant_id=tenant_id, domains=domains, limit=limit)
        return [
            (
                hit,
                KBCitation(hit.document.doc_id, hit.document.title, hit.document.version, hit.chunk.chunk_id, hit.chunk.section, hit.document.domain),
            )
            for hit in hits
        ]

    async def snippets_for_prompt(self, query: str, *, tenant_id: str, domains: list[DataDomain] | None = None) -> list[str]:
        if not self.settings.kb_enabled:
            return []
        results = await self.search_with_citations(query, tenant_id=tenant_id, domains=domains, limit=self.settings.kb_max_snippets)
        return [
            f"[KB document={citation.document_id} version={citation.version} chunk={citation.chunk_id} domain={citation.domain.value}] {citation.title} / {citation.section}: {hit.chunk.content}"
            for hit, citation in results
        ]

    def get_all_documents(self) -> list[KBDocument]:
        if not self._initialized:
            self.initialize_mock_kb()
        return self._load_documents()

    async def health_check(self) -> bool:
        if not self._initialized:
            self.initialize_mock_kb()
        return bool(self._load_documents())


_knowledge_base: KnowledgeBaseService | None = None


def reset_knowledge_base() -> None:
    global _knowledge_base
    _knowledge_base = None


def get_knowledge_base() -> KnowledgeBaseService:
    global _knowledge_base
    if _knowledge_base is None:
        service = KnowledgeBaseService()
        service.initialize_mock_kb()
        _knowledge_base = service
    return _knowledge_base
