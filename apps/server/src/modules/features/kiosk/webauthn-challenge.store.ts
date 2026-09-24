import { Injectable } from '@nestjs/common';
import { redisClient } from '@/redis';
import { WEB_AUTHN_CHALLENGE_TTL_SECONDS } from '@rona/config/webauthn';

const CHALLENGE_KEY_PREFIX = 'kiosk:webauthn:challenge:';

export type WebAuthnChallengePurpose = 'registration' | 'authentication';

export interface WebAuthnChallenge {
  purpose: WebAuthnChallengePurpose;
  organizationId: string;
  employeeId?: string;
}

@Injectable()
export class WebAuthnChallengeStore {
  async issue(challenge: string, data: WebAuthnChallenge): Promise<void> {
    await redisClient.set(this.key(challenge), data, {
      ex: WEB_AUTHN_CHALLENGE_TTL_SECONDS,
    });
  }

  async consume(challenge: string): Promise<WebAuthnChallenge | null> {
    const key = this.key(challenge);
    const [existing] = await Promise.all([
      redisClient.get<WebAuthnChallenge>(key),
      redisClient.del(key),
    ]);
    return existing ?? null;
  }

  private key(challenge: string): string {
    return `${CHALLENGE_KEY_PREFIX}${challenge}`;
  }
}
