// Shared test

import { generateKeyPairSync, sign } from 'node:crypto';
import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import type { AttendanceService } from '@/modules/features/hr/attendance.service';
import type { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import type { KioskCredentialsRepository } from './kiosk-credentials.repository';
import { KioskCredentialsService } from './kiosk-credentials.service';
import { kioskSigningPayload } from './kiosk-device.crypto';
import { KioskDeviceService } from './kiosk-device.service';
import type { KioskDeviceStore } from './kiosk-device.store';
import type { KioskDeviceContext, KioskService } from './kiosk.service';
import type { KiosksRepository } from './kiosks.repository';

export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const KIOSK_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const OTHER_KIOSK_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const EMPLOYEE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const USER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
export const DEVICE_TOKEN = 'device-token-123456';

export const DEVICE: KioskDeviceContext = {
  kioskId: KIOSK_ID,
  deviceId: 'KSK-ABCDEF',
  organizationId: ORG_A,
};

export function createDeviceKey() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
  return {
    publicKey: publicKey
      .export({ type: 'spki', format: 'der' })
      .toString('base64'),
    signRequest(
      method: string,
      url: string,
      timestamp: string,
      body?: string,
    ): string {
      return sign(
        'sha256',
        Buffer.from(kioskSigningPayload(method, url, timestamp, body)),
        privateKey,
      ).toString('base64');
    },
  };
}

export function kioskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: KIOSK_ID,
    organizationId: ORG_A,
    deviceId: 'KSK-ABCDEF',
    name: 'Main gate',
    status: 'ACTIVE' as const,
    tokenHash: 'hash',
    registeredAt: new Date('2026-01-01T00:00:00Z'),
    lastSeenAt: null,
    publicKey: null as string | null,
    pairedAt: null as Date | null,
    attestationStatus: 'NONE' as const,
    attestationChain: null,
    deviceInfo: null,
    appVersion: null,
    verificationPolicy: 'FACE_OR_FINGER' as
      | 'FACE_ONLY'
      | 'FACE_OR_FINGER'
      | 'FACE_AND_FINGER'
      | 'CARD_AND_FACE'
      | 'CARD_AND_FINGER',
    adminPinHash: null as string | null,
    lastHeartbeat: null,
    lastHeartbeatAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  fullName: 'Dawit Haile',
  status: 'active',
  archivedAt: null as Date | null,
};

export const kiosksRepository = {
  findByTokenHash: jest.fn(),
  findDeviceById: jest.fn(),
  update: jest.fn(),
  touchLastSeen: jest.fn(),
};

export const employeesRepository = {
  findById: jest.fn(),
  listForKioskRoster: jest.fn(),
};

export const attendanceService = {
  findByClientEventId: jest.fn(),
  punchDevice: jest.fn(),
  getCurrentState: jest.fn(),
};

export const deviceStore = {
  issueEnrollCode: jest.fn(),
  consumeEnrollCode: jest.fn(),
  claimSignature: jest.fn(),
};

export const kioskService = {
  issueSessionToken: jest.fn(() => ({
    sessionToken: 'session-jwt',
    expiresAt: '2026-01-01T12:00:00.000Z',
  })),
  resolveActiveDevice: jest.fn(),
  touchLastSeen: jest.fn(),
};

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const deviceService = new KioskDeviceService(
  kioskService as unknown as KioskService,
  kiosksRepository as unknown as KiosksRepository,
  employeesRepository as unknown as EmployeesRepository,
  attendanceService as unknown as AttendanceService,
  deviceStore as unknown as KioskDeviceStore,
  auditService,
);

export const credentialsRepository = {
  insertTemplate: jest.fn(),
  revokeActiveTemplates: jest.fn(),
  findTemplateById: jest.fn(),
  revokeTemplate: jest.fn(),
  listTemplatesSince: jest.fn(),
  listTemplatesForEmployee: jest.fn(),
  findActiveCardByHash: jest.fn(),
  insertCard: jest.fn(),
  findCardById: jest.fn(),
  revokeCard: jest.fn(),
  listCardsSince: jest.fn(),
  listCardsForEmployee: jest.fn(),
};

export const credentialsService = new KioskCredentialsService(
  credentialsRepository as unknown as KioskCredentialsRepository,
  employeesRepository as unknown as EmployeesRepository,
  auditService,
);

export const mockTx = { sentinel: 'tx' };

export function setupTransactionMock(): void {
  (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  );
}

export function defaultMocks(): void {
  kiosksRepository.findByTokenHash.mockResolvedValue(kioskRow());
  kiosksRepository.findDeviceById.mockResolvedValue(
    kioskRow({ publicKey: 'pk', pairedAt: new Date() }),
  );
  kiosksRepository.update.mockImplementation(
    async (_id: string, data: Record<string, unknown>) => kioskRow(data),
  );
  employeesRepository.findById.mockResolvedValue(EMPLOYEE);
  attendanceService.findByClientEventId.mockResolvedValue(undefined);
  attendanceService.punchDevice.mockImplementation(
    async (input: {
      eventType: string;
      eventAt: Date;
      clientEventId: string;
    }) => ({
      id: `event-${input.clientEventId}`,
      employeeId: EMPLOYEE_ID,
      eventType: input.eventType,
      eventAt: input.eventAt,
      clientEventId: input.clientEventId,
    }),
  );
  deviceStore.claimSignature.mockResolvedValue(true);
  deviceStore.issueEnrollCode.mockResolvedValue(true);
  auditRecord.mockResolvedValue(undefined);
}

export function runAsDevice<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      organizationId: ORG_A,
      roles: [],
      permissions: [],
    },
    callback,
  );
}
