import { Logger } from '@nestjs/common';
import {
  AI_GEMINI_MAX_ATTEMPTS,
  AI_GEMINI_MAX_OUTPUT_TOKENS_DEFAULT,
  AI_GEMINI_MODEL_DEFAULT,
  AI_GEMINI_RETRY_BASE_DELAY_SECONDS,
  AI_GEMINI_TEMPERATURE_DEFAULT,
  AI_GEMINI_THINKING_BUDGET_DEFAULT,
  AI_GEMINI_TIMEOUT_SECONDS_DEFAULT,
} from '@rona/config/ai';
import { AI_SYSTEM_INSTRUCTION } from './llm-instructions.js';

export class LlmError extends Error {}
export class LlmNotConfiguredError extends LlmError {}
export class LlmTimeoutError extends LlmError {}
export class LlmResponseError extends LlmError {}
export class LlmQuotaError extends LlmError {
  constructor(
    message: string,
    readonly retryAfterSeconds: number | null,
  ) {
    super(message);
  }
}

interface GeminiEnv {
  GOOGLE_API_KEY?: string;
  AI_GEMINI_MODEL?: string;
  AI_GEMINI_TEMPERATURE?: string;
  AI_GEMINI_MAX_OUTPUT_TOKENS?: string;
  AI_GEMINI_THINKING_BUDGET?: string;
  AI_GEMINI_TIMEOUT_SECONDS?: string;
  AI_GEMINI_MAX_ATTEMPTS?: string;
}

const env: GeminiEnv = process.env;

const DOMAIN_TOKENS = [
  'hr',
  'attendance',
  'production',
  'inventory',
  'quality',
  'finance',
  'sales',
  'organization',
  'bom',
];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    answer: { type: 'STRING' },
    supporting_data: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          unit: { type: 'STRING', nullable: true },
          comparison: { type: 'STRING', nullable: true },
        },
        required: ['label', 'value'],
      },
    },
    recommendation: { type: 'STRING', nullable: true },
    kb_citations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          document_id: { type: 'STRING' },
          title: { type: 'STRING' },
          version: { type: 'INTEGER' },
          chunk_id: { type: 'STRING' },
          section: { type: 'STRING' },
          domain: { type: 'STRING' },
        },
        required: [
          'document_id',
          'title',
          'version',
          'chunk_id',
          'section',
          'domain',
        ],
      },
    },
    source: {
      type: 'ARRAY',
      items: { type: 'STRING', enum: DOMAIN_TOKENS },
    },
    data_available: { type: 'BOOLEAN' },
  },
  required: [
    'answer',
    'supporting_data',
    'recommendation',
    'kb_citations',
    'source',
    'data_available',
  ],
};

export function llmConfigured(): boolean {
  return Boolean(env.GOOGLE_API_KEY);
}

function model(): string {
  return env.AI_GEMINI_MODEL ?? AI_GEMINI_MODEL_DEFAULT;
}

export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  async generate(prompt: string, tenantId: string): Promise<string> {
    const apiKey = env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new LlmNotConfiguredError('GOOGLE_API_KEY is not set');
    }

    const maxAttempts = Number(
      env.AI_GEMINI_MAX_ATTEMPTS ?? AI_GEMINI_MAX_ATTEMPTS,
    );
    const timeoutMs =
      Number(
        env.AI_GEMINI_TIMEOUT_SECONDS ?? AI_GEMINI_TIMEOUT_SECONDS_DEFAULT,
      ) * 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.callOnce(prompt, apiKey, timeoutMs);
      } catch (error) {
        if (
          error instanceof LlmQuotaError ||
          error instanceof LlmNotConfiguredError
        ) {
          throw error;
        }
        const retryable = this.isRetryable(error);
        if (attempt < maxAttempts && retryable) {
          const delay =
            AI_GEMINI_RETRY_BASE_DELAY_SECONDS * 2 ** (attempt - 1) * 1000;
          this.logger.warn(
            `LLM transient failure (attempt ${attempt}/${maxAttempts}) for tenant ${tenantId}; retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        this.logger.error(
          `LLM call failed for tenant ${tenantId}: ${String(error)}`,
        );
        throw error instanceof LlmError
          ? error
          : new LlmResponseError('Gemini request failed');
      }
    }
    throw new LlmResponseError('Gemini request failed after retries');
  }

  private async callOnce(
    prompt: string,
    apiKey: string,
    timeoutMs: number,
  ): Promise<string> {
    const body = {
      systemInstruction: { parts: [{ text: AI_SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: Number(
          env.AI_GEMINI_TEMPERATURE ?? AI_GEMINI_TEMPERATURE_DEFAULT,
        ),
        maxOutputTokens: Number(
          env.AI_GEMINI_MAX_OUTPUT_TOKENS ??
            AI_GEMINI_MAX_OUTPUT_TOKENS_DEFAULT,
        ),
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        ...(this.isThinkingModel()
          ? {
              thinkingConfig: {
                thinkingBudget: Number(
                  env.AI_GEMINI_THINKING_BUDGET ??
                    AI_GEMINI_THINKING_BUDGET_DEFAULT,
                ),
              },
            }
          : {}),
      },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      );

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get('retry-after') ?? 0);
        throw new LlmQuotaError(
          'Gemini request quota has been exhausted',
          retryAfter > 0 ? retryAfter : null,
        );
      }
      if (!response.ok) {
        if (response.status >= 500) {
          throw new LlmResponseError(`Gemini server error ${response.status}`);
        }
        throw new LlmError(`Gemini client error ${response.status}`);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('');
      if (!text) {
        throw new LlmResponseError('Model returned an empty response');
      }
      return text;
    } catch (error) {
      if (error instanceof LlmError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new LlmTimeoutError('Gemini did not respond in time');
      }
      throw new LlmResponseError('Gemini request failed');
    } finally {
      clearTimeout(timer);
    }
  }

  private isThinkingModel(): boolean {
    const name = model();
    return name.includes('2.5') || name.includes('3');
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof LlmTimeoutError) return true;
    if (error instanceof LlmResponseError) return true;
    return false;
  }
}
