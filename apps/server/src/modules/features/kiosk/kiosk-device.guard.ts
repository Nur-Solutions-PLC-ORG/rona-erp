import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  KIOSK_KIOSK_ID_HEADER,
  KIOSK_SIGNATURE_HEADER,
  KIOSK_SIGNATURE_MAX_SKEW_SECONDS,
  KIOSK_TIMESTAMP_HEADER,
} from '@rona/config/kiosk';
import { patchRequestContext } from '@/context/request-context';
import {
  KioskAuthenticationException,
  KioskNotPairedException,
  KioskSignatureInvalidException,
} from './kiosk.exception';
import {
  kioskSigningPayload,
  verifyKioskSignature,
} from './kiosk-device.crypto';
import { KioskDeviceStore } from './kiosk-device.store';
import { KioskService, type KioskDeviceContext } from './kiosk.service';
import { KiosksRepository } from './kiosks.repository';

export interface KioskDeviceRequest extends Request {
  kiosk?: KioskDeviceContext;
  rawBody?: Buffer;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verifies the ECDSA request signature of a paired native terminal. */
@Injectable()
export class KioskSignatureVerifier {
  constructor(private readonly deviceStore: KioskDeviceStore) {}

  async verify(
    request: KioskDeviceRequest,
    kioskId: string,
    publicKey: string,
    now: number = Date.now(),
  ): Promise<void> {
    const signature = request.header(KIOSK_SIGNATURE_HEADER);
    const timestamp = request.header(KIOSK_TIMESTAMP_HEADER);
    if (!signature || !timestamp || !/^\d{1,16}$/.test(timestamp)) {
      throw new KioskSignatureInvalidException();
    }
    if (
      Math.abs(now - Number(timestamp)) >
      KIOSK_SIGNATURE_MAX_SKEW_SECONDS * 1000
    ) {
      throw new KioskSignatureInvalidException();
    }

    const payload = kioskSigningPayload(
      request.method,
      request.originalUrl,
      timestamp,
      request.rawBody,
    );
    if (!verifyKioskSignature(publicKey, payload, signature)) {
      throw new KioskSignatureInvalidException();
    }
    if (!(await this.deviceStore.claimSignature(kioskId, signature))) {
      throw new KioskSignatureInvalidException();
    }
  }
}

/**
 * Native terminal requests: `Authorization: Bearer <sessionToken>` plus a valid
 * signature from the paired device key. Sets the kiosk's organization as tenant.
 */
@Injectable()
export class KioskDeviceGuard implements CanActivate {
  constructor(
    private readonly kioskService: KioskService,
    private readonly kiosksRepository: KiosksRepository,
    private readonly verifier: KioskSignatureVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<KioskDeviceRequest>();
    const authorization = request.header('authorization') ?? '';
    const [scheme, token] = authorization.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new KioskAuthenticationException();
    }

    const device = await this.kioskService.resolveActiveDevice(token);
    const kiosk = await this.kiosksRepository.findDeviceById(device.kioskId);
    if (!kiosk?.publicKey) throw new KioskNotPairedException();

    await this.verifier.verify(request, kiosk.id, kiosk.publicKey);

    request.kiosk = device;
    patchRequestContext({ organizationId: device.organizationId });
    await this.kioskService.touchLastSeen(
      device.kioskId,
      device.organizationId,
    );
    return true;
  }
}

/** Session renewal: no bearer, the device key alone proves identity. */
@Injectable()
export class KioskDeviceSignatureGuard implements CanActivate {
  constructor(
    private readonly kiosksRepository: KiosksRepository,
    private readonly verifier: KioskSignatureVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<KioskDeviceRequest>();
    const kioskId = request.header(KIOSK_KIOSK_ID_HEADER) ?? '';
    if (!UUID_PATTERN.test(kioskId)) throw new KioskAuthenticationException();

    const kiosk = await this.kiosksRepository.findDeviceById(kioskId);
    if (!kiosk || kiosk.status !== 'ACTIVE') {
      throw new KioskAuthenticationException();
    }
    if (!kiosk.publicKey) throw new KioskNotPairedException();

    await this.verifier.verify(request, kiosk.id, kiosk.publicKey);

    request.kiosk = {
      kioskId: kiosk.id,
      deviceId: kiosk.deviceId,
      organizationId: kiosk.organizationId,
    };
    patchRequestContext({ organizationId: kiosk.organizationId });
    return true;
  }
}
