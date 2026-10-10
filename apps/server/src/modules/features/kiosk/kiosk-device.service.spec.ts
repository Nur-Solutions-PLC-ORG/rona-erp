import { randomUUID, X509Certificate } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import { KIOSK_OFFLINE_MAX_AGE_HOURS } from '@rona/config/kiosk';
import type { KioskDevicePunchInput } from '@rona/types/kiosk';
import { rateLimit } from '@/redis';
import { AttendanceSequenceConflictException } from '@/modules/features/hr/hr.exception';
import {
  DEVICE,
  DEVICE_TOKEN,
  EMPLOYEE,
  EMPLOYEE_ID,
  KIOSK_ID,
  ORG_A,
  OTHER_KIOSK_ID,
  USER_ID,
  attendanceService,
  auditRecord,
  createDeviceKey,
  defaultMocks,
  deviceService,
  deviceStore,
  employeesRepository,
  kioskRow,
  kiosksRepository,
  runAsDevice,
  setupTransactionMock,
} from './kiosk-device.spec-harness';
import {
  TEST_ATTESTATION_LEAF_CERT,
  TEST_ATTESTATION_ROOT_CERT,
} from './kiosk-attestation.spec-harness';
import {
  KioskAuthenticationException,
  KioskEmployeeInactiveException,
  KioskEnrollCodeInvalidException,
  KioskEnrollUnauthorizedException,
  KioskPolicyNotSatisfiedException,
  KioskPublicKeyInvalidException,
} from './kiosk.exception';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

interface SelectChain {
  from: jest.Mock<SelectChain>;
  where: jest.Mock<SelectChain>;
  limit: jest.Mock<Promise<Record<string, string>[]>>;
}

const selectChain: SelectChain = {
  from: jest.fn((): SelectChain => selectChain),
  where: jest.fn((): SelectChain => selectChain),
  limit: jest.fn(async () => [
    {
      name: 'Acme',
      logoUrl: 'https://acme.test/logo.png',
      fullName: 'Hana HR',
    },
  ]),
};

jest.mock('@/db', () => ({
  db: { select: jest.fn((): SelectChain => selectChain) },
  pooledDb: { transaction: jest.fn() },
}));

jest.mock('@/redis', () => ({
  rateLimit: jest.fn(async () => true),
  redisClient: {},
}));

const DEVICE_INFO = {
  manufacturer: 'ZKTeco',
  model: 'SpeedFace',
  androidVersion: '11',
  sdkInt: 30,
  appVersion: '0.1.0',
  engine: 'SIM' as const,
  capabilities: ['FACE' as const, 'CARD' as const],
};

function punchInput(
  overrides: Partial<KioskDevicePunchInput> = {},
): KioskDevicePunchInput {
  return {
    clientEventId: randomUUID(),
    employeeId: EMPLOYEE_ID,
    eventType: 'CLOCK_IN',
    methods: ['FACE'],
    matchScore: 92,
    deviceEventAt: new Date(),
    ...overrides,
  };
}

describe('KioskDeviceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
    (rateLimit as jest.Mock).mockResolvedValue(true);
  });

  describe('register', () => {
    it('pairs the terminal, stores its key and returns a branded session', async () => {
      const key = createDeviceKey();
      const session = await runAsDevice(() =>
        deviceService.register({
          deviceToken: DEVICE_TOKEN,
          publicKey: key.publicKey,
          attestationChain: [],
          device: DEVICE_INFO,
        }),
      );

      expect(kiosksRepository.update).toHaveBeenCalledWith(
        KIOSK_ID,
        expect.objectContaining({
          publicKey: key.publicKey,
          attestationStatus: 'NONE',
          deviceInfo: DEVICE_INFO,
          appVersion: '0.1.0',
          pairedAt: expect.any(Date),
        }),
      );
      expect(session).toEqual(
        expect.objectContaining({
          sessionToken: 'session-jwt',
          kiosk: expect.objectContaining({
            id: KIOSK_ID,
            verificationPolicy: 'FACE_OR_FINGER',
            hasAdminPin: false,
          }),
          organization: {
            id: ORG_A,
            name: 'Acme',
            logoUrl: 'https://acme.test/logo.png',
          },
        }),
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kiosk.device.pair' }),
      );
    });

    it('records CHAIN_VALID for a consistent attestation chain', async () => {
      const leafKey = new X509Certificate(
        Buffer.from(TEST_ATTESTATION_LEAF_CERT, 'base64'),
      ).publicKey
        .export({ type: 'spki', format: 'der' })
        .toString('base64');

      await runAsDevice(() =>
        deviceService.register({
          deviceToken: DEVICE_TOKEN,
          publicKey: leafKey,
          attestationChain: [
            TEST_ATTESTATION_LEAF_CERT,
            TEST_ATTESTATION_ROOT_CERT,
          ],
          device: DEVICE_INFO,
        }),
      );

      expect(kiosksRepository.update).toHaveBeenCalledWith(
        KIOSK_ID,
        expect.objectContaining({ attestationStatus: 'CHAIN_VALID' }),
      );
    });

    it('audits a re-pair when a different key replaces the stored one', async () => {
      kiosksRepository.findByTokenHash.mockResolvedValue(
        kioskRow({ publicKey: createDeviceKey().publicKey }),
      );
      await runAsDevice(() =>
        deviceService.register({
          deviceToken: DEVICE_TOKEN,
          publicKey: createDeviceKey().publicKey,
          device: DEVICE_INFO,
        }),
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kiosk.device.repair' }),
      );
    });

    it('rejects unknown or inactive device tokens', async () => {
      kiosksRepository.findByTokenHash.mockResolvedValueOnce(undefined);
      await expect(
        runAsDevice(() =>
          deviceService.register({
            deviceToken: 'nope',
            publicKey: createDeviceKey().publicKey,
            device: DEVICE_INFO,
          }),
        ),
      ).rejects.toBeInstanceOf(KioskAuthenticationException);

      kiosksRepository.findByTokenHash.mockResolvedValueOnce(
        kioskRow({ status: 'INACTIVE' }),
      );
      await expect(
        runAsDevice(() =>
          deviceService.register({
            deviceToken: DEVICE_TOKEN,
            publicKey: createDeviceKey().publicKey,
            device: DEVICE_INFO,
          }),
        ),
      ).rejects.toBeInstanceOf(KioskAuthenticationException);
      expect(kiosksRepository.update).not.toHaveBeenCalled();
    });

    it('rejects a public key that is not an EC SPKI key', async () => {
      await expect(
        runAsDevice(() =>
          deviceService.register({
            deviceToken: DEVICE_TOKEN,
            publicKey: 'AAAA',
            device: DEVICE_INFO,
          }),
        ),
      ).rejects.toBeInstanceOf(KioskPublicKeyInvalidException);
    });

    it('fails when rate limited', async () => {
      (rateLimit as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        runAsDevice(() =>
          deviceService.register({
            deviceToken: DEVICE_TOKEN,
            publicKey: createDeviceKey().publicKey,
            device: DEVICE_INFO,
          }),
        ),
      ).rejects.toBeInstanceOf(KioskAuthenticationException);
    });
  });

  describe('punch', () => {
    it('records a verified punch at server time with provenance', async () => {
      const input = punchInput({
        deviceEventAt: new Date(Date.now() - 60_000),
      });
      const result = await runAsDevice(() =>
        deviceService.punch(DEVICE, input),
      );

      expect(attendanceService.punchDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          kioskId: KIOSK_ID,
          methods: ['FACE'],
          matchScore: 92,
          clientEventId: input.clientEventId,
          deviceEventAt: input.deviceEventAt,
        }),
      );
      const recordedAt = (
        attendanceService.punchDevice.mock.calls[0][0] as { eventAt: Date }
      ).eventAt;
      expect(recordedAt.getTime()).toBeGreaterThan(
        input.deviceEventAt.getTime(),
      );
      expect(result).toEqual(
        expect.objectContaining({
          clientEventId: input.clientEventId,
          employeeName: EMPLOYEE.fullName,
          duplicate: false,
        }),
      );
    });

    it('is idempotent on clientEventId', async () => {
      const input = punchInput();
      attendanceService.findByClientEventId.mockResolvedValue({
        id: 'event-existing',
        clientEventId: input.clientEventId,
        employeeId: EMPLOYEE_ID,
        eventType: 'CLOCK_IN',
        eventAt: new Date('2026-01-01T08:00:00Z'),
      });

      const result = await runAsDevice(() =>
        deviceService.punch(DEVICE, input),
      );

      expect(attendanceService.punchDevice).not.toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({ eventId: 'event-existing', duplicate: true }),
      );
    });

    it('returns the existing event when a concurrent insert wins the race', async () => {
      const input = punchInput();
      attendanceService.findByClientEventId
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({
          id: 'event-raced',
          clientEventId: input.clientEventId,
          employeeId: EMPLOYEE_ID,
          eventType: 'CLOCK_IN',
          eventAt: new Date(),
        });
      attendanceService.punchDevice.mockRejectedValueOnce(
        Object.assign(new Error('duplicate'), {
          cause: {
            code: '23505',
            constraint: 'attendance_events_organization_client_event_unique',
          },
        }),
      );

      const result = await runAsDevice(() =>
        deviceService.punch(DEVICE, input),
      );
      expect(result).toEqual(
        expect.objectContaining({ eventId: 'event-raced', duplicate: true }),
      );
    });

    it('rejects methods that do not satisfy the kiosk policy (card alone)', async () => {
      kiosksRepository.findDeviceById.mockResolvedValue(
        kioskRow({ publicKey: 'pk', verificationPolicy: 'CARD_AND_FACE' }),
      );
      await expect(
        runAsDevice(() =>
          deviceService.punch(DEVICE, punchInput({ methods: ['CARD'] })),
        ),
      ).rejects.toBeInstanceOf(KioskPolicyNotSatisfiedException);
      expect(attendanceService.punchDevice).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'kiosk.attendance.policy_rejected' }),
      );
    });

    it('rejects inactive or archived employees', async () => {
      employeesRepository.findById.mockResolvedValueOnce({
        ...EMPLOYEE,
        status: 'suspended',
      });
      await expect(
        runAsDevice(() => deviceService.punch(DEVICE, punchInput())),
      ).rejects.toBeInstanceOf(KioskEmployeeInactiveException);

      employeesRepository.findById.mockResolvedValueOnce({
        ...EMPLOYEE,
        archivedAt: new Date(),
      });
      await expect(
        runAsDevice(() => deviceService.punch(DEVICE, punchInput())),
      ).rejects.toBeInstanceOf(KioskEmployeeInactiveException);
      expect(attendanceService.punchDevice).not.toHaveBeenCalled();
    });

    it('returns 429 when rate limited', async () => {
      (rateLimit as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        runAsDevice(() => deviceService.punch(DEVICE, punchInput())),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });
  });

  describe('punchBatch', () => {
    it('records events in device order at their device time', async () => {
      const now = Date.now();
      const later = punchInput({
        eventType: 'CLOCK_OUT',
        deviceEventAt: new Date(now - 60 * 60_000),
      });
      const earlier = punchInput({
        eventType: 'CLOCK_IN',
        deviceEventAt: new Date(now - 4 * 60 * 60_000),
      });

      const { results } = await runAsDevice(() =>
        deviceService.punchBatch(DEVICE, [later, earlier]),
      );

      const calls = attendanceService.punchDevice.mock.calls.map(
        (call) => call[0] as { eventType: string; eventAt: Date },
      );
      expect(calls.map((c) => c.eventType)).toEqual(['CLOCK_IN', 'CLOCK_OUT']);
      expect(calls[0].eventAt).toEqual(earlier.deviceEventAt);
      expect(results.map((r) => r.status)).toEqual(['RECORDED', 'RECORDED']);
    });

    it('clamps future device times to now', async () => {
      const future = punchInput({
        deviceEventAt: new Date(Date.now() + 60_000),
      });
      await runAsDevice(() => deviceService.punchBatch(DEVICE, [future]));
      const eventAt = (
        attendanceService.punchDevice.mock.calls[0][0] as { eventAt: Date }
      ).eventAt;
      expect(eventAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('returns per-event results: too old, duplicate, sequence conflict, recorded', async () => {
      const now = Date.now();
      const tooOld = punchInput({
        deviceEventAt: new Date(
          now - (KIOSK_OFFLINE_MAX_AGE_HOURS + 1) * 3600_000,
        ),
      });
      const duplicate = punchInput({ deviceEventAt: new Date(now - 3000) });
      const conflict = punchInput({ deviceEventAt: new Date(now - 2000) });
      const ok = punchInput({ deviceEventAt: new Date(now - 1000) });

      attendanceService.findByClientEventId.mockImplementation(
        async (id: string) =>
          id === duplicate.clientEventId
            ? {
                id: 'event-dup',
                clientEventId: id,
                employeeId: EMPLOYEE_ID,
                eventType: 'CLOCK_IN',
                eventAt: new Date(),
              }
            : undefined,
      );
      attendanceService.punchDevice.mockImplementation(
        async (input: {
          clientEventId: string;
          eventType: string;
          eventAt: Date;
        }) => {
          if (input.clientEventId === conflict.clientEventId) {
            throw new AttendanceSequenceConflictException('Invalid sequence');
          }
          return {
            id: 'event-ok',
            employeeId: EMPLOYEE_ID,
            eventType: input.eventType,
            eventAt: input.eventAt,
          };
        },
      );

      const { results } = await runAsDevice(() =>
        deviceService.punchBatch(DEVICE, [ok, conflict, duplicate, tooOld]),
      );

      const byId = new Map(results.map((r) => [r.clientEventId, r]));
      expect(byId.get(tooOld.clientEventId)).toEqual(
        expect.objectContaining({
          status: 'REJECTED',
          error: expect.objectContaining({
            statusCode: HttpStatus.BAD_REQUEST,
          }),
        }),
      );
      expect(byId.get(duplicate.clientEventId)?.status).toBe('DUPLICATE');
      expect(byId.get(conflict.clientEventId)).toEqual(
        expect.objectContaining({
          status: 'REJECTED',
          error: {
            statusCode: HttpStatus.CONFLICT,
            message: 'Invalid sequence',
          },
        }),
      );
      expect(byId.get(ok.clientEventId)?.status).toBe('RECORDED');
      expect(results.map((r) => r.clientEventId)).toEqual([
        tooOld.clientEventId,
        duplicate.clientEventId,
        conflict.clientEventId,
        ok.clientEventId,
      ]);
    });

    it('propagates unexpected (non-HTTP) failures so the terminal retries', async () => {
      attendanceService.punchDevice.mockRejectedValueOnce(new Error('db down'));
      await expect(
        runAsDevice(() => deviceService.punchBatch(DEVICE, [punchInput()])),
      ).rejects.toThrow('db down');
    });
  });

  describe('enrollment', () => {
    it('creates a one-time code for the supervisor', async () => {
      const result = await deviceService.createEnrollCode(ORG_A, USER_ID);
      expect(result.code).toMatch(/^\d{6}$/);
      expect(deviceStore.issueEnrollCode).toHaveBeenCalledWith(result.code, {
        organizationId: ORG_A,
        userId: USER_ID,
        supervisorName: 'Hana HR',
      });
    });

    it('exchanges a valid code for an enroll token bound to this kiosk', async () => {
      deviceStore.consumeEnrollCode.mockResolvedValue({
        organizationId: ORG_A,
        userId: USER_ID,
        supervisorName: 'Hana HR',
      });

      const result = await runAsDevice(() =>
        deviceService.authorizeEnrollment(DEVICE, '123456'),
      );

      expect(deviceStore.consumeEnrollCode).toHaveBeenCalledWith(
        ORG_A,
        '123456',
      );
      expect(result.supervisorName).toBe('Hana HR');
      expect(
        deviceService.verifyEnrollToken(DEVICE, result.enrollToken),
      ).toEqual({
        kioskId: KIOSK_ID,
        userId: USER_ID,
      });
      expect(() =>
        deviceService.verifyEnrollToken(
          { ...DEVICE, kioskId: OTHER_KIOSK_ID },
          result.enrollToken,
        ),
      ).toThrow(KioskEnrollUnauthorizedException);
    });

    it('rejects an unknown or already used code', async () => {
      deviceStore.consumeEnrollCode.mockResolvedValue(null);
      await expect(
        runAsDevice(() => deviceService.authorizeEnrollment(DEVICE, '000000')),
      ).rejects.toBeInstanceOf(KioskEnrollCodeInvalidException);
    });

    it('rejects missing or forged enroll tokens', () => {
      expect(() => deviceService.verifyEnrollToken(DEVICE, undefined)).toThrow(
        KioskEnrollUnauthorizedException,
      );
      expect(() => deviceService.verifyEnrollToken(DEVICE, 'a.b.c')).toThrow(
        KioskEnrollUnauthorizedException,
      );
    });
  });

  describe('employeeStatus', () => {
    it('returns the allowed next events', async () => {
      attendanceService.getCurrentState.mockResolvedValue({
        employeeId: EMPLOYEE_ID,
        currentState: 'CLOCK_IN',
        lastEvent: { eventAt: new Date('2026-01-01T08:00:00Z') },
      });
      const status = await runAsDevice(() =>
        deviceService.employeeStatus(EMPLOYEE_ID),
      );
      expect(status).toEqual({
        employeeId: EMPLOYEE_ID,
        employeeName: EMPLOYEE.fullName,
        currentState: 'CLOCK_IN',
        allowedNextEvents: ['BREAK_START', 'CLOCK_OUT'],
        lastEventAt: '2026-01-01T08:00:00.000Z',
      });
    });
  });
});
