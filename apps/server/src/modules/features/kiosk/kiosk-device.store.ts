import { Injectable } from '@nestjs/common';
import { redisClient } from '@/redis';
import {
  KIOSK_ENROLL_CODE_TTL_SECONDS,
  KIOSK_SIGNATURE_MAX_SKEW_SECONDS,
} from '@rona/config/kiosk';

export interface KioskEnrollCodeGrant {
  organizationId: string;
  userId: string;
  supervisorName: string;
}

// Short-lived native kiosk state kept in Redis.
@Injectable()
export class KioskDeviceStore {
  /** Stores a one-time enroll code; false when the code is already taken. */
  async issueEnrollCode(
    code: string,
    grant: KioskEnrollCodeGrant,
  ): Promise<boolean> {
    const result = await redisClient.set(
      this.enrollCodeKey(grant.organizationId, code),
      grant,
      { nx: true, ex: KIOSK_ENROLL_CODE_TTL_SECONDS },
    );
    return result === 'OK';
  }

  async consumeEnrollCode(
    organizationId: string,
    code: string,
  ): Promise<KioskEnrollCodeGrant | null> {
    const grant = await redisClient.getdel<KioskEnrollCodeGrant>(
      this.enrollCodeKey(organizationId, code),
    );
    return grant ?? null;
  }

  /** Replay protection: true only the first time a signature is seen. */
  async claimSignature(kioskId: string, signature: string): Promise<boolean> {
    const result = await redisClient.set(
      `kiosk:device:signature:${kioskId}:${signature}`,
      '1',
      { nx: true, ex: KIOSK_SIGNATURE_MAX_SKEW_SECONDS * 2 },
    );
    return result === 'OK';
  }

  private enrollCodeKey(organizationId: string, code: string): string {
    return `kiosk:enroll:code:${organizationId}:${code}`;
  }
}
