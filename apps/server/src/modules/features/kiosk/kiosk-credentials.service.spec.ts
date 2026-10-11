import { randomBytes } from 'node:crypto';
import { Logger } from '@nestjs/common';
import {
  EMPLOYEE,
  EMPLOYEE_ID,
  KIOSK_ID,
  ORG_A,
  USER_ID,
  auditRecord,
  credentialsRepository,
  credentialsService,
  defaultMocks,
  employeesRepository,
  mockTx,
  runAsDevice,
  setupTransactionMock,
} from './kiosk-device.spec-harness';
import {
  cardUidHash,
  decryptTemplate,
  encryptTemplate,
} from './kiosk-device.crypto';
import { resolveTemplateKey } from './kiosk-credentials.service';
import { KioskCardConflictException } from './kiosk.exception';
import { EmployeeArchivedException } from '@/modules/features/hr/hr.exception';

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

const ACTOR = { kioskId: KIOSK_ID, userId: USER_ID };
const TEMPLATE = randomBytes(256).toString('base64');
const KEY = randomBytes(32);

function templateRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'template-1',
    organizationId: ORG_A,
    employeeId: EMPLOYEE_ID,
    kind: 'FACE' as const,
    fingerIndex: null,
    algorithmVersion: 'sim-1',
    templateCiphertext: encryptTemplate(KEY, TEMPLATE),
    enrolledByKioskId: KIOSK_ID,
    enrolledByUserId: USER_ID,
    consentAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    revokedAt: null as Date | null,
    ...overrides,
  };
}

describe('KioskCredentialsService', () => {
  const previousKey = process.env.KIOSK_TEMPLATE_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.KIOSK_TEMPLATE_ENCRYPTION_KEY = KEY.toString('base64');
  });

  afterAll(() => {
    process.env.KIOSK_TEMPLATE_ENCRYPTION_KEY = previousKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
    credentialsRepository.revokeActiveTemplates.mockResolvedValue([
      { id: 'template-old' },
    ]);
    credentialsRepository.insertTemplate.mockImplementation(
      async (data: Record<string, unknown>) => templateRow(data),
    );
  });

  it('uses the configured key', () => {
    expect(resolveTemplateKey()).toEqual(KEY);
  });

  describe('enrollTemplate', () => {
    it('revokes the previous template and stores only ciphertext', async () => {
      const result = await runAsDevice(() =>
        credentialsService.enrollTemplate(ORG_A, ACTOR, {
          employeeId: EMPLOYEE_ID,
          kind: 'FINGER',
          fingerIndex: 1,
          algorithmVersion: 'sim-1',
          template: TEMPLATE,
          consentAt: new Date('2026-01-01T00:00:00Z'),
        }),
      );

      expect(credentialsRepository.revokeActiveTemplates).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        'FINGER',
        1,
        mockTx,
      );
      const inserted = credentialsRepository.insertTemplate.mock
        .calls[0][0] as {
        templateCiphertext: string;
        enrolledByKioskId: string;
        enrolledByUserId: string;
      };
      expect(inserted.templateCiphertext).not.toContain(TEMPLATE);
      expect(decryptTemplate(KEY, inserted.templateCiphertext)).toBe(TEMPLATE);
      expect(inserted.enrolledByKioskId).toBe(KIOSK_ID);
      expect(inserted.enrolledByUserId).toBe(USER_ID);
      expect(result.template).toBe(TEMPLATE);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'hr.credential.template.enroll',
          after: expect.objectContaining({ replaced: ['template-old'] }),
        }),
        mockTx,
      );
    });

    it('refuses archived employees', async () => {
      employeesRepository.findById.mockResolvedValueOnce({
        ...EMPLOYEE,
        archivedAt: new Date(),
      });
      await expect(
        runAsDevice(() =>
          credentialsService.enrollTemplate(ORG_A, ACTOR, {
            employeeId: EMPLOYEE_ID,
            kind: 'FACE',
            algorithmVersion: 'sim-1',
            template: TEMPLATE,
            consentAt: new Date(),
          }),
        ),
      ).rejects.toBeInstanceOf(EmployeeArchivedException);
    });
  });

  describe('syncTemplates', () => {
    it('decrypts active templates and nulls revoked ones in a delta', async () => {
      const since = new Date('2026-01-01T00:00:00Z');
      credentialsRepository.listTemplatesSince.mockResolvedValue([
        templateRow(),
        templateRow({
          id: 'template-2',
          revokedAt: new Date('2026-01-02T00:00:00Z'),
        }),
      ]);

      const result = await runAsDevice(() =>
        credentialsService.syncTemplates(since),
      );

      expect(credentialsRepository.listTemplatesSince).toHaveBeenCalledWith(
        since,
      );
      expect(result.templates).toEqual([
        expect.objectContaining({
          id: 'template-1',
          template: TEMPLATE,
          revokedAt: null,
        }),
        expect.objectContaining({
          id: 'template-2',
          template: null,
          revokedAt: '2026-01-02T00:00:00.000Z',
        }),
      ]);
      expect(new Date(result.serverTime).getTime()).not.toBeNaN();
    });

    it('skips a template that cannot be decrypted and returns the rest', async () => {
      const warn = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      // Encrypted under a different key (e.g. the JWT_SECRET-derived dev key).
      const foreignCiphertext = encryptTemplate(randomBytes(32), TEMPLATE);
      credentialsRepository.listTemplatesSince.mockResolvedValue([
        templateRow(),
        templateRow({
          id: 'template-bad',
          templateCiphertext: foreignCiphertext,
        }),
        templateRow({ id: 'template-3' }),
        templateRow({
          id: 'template-4',
          templateCiphertext: foreignCiphertext,
          revokedAt: new Date('2026-01-02T00:00:00Z'),
        }),
      ]);

      const before = Date.now();
      const result = await runAsDevice(() =>
        credentialsService.syncTemplates(new Date('2026-01-01T00:00:00Z')),
      );

      expect(result.templates).toEqual([
        expect.objectContaining({ id: 'template-1', template: TEMPLATE }),
        expect.objectContaining({ id: 'template-3', template: TEMPLATE }),
        // Revoked rows are never decrypted, so they still propagate.
        expect.objectContaining({ id: 'template-4', template: null }),
      ]);
      // The cursor still advances past the skipped row.
      expect(new Date(result.serverTime).getTime()).toBeGreaterThanOrEqual(
        before,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      const message = String(warn.mock.calls[0][0]);
      expect(message).toContain('template-bad');
      expect(message).not.toContain(TEMPLATE);
      expect(message).not.toContain(foreignCiphertext);
      expect(message).not.toContain(KEY.toString('base64'));
      warn.mockRestore();
    });
  });

  describe('bindCard', () => {
    it('stores the org-scoped UID hash and suffix', async () => {
      credentialsRepository.findActiveCardByHash.mockResolvedValue(undefined);
      credentialsRepository.insertCard.mockImplementation(
        async (data: Record<string, unknown>) => ({
          id: 'card-1',
          revokedAt: null,
          createdAt: new Date(),
          ...data,
        }),
      );

      const card = await runAsDevice(() =>
        credentialsService.bindCard(ORG_A, ACTOR, {
          employeeId: EMPLOYEE_ID,
          uid: '04a1b2c3',
        }),
      );

      expect(credentialsRepository.insertCard).toHaveBeenCalledWith(
        expect.objectContaining({
          uidHash: cardUidHash(ORG_A, '04A1B2C3'),
          uidSuffix: 'B2C3',
        }),
        mockTx,
      );
      expect(card).toEqual({
        id: 'card-1',
        employeeId: EMPLOYEE_ID,
        uidHash: cardUidHash(ORG_A, '04A1B2C3'),
        revokedAt: null,
      });
    });

    it('refuses a card already assigned to another employee', async () => {
      credentialsRepository.findActiveCardByHash.mockResolvedValue({
        id: 'card-9',
        employeeId: 'someone-else',
      });
      await expect(
        runAsDevice(() =>
          credentialsService.bindCard(ORG_A, ACTOR, {
            employeeId: EMPLOYEE_ID,
            uid: '04A1B2C3',
          }),
        ),
      ).rejects.toBeInstanceOf(KioskCardConflictException);
      expect(credentialsRepository.insertCard).not.toHaveBeenCalled();
    });
  });
});
