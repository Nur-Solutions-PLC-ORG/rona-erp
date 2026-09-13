import { z } from 'zod';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  CLIENT_URL: z.url().default(DEFAULT_CLIENT_URL),

  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  RESEND_API_KEY: z.string().optional(),
  RESEND_EMAIL_FROM: z.email().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = z.prettifyError(result.error);

    console.error('Invalid environment configuration:\n', formatted);
    process.exit(1);
  }

  cachedEnv = result.data;
  return cachedEnv;
}
