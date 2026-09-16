import { z } from 'zod';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';

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

  RESEND_API_KEY: z.string().optional(),
  RESEND_EMAIL_FROM: z.email().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.email().optional(),

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
