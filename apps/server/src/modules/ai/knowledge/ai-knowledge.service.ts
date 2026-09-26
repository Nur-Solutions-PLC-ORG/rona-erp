import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { aiKnowledgeDocuments } from '@/db/schemas/ai';
import type { AiDataDomain } from '@rona/types/ai';

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'of',
  'to',
  'in',
  'on',
  'for',
  'and',
  'or',
  'is',
  'are',
  'was',
  'were',
  'be',
  'how',
  'what',
  'which',
  'who',
  'when',
  'why',
  'many',
  'much',
  'do',
  'does',
  'did',
  'my',
  'our',
  'we',
  'i',
  'this',
  'that',
]);

const MAX_CHUNK_WORDS = 120;

export interface KbDocument {
  docId: string;
  title: string;
  content: string;
  domain: AiDataDomain;
  tenantId: string;
  category: string;
  tags: string[];
  version: number;
  status: string;
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  sourceRef: string | null;
}

export interface KbChunk {
  chunkId: string;
  document: KbDocument;
  section: string;
  content: string;
  index: number;
}

export interface AiKnowledgeHit {
  chunk: KbChunk;
  score: number;
}

@Injectable()
export class AiKnowledgeService {
  private readonly logger = new Logger(AiKnowledgeService.name);
  private readonly indexCache = new Map<
    string,
    {
      chunks: KbChunk[];
      tokenized: string[][];
      builtAt: number;
    }
  >();
  private static readonly INDEX_CACHE_MAX_ENTRIES = 32;
  private static readonly INDEX_CACHE_TTL_MS = 5 * 60 * 1000;

  async search(
    query: string,
    tenantId: string,
    domains: AiDataDomain[],
    limit: number,
  ): Promise<AiKnowledgeHit[]> {
    const queryTokens = tokenize(query);
    if (!queryTokens.length) return [];

    const visible = new Set<AiDataDomain>(domains);
    if (visible.has('hr') || visible.has('attendance')) {
      visible.add('hr');
      visible.add('attendance');
    }

    const { chunks, tokenized } = await this.buildIndex(tenantId, visible);
    if (!chunks.length) return [];

    const vectors = tfidfVectors([queryTokens, ...tokenized]);
    const [queryVector, ...chunkVectors] = vectors;

    const hits: AiKnowledgeHit[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const score = cosineSimilarity(queryVector, chunkVectors[i]);
      if (score > 0) {
        hits.push({ chunk: chunks[i], score });
      }
    }

    hits.sort(
      (a, b) =>
        b.score - a.score ||
        a.chunk.document.docId.localeCompare(b.chunk.document.docId) ||
        a.chunk.index - b.chunk.index,
    );
    return hits.slice(0, Math.max(1, Math.min(limit, 20)));
  }

  async searchWithCitations(
    query: string,
    tenantId: string,
    domains: AiDataDomain[],
    limit: number,
  ): Promise<
    Array<{
      hit: AiKnowledgeHit;
      citation: {
        documentId: string;
        title: string;
        version: number;
        chunkId: string;
        section: string;
        domain: AiDataDomain;
      };
    }>
  > {
    const hits = await this.search(query, tenantId, domains, limit);
    return hits.map((hit) => ({
      hit,
      citation: {
        documentId: hit.chunk.document.docId,
        title: hit.chunk.document.title,
        version: hit.chunk.document.version,
        chunkId: hit.chunk.chunkId,
        section: hit.chunk.section,
        domain: hit.chunk.document.domain,
      },
    }));
  }

  invalidateIndex(tenantId?: string): void {
    if (tenantId === undefined) {
      this.indexCache.clear();
      return;
    }
    for (const key of this.indexCache.keys()) {
      if (key.startsWith(`${tenantId}:`)) this.indexCache.delete(key);
    }
  }

  async healthCheck(): Promise<boolean> {
    const rows = await this.loadDocuments('*');
    return rows.length > 0;
  }

  private async buildIndex(
    tenantId: string,
    visible: Set<AiDataDomain>,
  ): Promise<{ chunks: KbChunk[]; tokenized: string[][] }> {
    const cacheKey = `${tenantId}:${[...visible].sort().join(',')}`;
    const cached = this.indexCache.get(cacheKey);
    if (
      cached &&
      Date.now() - cached.builtAt < AiKnowledgeService.INDEX_CACHE_TTL_MS
    ) {
      return cached;
    }

    const documents = await this.loadDocuments(tenantId);
    const now = new Date();

    const chunks: KbChunk[] = [];
    const tokenized: string[][] = [];

    for (const document of documents) {
      if (!isCurrent(document, now)) continue;
      if (!visible.has(document.domain)) continue;

      const titleTokens = tokenize(document.title);
      const tagTokens = tokenize(document.tags.join(' '));
      for (const chunk of chunkDocument(document)) {
        chunks.push(chunk);
        tokenized.push([
          ...titleTokens,
          ...titleTokens,
          ...titleTokens,
          ...tagTokens,
          ...tagTokens,
          ...tokenize(chunk.content),
        ]);
      }
    }

    const entry = { chunks, tokenized, builtAt: Date.now() };
    if (this.indexCache.size >= AiKnowledgeService.INDEX_CACHE_MAX_ENTRIES) {
      const oldestKey = this.indexCache.keys().next().value;
      if (oldestKey !== undefined) this.indexCache.delete(oldestKey);
    }
    this.indexCache.set(cacheKey, entry);
    return entry;
  }

  private async loadDocuments(tenantId: string): Promise<KbDocument[]> {
    try {
      const rows = await db
        .select()
        .from(aiKnowledgeDocuments)
        .where(
          tenantId === '*'
            ? undefined
            : eq(aiKnowledgeDocuments.organizationId, tenantId),
        );

      return rows
        .filter((row) => row.status === 'approved')
        .map((row) => ({
          docId: row.id,
          title: row.title,
          content: row.content,
          domain: row.domain as AiDataDomain,
          tenantId: row.organizationId,
          category: row.category,
          tags: row.tags ?? [],
          version: row.version,
          status: row.status,
          effectiveFrom: row.effectiveFrom,
          effectiveUntil: row.effectiveUntil,
          sourceRef: row.sourceRef,
        }));
    } catch (error) {
      this.logger.warn(`Knowledge document load failed: ${String(error)}`);
      return [];
    }
  }
}

function tokenize(value: string): string[] {
  const matches = value.toLowerCase().match(/[\w]+(?:[-'][\w]+)*/g) ?? [];
  return matches.filter((token) => !STOPWORDS.has(token) && token.length > 2);
}

function chunkDocument(document: KbDocument): KbChunk[] {
  const paragraphs = document.content
    .split(/\n\s*\n|(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: KbChunk[] = [];
  let current: string[] = [];
  let count = 0;
  let index = 0;

  const flush = () => {
    if (!current.length) return;
    chunks.push({
      chunkId: `${document.docId}-C${String(index + 1).padStart(3, '0')}`,
      document,
      section: document.title,
      content: current.join(' '),
      index,
    });
    index += 1;
    current = [];
    count = 0;
  };

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).length;
    if (current.length && count + words > MAX_CHUNK_WORDS) {
      flush();
    }
    current.push(paragraph);
    count += words;
  }
  flush();
  return chunks;
}

function isCurrent(document: KbDocument, now: Date): boolean {
  if (document.effectiveFrom && document.effectiveFrom > now) return false;
  if (document.effectiveUntil && document.effectiveUntil <= now) return false;
  return true;
}

function tfidfVectors(texts: string[][]): Array<Map<string, number>> {
  const documentFrequency = new Map<string, number>();
  for (const tokens of texts) {
    for (const token of new Set(tokens)) {
      documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
    }
  }
  const documentCount = texts.length;

  return texts.map((tokens) => {
    const counts = new Map<string, number>();
    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    const vector = new Map<string, number>();
    if (tokens.length) {
      for (const [token, count] of counts) {
        const idf = Math.log(
          (documentCount + 1) / ((documentFrequency.get(token) ?? 0) + 1),
        );
        vector.set(token, (count / tokens.length) * idf + 1);
      }
    }
    const norm = Math.sqrt(
      [...vector.values()].reduce((sum, v) => sum + v * v, 0),
    );
    if (norm) {
      for (const [token, value] of vector) {
        vector.set(token, value / norm);
      }
    }
    return vector;
  });
}

function cosineSimilarity(
  left: Map<string, number>,
  right: Map<string, number>,
): number {
  const [small, large] =
    left.size <= right.size ? [left, right] : [right, left];
  let sum = 0;
  for (const [token, value] of small) {
    sum += value * (large.get(token) ?? 0);
  }
  return sum;
}
