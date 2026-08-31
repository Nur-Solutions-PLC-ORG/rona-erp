from __future__ import annotations

from app.schemas import RonaAIResponse, RonaContextBundle
from app.services.llm.prompt import CitationRecord


def sanitize_response(
    response: RonaAIResponse,
    bundle: RonaContextBundle,
    allowed_citations: tuple[CitationRecord, ...],
) -> RonaAIResponse:
    loaded = bundle.loaded_domains()
    sources = [domain for domain in response.source if domain in loaded]
    citations = _verified_citations(response, loaded, allowed_citations)

    if sources == response.source and citations == response.kb_citations:
        return response
    return response.model_copy(update={"source": sources, "kb_citations": citations})


def _verified_citations(
    response: RonaAIResponse,
    loaded,
    allowed_citations: tuple[CitationRecord, ...],
):
    
    allowed = {str(record["chunk_id"]): record for record in allowed_citations}
    return [
        citation
        for citation in response.kb_citations
        if citation.chunk_id in allowed
        and citation.domain in loaded
        and citation.document_id == allowed[citation.chunk_id]["document_id"]
        and citation.version == allowed[citation.chunk_id]["version"]
    ]


__all__ = ["sanitize_response"]
