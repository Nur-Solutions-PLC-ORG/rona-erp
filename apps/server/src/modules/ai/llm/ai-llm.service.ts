import { Injectable } from '@nestjs/common';
import type { RonaContextBundle } from '../types/ai-contexts.types.js';
import {
  GeminiClient,
  LlmError,
  LlmNotConfiguredError,
  LlmQuotaError,
  LlmResponseError,
  LlmTimeoutError,
  llmConfigured,
} from './ai-gemini.client.js';
import { sanitizeResponse, type SanitizedAiResponse } from './llm-sanitizer.js';
import { buildPrompt } from './prompt/prompt-builder.js';
import { AiKnowledgeService } from '../knowledge/ai-knowledge.service.js';
import type { PromptCitation } from './prompt/prompt-knowledge.js';

export {
  LlmError,
  LlmNotConfiguredError,
  LlmQuotaError,
  LlmResponseError,
  LlmTimeoutError,
};

@Injectable()
export class AiLlmService {
  private readonly client = new GeminiClient();

  constructor(private readonly knowledge: AiKnowledgeService) {}

  get isConfigured(): boolean {
    return llmConfigured();
  }

  async generateResponse(
    question: string,
    bundle: RonaContextBundle,
  ): Promise<SanitizedAiResponse> {
    const { prompt, allowedCitations } = await buildPrompt(
      question,
      bundle,
      this.knowledge,
    );

    const raw = await this.client.generate(prompt, bundle.tenantId);

    const flatCitations: PromptCitation[] = allowedCitations.map(
      ({ citation }) => citation,
    );
    return sanitizeResponse(raw, bundle, flatCitations);
  }
}
