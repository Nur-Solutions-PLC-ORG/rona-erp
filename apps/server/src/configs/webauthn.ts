import { WEB_AUTHN_RP_NAME } from '@rona/config/webauthn';
import { loadEnv } from './env';

export interface WebAuthnConfig {
  rpId: string;
  rpName: string;
  origins: string[];
}

export function webAuthnConfigProvider(): WebAuthnConfig {
  const env = loadEnv();
  const fallbackHost = env.CLIENT_URL[0]
    ? new URL(env.CLIENT_URL[0]).hostname
    : 'localhost';
  return {
    rpId: env.WEB_AUTHN_RP_ID ?? fallbackHost,
    rpName: WEB_AUTHN_RP_NAME,
    origins: env.CLIENT_URL,
  };
}
