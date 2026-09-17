import {
  DEVICE,
  EMPLOYEE,
  EMPLOYEE_ID,
  ENROLLED_AT,
  EVENT_AT,
  FACE_ID,
  FACE_MATCH,
  FACE_ROW,
  FACIAL_ID,
  KIOSK_ID,
  ORG_A,
  ORG_B,
  auditRecord,
  defaultMocks,
  empFindById,
  faceRepository,
  mockTx,
  punchKiosk,
  repoFindActiveByFacialId,
  repoInsertEnrollment,
  repoList,
  repoMarkUsed,
  repoRevoke,
  repoRevokeExisting,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './face.spec-harness';
import { rateLimit } from '@/redis';
import {
  EmployeeArchivedException,
  EmployeeFaceConflictException,
  EmployeeFaceNotFoundException,
  EmployeeNotFoundException,
} from './hr.exception';
import {
  KioskEmployeeInactiveException,
  KioskFaceNotRecognizedException,
} from '../kiosk/kiosk.exception';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

jest.mock('@/redis', () => ({
  redisClient: {},
  rateLimit: jest.fn(),
}));

describe('FaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('listFaces', () => {
    it('returns enrolled faces for an active employee', async () => {
      repoList.mockResolvedValue([FACE_ROW]);

      const result = await runInOrganizationA(() =>
        service.listFaces(EMPLOYEE_ID),
      );

      expect(repoList).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(result.faces).toEqual([
        {
          id: FACE_ID,
          enrolledAt: ENROLLED_AT.toISOString(),
          lastUsedAt: null,
          revokedAt: null,
        },
      ]);
    });

    it('throws when the employee does not exist', async () => {
      empFindById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.listFaces(EMPLOYEE_ID)),
      ).rejects.toThrow(EmployeeNotFoundException);
      expect(repoList).not.toHaveBeenCalled();
    });

    it('throws when the employee is archived', async () => {
      empFindById.mockResolvedValue({ ...EMPLOYEE, archivedAt: new Date() });

      await expect(
        runInOrganizationA(() => service.listFaces(EMPLOYEE_ID)),
      ).rejects.toThrow(EmployeeArchivedException);
    });
  });

  describe('enrollFace', () => {
    it('stores an enrollment, revokes previous faces and audits', async () => {
      const result = await runInOrganizationA(() =>
        service.enrollFace(EMPLOYEE_ID, { facialId: FACIAL_ID }),
      );

      expect(repoFindActiveByFacialId).toHaveBeenCalledWith(FACIAL_ID);
      expect(repoRevokeExisting).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
      expect(repoInsertEnrollment).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          facialId: FACIAL_ID,
        },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.face.enroll',
          entityType: 'employee_face',
          entityId: FACE_ID,
        }),
        mockTx,
      );
      expect(result.face).toEqual({
        id: FACE_ID,
        enrolledAt: ENROLLED_AT.toISOString(),
        lastUsedAt: null,
        revokedAt: null,
      });
    });

    it('rejects when the facial ID is already active for an employee', async () => {
      repoFindActiveByFacialId.mockResolvedValue(FACE_MATCH);

      await expect(
        runInOrganizationA(() =>
          service.enrollFace(EMPLOYEE_ID, { facialId: FACIAL_ID }),
        ),
      ).rejects.toThrow(EmployeeFaceConflictException);
      expect(repoInsertEnrollment).not.toHaveBeenCalled();
    });

    it('rejects when the employee does not exist', async () => {
      empFindById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.enrollFace(EMPLOYEE_ID, { facialId: FACIAL_ID }),
        ),
      ).rejects.toThrow(EmployeeNotFoundException);
    });
  });

  describe('revokeFace', () => {
    it('revokes the enrollment and audits', async () => {
      const result = await runInOrganizationA(() =>
        service.revokeFace(EMPLOYEE_ID, FACE_ID),
      );

      expect(repoRevoke).toHaveBeenCalledWith(FACE_ID, EMPLOYEE_ID, mockTx);
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'hr.face.revoke',
          entityType: 'employee_face',
          entityId: FACE_ID,
        }),
        mockTx,
      );
      expect(result.face).toEqual({
        id: FACE_ID,
        enrolledAt: ENROLLED_AT.toISOString(),
        lastUsedAt: null,
        revokedAt: null,
      });
    });

    it('throws when there is nothing to revoke', async () => {
      repoRevoke.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() => service.revokeFace(EMPLOYEE_ID, FACE_ID)),
      ).rejects.toThrow(EmployeeFaceNotFoundException);
      expect(auditRecord).not.toHaveBeenCalled();
    });
  });

  describe('punchKiosk', () => {
    it('records attendance for a recognized face and marks it used', async () => {
      repoFindActiveByFacialId.mockResolvedValue(FACE_MATCH);

      const result = await runInOrganizationA(() =>
        service.punchKiosk(DEVICE, {
          eventType: 'CLOCK_IN',
          facialId: FACIAL_ID,
        }),
      );

      expect(rateLimit).toHaveBeenCalledWith(
        `kiosk:face:attempts:${KIOSK_ID}`,
        expect.any(Number),
        expect.any(Number),
      );
      expect(punchKiosk).toHaveBeenCalledWith(EMPLOYEE_ID, 'CLOCK_IN');
      expect(repoMarkUsed).toHaveBeenCalledWith(FACE_ID);
      expect(result).toEqual({
        employeeName: 'Dawit Haile',
        eventType: 'CLOCK_IN',
        eventAt: EVENT_AT.toISOString(),
      });
    });

    it('rejects an unknown facial ID on the kiosk device', async () => {
      repoFindActiveByFacialId.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.punchKiosk(DEVICE, {
            eventType: 'CLOCK_IN',
            facialId: FACIAL_ID,
          }),
        ),
      ).rejects.toThrow(KioskFaceNotRecognizedException);
      expect(punchKiosk).not.toHaveBeenCalled();
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'kiosk.attendance.face_not_recognized',
          entityType: 'kiosk',
          entityId: KIOSK_ID,
        }),
      );
    });

    it('rejects a face enrolled in another organization', async () => {
      repoFindActiveByFacialId.mockResolvedValue({
        ...FACE_MATCH,
        organizationId: ORG_B,
      });

      await expect(
        runInOrganizationA(() =>
          service.punchKiosk(DEVICE, {
            eventType: 'CLOCK_IN',
            facialId: FACIAL_ID,
          }),
        ),
      ).rejects.toThrow(KioskFaceNotRecognizedException);
      expect(punchKiosk).not.toHaveBeenCalled();
    });

    it('rejects punches for an inactive employee', async () => {
      repoFindActiveByFacialId.mockResolvedValue({
        ...FACE_MATCH,
        employeeStatus: 'on_leave',
      });

      await expect(
        runInOrganizationA(() =>
          service.punchKiosk(DEVICE, {
            eventType: 'CLOCK_IN',
            facialId: FACIAL_ID,
          }),
        ),
      ).rejects.toThrow(KioskEmployeeInactiveException);
      expect(punchKiosk).not.toHaveBeenCalled();
    });

    it('rate limits repeated attempts for the same kiosk', async () => {
      rateLimit.mockResolvedValue(false);

      await expect(
        runInOrganizationA(() =>
          service.punchKiosk(DEVICE, {
            eventType: 'CLOCK_IN',
            facialId: FACIAL_ID,
          }),
        ),
      ).rejects.toMatchObject({ status: 429 });
      expect(faceRepository.findActiveByFacialId).not.toHaveBeenCalled();
    });
  });
});