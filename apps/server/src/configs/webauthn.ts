import { WEB_AUTHN_RP_NAME } from '@rona/config/webauthn';
import { loadEnv } from './env';

export interface WebAuthnConfig {
  rpId: string;
  rpName: string;
  origins: string[];
}

export function webAuthnConfigProvider(): WebAuthnConfig {
  const env = loadEnv();
  // Prefer the first HTTPS client origin: credentials are bound to this
  // domain, and a localhost fallback would break every production tablet.
  const httpsOrigin = env.CLIENT_URL.find((url) => url.startsWith('https://'));
  const fallbackHost = httpsOrigin
    ? new URL(httpsOrigin).hostname
    : env.CLIENT_URL[0]
      ? new URL(env.CLIENT_URL[0]).hostname
      : 'localhost';
  return {
    rpId: env.WEB_AUTHN_RP_ID ?? fallbackHost,
    rpName: WEB_AUTHN_RP_NAME,
    origins: env.CLIENT_URL,
  };
}
