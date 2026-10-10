import type { ExecutionContext } from '@nestjs/common';
import { KIOSK_SIGNATURE_MAX_SKEW_SECONDS } from '@rona/config/kiosk';
import { getRequestContext } from '@/context/request-context';
import {
  DEVICE,
  KIOSK_ID,
  ORG_A,
  createDeviceKey,
  defaultMocks,
  deviceStore,
  kioskRow,
  kioskService,
  kiosksRepository,
  runAsDevice,
} from './kiosk-device.spec-harness';
import {
  KioskDeviceGuard,
  KioskDeviceSignatureGuard,
  KioskSignatureVerifier,
  type KioskDeviceRequest,
} from './kiosk-device.guard';
import {
  KioskAuthenticationException,
  KioskNotPairedException,
  KioskSignatureInvalidException,
} from './kiosk.exception';
import type { KioskDeviceStore } from './kiosk-device.store';
import type { KioskService } from './kiosk.service';
import type { KiosksRepository } from './kiosks.repository';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({ db: {}, pooledDb: { transaction: jest.fn() } }));
jest.mock('@/redis', () => ({
  rateLimit: jest.fn(async () => true),
  redisClient: {},
}));

const URL = '/api/kiosk/device/punch?x=1';
const BODY = '{"hello":"world"}';

function request(
  headers: Record<string, string>,
  body?: string,
): KioskDeviceRequest {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    method: 'POST',
    originalUrl: URL,
    rawBody: body === undefined ? undefined : Buffer.from(body),
    header: (name: string) => lower[name.toLowerCase()],
  } as unknown as KioskDeviceRequest;
}

function context(req: KioskDeviceRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('KioskSignatureVerifier', () => {
  const verifier = new KioskSignatureVerifier(
    deviceStore as unknown as KioskDeviceStore,
  );
  const key = createDeviceKey();

  beforeEach(() => {
    jest.clearAllMocks();
    defaultMocks();
  });

  it('accepts a fresh, correctly signed request', async () => {
    const ts = String(Date.now());
    const req = request(
      {
        'x-kiosk-signature': key.signRequest('POST', URL, ts, BODY),
        'x-kiosk-timestamp': ts,
      },
      BODY,
    );
    await expect(
      verifier.verify(req, KIOSK_ID, key.publicKey),
    ).resolves.toBeUndefined();
    expect(deviceStore.claimSignature).toHaveBeenCalledWith(
      KIOSK_ID,
      expect.any(String),
    );
  });

  it('rejects a signature over a different body', async () => {
    const ts = String(Date.now());
    const req = request(
      {
        'x-kiosk-signature': key.signRequest(
          'POST',
          URL,
          ts,
          '{"hello":"evil"}',
        ),
        'x-kiosk-timestamp': ts,
      },
      BODY,
    );
    await expect(
      verifier.verify(req, KIOSK_ID, key.publicKey),
    ).rejects.toBeInstanceOf(KioskSignatureInvalidException);
  });

  it('rejects a stale timestamp even when correctly signed', async () => {
    const ts = String(
      Date.now() - (KIOSK_SIGNATURE_MAX_SKEW_SECONDS + 5) * 1000,
    );
    const req = request(
      {
        'x-kiosk-signature': key.signRequest('POST', URL, ts, BODY),
        'x-kiosk-timestamp': ts,
      },
      BODY,
    );
    await expect(
      verifier.verify(req, KIOSK_ID, key.publicKey),
    ).rejects.toBeInstanceOf(KioskSignatureInvalidException);
  });

  it('rejects a replayed signature', async () => {
    deviceStore.claimSignature.mockResolvedValue(false);
    const ts = String(Date.now());
    const req = request(
      {
        'x-kiosk-signature': key.signRequest('POST', URL, ts, BODY),
        'x-kiosk-timestamp': ts,
      },
      BODY,
    );
    await expect(
      verifier.verify(req, KIOSK_ID, key.publicKey),
    ).rejects.toBeInstanceOf(KioskSignatureInvalidException);
  });

  it('rejects missing headers', async () => {
    await expect(
      verifier.verify(request({}, BODY), KIOSK_ID, key.publicKey),
    ).rejects.toBeInstanceOf(KioskSignatureInvalidException);
  });
});

describe('KioskDeviceGuard', () => {
  const key = createDeviceKey();
  const verifier = new KioskSignatureVerifier(
    deviceStore as unknown as KioskDeviceStore,
  );
  const guard = new KioskDeviceGuard(
    kioskService as unknown as KioskService,
    kiosksRepository as unknown as KiosksRepository,
    verifier,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    defaultMocks();
    kioskService.resolveActiveDevice.mockResolvedValue(DEVICE);
    kiosksRepository.findDeviceById.mockResolvedValue(
      kioskRow({ publicKey: key.publicKey, pairedAt: new Date() }),
    );
  });

  function signedRequest(extra: Record<string, string> = {}) {
    const ts = String(Date.now());
    return request(
      {
        authorization: 'Bearer session-jwt',
        'x-kiosk-signature': key.signRequest('POST', URL, ts, BODY),
        'x-kiosk-timestamp': ts,
        ...extra,
      },
      BODY,
    );
  }

  it('authenticates the device and sets the kiosk tenant', async () => {
    const req = signedRequest();
    await runAsDevice(async () => {
      const ctx = getRequestContext()!;
      ctx.organizationId = undefined;
      await expect(guard.canActivate(context(req))).resolves.toBe(true);
      expect(getRequestContext()?.organizationId).toBe(ORG_A);
    });
    expect(req.kiosk).toEqual(DEVICE);
    expect(kioskService.resolveActiveDevice).toHaveBeenCalledWith(
      'session-jwt',
    );
    expect(kioskService.touchLastSeen).toHaveBeenCalledWith(KIOSK_ID, ORG_A);
  });

  it('requires a bearer session', async () => {
    const req = signedRequest({ authorization: '' });
    await expect(guard.canActivate(context(req))).rejects.toBeInstanceOf(
      KioskAuthenticationException,
    );
  });

  it('rejects kiosks that have not been paired', async () => {
    kiosksRepository.findDeviceById.mockResolvedValue(kioskRow());
    await expect(
      guard.canActivate(context(signedRequest())),
    ).rejects.toBeInstanceOf(KioskNotPairedException);
  });

  it('rejects requests signed by another key', async () => {
    kiosksRepository.findDeviceById.mockResolvedValue(
      kioskRow({ publicKey: createDeviceKey().publicKey }),
    );
    await expect(
      guard.canActivate(context(signedRequest())),
    ).rejects.toBeInstanceOf(KioskSignatureInvalidException);
  });
});

describe('KioskDeviceSignatureGuard', () => {
  const key = createDeviceKey();
  const guard = new KioskDeviceSignatureGuard(
    kiosksRepository as unknown as KiosksRepository,
    new KioskSignatureVerifier(deviceStore as unknown as KioskDeviceStore),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    defaultMocks();
  });

  it('authenticates by kiosk id and device signature alone', async () => {
    kiosksRepository.findDeviceById.mockResolvedValue(
      kioskRow({ publicKey: key.publicKey }),
    );
    const ts = String(Date.now());
    const req = request(
      {
        'x-kiosk-id': KIOSK_ID,
        'x-kiosk-signature': key.signRequest('POST', URL, ts, BODY),
        'x-kiosk-timestamp': ts,
      },
      BODY,
    );
    await expect(guard.canActivate(context(req))).resolves.toBe(true);
    expect(req.kiosk?.kioskId).toBe(KIOSK_ID);
  });

  it('rejects inactive kiosks and malformed ids', async () => {
    kiosksRepository.findDeviceById.mockResolvedValue(
      kioskRow({ publicKey: key.publicKey, status: 'INACTIVE' }),
    );
    await expect(
      guard.canActivate(context(request({ 'x-kiosk-id': KIOSK_ID }, BODY))),
    ).rejects.toBeInstanceOf(KioskAuthenticationException);
    await expect(
      guard.canActivate(context(request({ 'x-kiosk-id': 'nope' }, BODY))),
    ).rejects.toBeInstanceOf(KioskAuthenticationException);
  });
});
