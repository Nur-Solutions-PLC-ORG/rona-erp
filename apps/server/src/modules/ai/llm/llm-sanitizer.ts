import type { AiDataDomain } from '@rona/types/ai';
import type { RonaContextBundle } from '../types/ai-contexts.types.js';
import { loadedDomains } from '../ai-bundle.utils.js';
import type { PromptCitation } from './prompt/prompt-knowledge';

export interface RawAiResponse {
  answer: string;
  supporting_data?: Array<{
    label: string;
    value: string;
    unit?: string | null;
    comparison?: string | null;
  }>;
  recommendation?: string | null;
  kb_citations?: Array<{
    document_id: string;
    title: string;
    version: number;
    chunk_id: string;
    section: string;
    domain: string;
  }>;
  source?: string[];
  data_available?: boolean;
}

export interface SanitizedAiResponse {
  answer: string;
  supportingData: Array<{
    label: string;
    value: string;
    unit: string | null;
    comparison: string | null;
  }>;
  recommendation: string | null;
  kbCitations: PromptCitation[];
  source: AiDataDomain[];
  dataAvailable: boolean;
}

const VALID_DOMAINS = new Set<string>([
  'hr',
  'attendance',
  'production',
  'inventory',
  'quality',
  'finance',
  'sales',
  'organization',
  'bom',
  'reports',
]);

export function sanitizeResponse(
  rawText: string,
  bundle: RonaContextBundle,
  allowedCitations: PromptCitation[],
): SanitizedAiResponse {
  let parsed: RawAiResponse;
  try {
    parsed = JSON.parse(rawText) as RawAiResponse;
  } catch {
    throw new Error('Model output was not valid JSON');
  }

  const loaded = new Set(loadedDomains(bundle));
  const allowed = new Map(allowedCitations.map((c) => [c.chunkId, c]));

  const source = (parsed.source ?? [])
    .filter((token): token is AiDataDomain => VALID_DOMAINS.has(token))
    .filter((token) => loaded.has(token));

  const kbCitations = (parsed.kb_citations ?? []).flatMap((citation) => {
    const allowedRecord = allowed.get(citation.chunk_id);
    const domain = citation.domain as AiDataDomain;
    if (
      !allowedRecord ||
      !loaded.has(domain) ||
      allowedRecord.documentId !== citation.document_id ||
      allowedRecord.version !== citation.version
    ) {
      return [];
    }
    return [
      {
        documentId: allowedRecord.documentId,
        title: allowedRecord.title,
        version: allowedRecord.version,
        chunkId: allowedRecord.chunkId,
        section: allowedRecord.section,
        domain: allowedRecord.domain,
      },
    ];
  });

  return {
    answer: String(parsed.answer ?? ''),
    supportingData: (parsed.supporting_data ?? []).map((metric) => ({
      label: metric.label,
      value: metric.value,
      unit: metric.unit ?? null,
      comparison: metric.comparison ?? null,
    })),
    recommendation: parsed.recommendation ?? null,
    kbCitations,
    source,
    dataAvailable: parsed.data_available ?? true,
  };
}
