import { z } from 'zod';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const normalizeMailbox = (value: string) => {
  let cleaned = value.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
};

const emailAddress = z.string().refine(
  (value) => {
    const cleaned = normalizeMailbox(value);
    const match = cleaned.match(/^.*<([^<>]+)>$/);
    return z.email().safeParse(match ? match[1] : cleaned).success;
  },
  'Invalid email address',
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  CLIENT_URL: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? DEFAULT_CLIENT_URL)
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
    )
    .pipe(
      z.array(z.url()).min(1, 'CLIENT_URL must contain at least one valid URL'),
    ),

  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),

  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  RESEND_EMAIL_FROM: z.preprocess(emptyToUndefined, z.email().optional()),

  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().optional(),
  ),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  MAIL_FROM: z.preprocess(emptyToUndefined, emailAddress.optional()),

  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  GOOGLE_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
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
