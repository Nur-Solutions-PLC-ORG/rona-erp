import { z } from 'zod';

export const webauthnConfigSchema = z.object({
  WEBAUTHN_RP_ID: z.string().min(1).max(253).regex(/^(localhost|[a-z0-9]+(?:[.-][a-z0-9]+)*)$/),
  WEBAUTHN_RP_NAME: z.string().trim().min(1).max(100),
  WEBAUTHN_ORIGIN: z.string().url().refine((value) => {
    const url = new URL(value);
    return url.origin === value && !url.username && !url.password &&
      (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost'));
  }, 'Use an exact HTTPS origin (HTTP is permitted only for localhost)'),
}).refine((value) => {
  const host = new URL(value.WEBAUTHN_ORIGIN).hostname;
  return host === value.WEBAUTHN_RP_ID || host.endsWith(`.${value.WEBAUTHN_RP_ID}`);
}, 'WebAuthn origin must belong to the configured RP ID');

export function loadWebauthnConfig() {
  return webauthnConfigSchema.parse(process.env);
}
