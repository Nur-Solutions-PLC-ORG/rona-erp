import type { RonaContextBundle } from '../../types/ai-contexts.types.js';
import type { CanonicalContext } from '../../types/ai-contexts.types.js';
import { headerLines } from './prompt-header.js';
import {
  hrSection,
  productionSection,
  inventorySection,
  qualitySection,
  financeSection,
  salesSection,
  organizationSection,
  bomSection,
} from './prompt-sections.js';
import { alertLines, trendsLines } from './prompt-alerts.js';
import type { AiKnowledgeService } from '../../knowledge/ai-knowledge.service.js';
import { knowledgeBlock } from './prompt-knowledge.js';

export interface BuildPromptResult {
  prompt: string;
  allowedCitations: Awaited<
    ReturnType<AiKnowledgeService['searchWithCitations']>
  >;
}

export async function buildPrompt(
  question: string,
  bundle: RonaContextBundle,
  knowledge: AiKnowledgeService,
): Promise<BuildPromptResult> {
  const parts = headerLines(bundle);

  const sections: Array<[string, () => string[]]> = [
    ['hr', () => (bundle.hr ? hrSection(bundle.hr) : [])],
    [
      'production',
      () => (bundle.production ? productionSection(bundle.production) : []),
    ],
    [
      'inventory',
      () => (bundle.inventory ? inventorySection(bundle.inventory) : []),
    ],
    ['quality', () => (bundle.quality ? qualitySection(bundle.quality) : [])],
    ['finance', () => (bundle.finance ? financeSection(bundle.finance) : [])],
    ['sales', () => (bundle.sales ? salesSection(bundle.sales) : [])],
    [
      'organization',
      () =>
        bundle.organization ? organizationSection(bundle.organization) : [],
    ],
    ['bom', () => (bundle.bom ? bomSection(bundle.bom) : [])],
  ];
  const TREND_HEADINGS: Record<string, string> = {
    hr: 'HR & Attendance',
    production: 'Production',
    inventory: 'Inventory',
    quality: 'Quality',
    finance: 'Finance',
    sales: 'Sales',
    organization: 'Organization',
    bom: 'BOM',
  };

  for (const [key, render] of sections) {
    const lines = render();
    if (!lines.length) continue;
    parts.push(...lines);
    const payload = (bundle as unknown as Record<string, CanonicalContext>)[
      key
    ];
    if (payload && 'trends' in payload && payload.trends.length) {
      parts.push(...trendsLines(payload, TREND_HEADINGS[key]));
    }
  }

  parts.push(...alertLines(bundle));

  const kb = await knowledgeBlock(question, bundle, knowledge);
  parts.push(...kb.lines);

  parts.push(`\nQUESTION: ${question}`);
  return { prompt: parts.join('\n'), allowedCitations: kb.allowedCitations };
}
