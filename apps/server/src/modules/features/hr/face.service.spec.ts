import {
  DESCRIPTOR,
  DEVICE,
  EMPLOYEE,
  EMPLOYEE_ID,
  ENROLLED_AT,
  EVENT_AT,
  FACE_ID,
  FACE_MATCH,
  FACE_ROW,
  KIOSK_ID,
  ORG_A,
  ORG_B,
  USER_A,
  auditRecord,
  defaultMocks,
  empFindByUserId,
  empFindByEid,
  empFindByIdForUpdate,
  mockTx,
  punchKiosk,
  repoFindActiveForEmployee,
  repoInsertEnrollment,
  repoList,
  repoMarkUsed,
  repoRevokeExisting,
  runInOrganizationA,
  service,
  setupTransactionMock,
} from './face.spec-harness';
import { rateLimit } from '@/redis';
import {
  EmployeeArchivedException,
  EmployeeSelfNotFoundException,
} from './hr.exception';
import {
  KioskEmployeeInactiveException,
  KioskFaceNotRecognizedException,
} from '../kiosk/kiosk.exception';
import { getRequestContext } from '@/context/request-context';
import type { FaceEnrollInput, KioskFacePunchInput } from '@rona/types/kiosk';
import {
  KIOSK_FACE_MATCH_DISTANCE,
  KIOSK_PUNCH_ATTEMPT_LIMIT,
  KIOSK_PUNCH_WINDOW_SECONDS,
} from '@rona/config/kiosk';
import { EmployeeFacesController } from './employee-faces.controller';
import { KioskFaceController } from '../kiosk/kiosk-face.controller';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { AuthGuard } from '@/modules/auth/guards/auth.guard';
import { TenantGuard } from '@/modules/tenancy/tenant.guard';
import { PermissionGuard } from '@/modules/rbac/permission.guard';
import { KioskSessionGuard } from '../kiosk/kiosk-session.guard';
import { PERMISSIONS_KEY } from '@/modules/rbac/require-permissions.decorator';

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

const INPUT: KioskFacePunchInput = {
  eid: EMPLOYEE.eid,
  descriptor: DESCRIPTOR,
  eventType: 'CLOCK_IN',
};
const METADATA = {
  id: FACE_ID,
  enrolledAt: ENROLLED_AT.toISOString(),
  lastUsedAt: null,
  revokedAt: null,
};
const MALFORMED: unknown[] = [
  undefined,
  null,
  'descriptor',
  {},
  [],
  DESCRIPTOR.slice(1),
  [...DESCRIPTOR, 0],
  [NaN, ...DESCRIPTOR.slice(1)],
  [Infinity, ...DESCRIPTOR.slice(1)],
  [-Infinity, ...DESCRIPTOR.slice(1)],
  ['0', ...DESCRIPTOR.slice(1)],
  [null, ...DESCRIPTOR.slice(1)],
  Array(128),
];

async function expectUnrecognized(input: KioskFacePunchInput) {
  await expect(
    runInOrganizationA(() => service.punchKiosk(DEVICE, input)),
  ).rejects.toMatchObject({ status: 400, message: 'Face does not match EID.' });
  expect(punchKiosk).not.toHaveBeenCalled();
  expect(repoMarkUsed).not.toHaveBeenCalled();
  expect(auditRecord).toHaveBeenCalledWith(
    expect.objectContaining({
      organizationId: ORG_A,
      action: 'kiosk.attendance.face_not_recognized',
      entityType: 'kiosk',
      entityId: KIOSK_ID,
    }),
  );
  expect(JSON.stringify(auditRecord.mock.calls)).not.toContain('descriptor');
  expect(JSON.stringify(auditRecord.mock.calls)).not.toContain(
    JSON.stringify(DESCRIPTOR),
  );
}

describe('FaceService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  describe('self access', () => {
    it('returns only linked employee metadata without descriptors', async () => {
      repoList.mockResolvedValue([FACE_ROW]);
      const result = await runInOrganizationA(() => service.listFaces());
      expect(empFindByUserId).toHaveBeenCalledWith(USER_A);
      expect(repoList).toHaveBeenCalledWith(EMPLOYEE_ID);
      expect(result).toEqual({ faces: [METADATA] });
      expect(empFindByEid).not.toHaveBeenCalled();
    });

    it.each(['list', 'enroll', 'revoke'] as const)(
      'rejects %s without a linked employee',
      async (operation) => {
        empFindByUserId.mockResolvedValue(undefined);
        const call = (): Promise<unknown> =>
          operation === 'list'
            ? service.listFaces()
            : operation === 'enroll'
              ? service.enrollFace({ descriptor: DESCRIPTOR })
              : service.revokeFace();
        await expect(runInOrganizationA(call)).rejects.toThrow(
          EmployeeSelfNotFoundException,
        );
        expect(repoList).not.toHaveBeenCalled();
        expect(repoInsertEnrollment).not.toHaveBeenCalled();
        expect(repoRevokeExisting).not.toHaveBeenCalled();
      },
    );

    it.each([
      { organizationId: ORG_B },
      { userId: 'another-user' },
      { userId: null },
    ])(
      'rejects a link outside the current user and tenant: %j',
      async (patch) => {
        empFindByUserId.mockResolvedValue({ ...EMPLOYEE, ...patch });
        await expect(
          runInOrganizationA(() => service.listFaces()),
        ).rejects.toThrow(EmployeeSelfNotFoundException);
        expect(repoList).not.toHaveBeenCalled();
      },
    );
  });

  describe('enrollFace', () => {
    it('locks self before replacing enrollment and audits metadata only', async () => {
      const input = {
        descriptor: DESCRIPTOR,
        employeeId: 'another-employee',
        userId: 'another-user',
        organizationId: ORG_B,
      };
      const result = await runInOrganizationA(() => service.enrollFace(input));
      expect(empFindByUserId).toHaveBeenCalledWith(USER_A);
      expect(empFindByIdForUpdate).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
      expect(empFindByIdForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        repoRevokeExisting.mock.invocationCallOrder[0],
      );
      expect(repoRevokeExisting.mock.invocationCallOrder[0]).toBeLessThan(
        repoInsertEnrollment.mock.invocationCallOrder[0],
      );
      expect(repoRevokeExisting).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
      expect(repoInsertEnrollment).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          employeeId: EMPLOYEE_ID,
          descriptor: JSON.stringify(DESCRIPTOR),
        },
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          action: 'hr.face.enroll',
          entityType: 'employee_face',
          entityId: FACE_ID,
          after: { employeeId: EMPLOYEE_ID },
        },
        mockTx,
      );
      expect(result).toEqual({ face: METADATA });
    });

    it.each(MALFORMED.map((descriptor, index) => ({ descriptor, index })))(
      'rejects malformed descriptor $index before writing',
      async ({ descriptor }) => {
        await expect(
          runInOrganizationA(() =>
            service.enrollFace({ descriptor } as FaceEnrollInput),
          ),
        ).rejects.toMatchObject({ status: 400 });
        expect(empFindByIdForUpdate).not.toHaveBeenCalled();
        expect(repoRevokeExisting).not.toHaveBeenCalled();
        expect(repoInsertEnrollment).not.toHaveBeenCalled();
      },
    );

    it('denies an archived employee after locking', async () => {
      empFindByIdForUpdate.mockResolvedValue({
        ...EMPLOYEE,
        archivedAt: EVENT_AT,
      });
      await expect(
        runInOrganizationA(() =>
          service.enrollFace({ descriptor: DESCRIPTOR }),
        ),
      ).rejects.toThrow(EmployeeArchivedException);
      expect(repoRevokeExisting).not.toHaveBeenCalled();
    });

    it.each(['on_leave', 'terminated', 'inactive'])(
      'denies %s employees after locking',
      async (status) => {
        empFindByIdForUpdate.mockResolvedValue({ ...EMPLOYEE, status });
        await expect(
          runInOrganizationA(() =>
            service.enrollFace({ descriptor: DESCRIPTOR }),
          ),
        ).rejects.toMatchObject({ status: 403 });
        expect(repoRevokeExisting).not.toHaveBeenCalled();
      },
    );

    it.each([
      undefined,
      { ...EMPLOYEE, userId: null },
      { ...EMPLOYEE, organizationId: ORG_B },
    ])('rechecks the link under lock', async (employee) => {
      empFindByIdForUpdate.mockResolvedValue(employee);
      await expect(
        runInOrganizationA(() =>
          service.enrollFace({ descriptor: DESCRIPTOR }),
        ),
      ).rejects.toThrow(EmployeeSelfNotFoundException);
      expect(repoInsertEnrollment).not.toHaveBeenCalled();
      expect(repoRevokeExisting).not.toHaveBeenCalled();
    });
  });

  describe('revokeFace', () => {
    it('locks and revokes only self and returns revoked metadata', async () => {
      const result = await runInOrganizationA(() => service.revokeFace());
      expect(empFindByUserId).toHaveBeenCalledWith(USER_A);
      expect(empFindByIdForUpdate).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
      expect(empFindByIdForUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        repoRevokeExisting.mock.invocationCallOrder[0],
      );
      expect(repoRevokeExisting).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
      expect(result).toEqual({
        face: { ...METADATA, revokedAt: EVENT_AT.toISOString() },
      });
      expect(auditRecord).toHaveBeenCalledWith(
        {
          organizationId: ORG_A,
          action: 'hr.face.revoke',
          entityType: 'employee_face',
          entityId: FACE_ID,
          after: { employeeId: EMPLOYEE_ID, faceId: FACE_ID },
        },
        mockTx,
      );
    });

    it('returns null idempotently when no active enrollment exists', async () => {
      repoRevokeExisting.mockResolvedValue([]);
      await expect(
        runInOrganizationA(() => service.revokeFace()),
      ).resolves.toEqual({ face: null });
      expect(auditRecord).not.toHaveBeenCalled();
    });

    it('allows inactive employees to revoke their enrollment', async () => {
      empFindByUserId.mockResolvedValue({ ...EMPLOYEE, status: 'on_leave' });
      empFindByIdForUpdate.mockResolvedValue({
        ...EMPLOYEE,
        status: 'on_leave',
      });
      await runInOrganizationA(() => service.revokeFace());
      expect(repoRevokeExisting).toHaveBeenCalledWith(EMPLOYEE_ID, mockTx);
    });

    it('rejects a link removed while waiting for the employee lock', async () => {
      empFindByIdForUpdate.mockResolvedValue({ ...EMPLOYEE, userId: null });
      await expect(
        runInOrganizationA(() => service.revokeFace()),
      ).rejects.toThrow(EmployeeSelfNotFoundException);
      expect(repoRevokeExisting).not.toHaveBeenCalled();
    });
  });

  describe('punchKiosk', () => {
    it('compares only the EID enrollment in the device organization', async () => {
      const result = await runInOrganizationA(() =>
        service.punchKiosk(DEVICE, INPUT),
      );
      expect(empFindByEid).toHaveBeenCalledWith(EMPLOYEE.eid);
      expect(repoFindActiveForEmployee).toHaveBeenCalledTimes(1);
      expect(repoFindActiveForEmployee).toHaveBeenCalledWith(
        ORG_A,
        EMPLOYEE_ID,
      );
      expect(empFindByUserId).not.toHaveBeenCalled();
      expect(punchKiosk).toHaveBeenCalledWith(EMPLOYEE_ID, 'CLOCK_IN');
      expect(repoMarkUsed).toHaveBeenCalledWith(ORG_A, FACE_ID);
      expect(result).toEqual({
        employeeName: EMPLOYEE.fullName,
        eventType: 'CLOCK_IN',
        eventAt: EVENT_AT.toISOString(),
      });
    });

    it.each([0, KIOSK_FACE_MATCH_DISTANCE - 0.000001])(
      'accepts distance %s strictly below the threshold',
      async (distance) => {
        await runInOrganizationA(() =>
          service.punchKiosk(DEVICE, {
            ...INPUT,
            descriptor: [distance, ...DESCRIPTOR.slice(1)],
          }),
        );
        expect(punchKiosk).toHaveBeenCalledTimes(1);
      },
    );

    it.each([KIOSK_FACE_MATCH_DISTANCE, KIOSK_FACE_MATCH_DISTANCE + 0.000001, 1])(
      'rejects distance %s at or above threshold',
      async (distance) => {
        await expectUnrecognized({
          ...INPUT,
          descriptor: [distance, ...DESCRIPTOR.slice(1)],
        });
      },
    );

    it('rejects an unknown EID without looking up enrollments', async () => {
      empFindByEid.mockResolvedValue(undefined);
      await expectUnrecognized(INPUT);
      expect(repoFindActiveForEmployee).not.toHaveBeenCalled();
    });

    it.each([{ organizationId: ORG_B }, { eid: 'another-eid' }])(
      'rejects an employee outside the EID/device scope: %j',
      async (patch) => {
        empFindByEid.mockResolvedValue({ ...EMPLOYEE, ...patch });
        await expectUnrecognized(INPUT);
        expect(repoFindActiveForEmployee).not.toHaveBeenCalled();
      },
    );

    it.each([
      undefined,
      { ...FACE_MATCH, organizationId: ORG_B },
      { ...FACE_MATCH, employeeId: 'another-employee' },
      { ...FACE_MATCH, revokedAt: EVENT_AT },
    ])(
      'rejects absent, wrong-scope or revoked enrollment: %j',
      async (match) => {
        repoFindActiveForEmployee.mockResolvedValue(match);
        await expectUnrecognized(INPUT);
      },
    );

    it.each(MALFORMED.map((descriptor, index) => ({ descriptor, index })))(
      'fails closed on malformed input descriptor $index',
      async ({ descriptor }) => {
        await expectUnrecognized({
          ...INPUT,
          descriptor,
        } as KioskFacePunchInput);
        expect(empFindByEid).not.toHaveBeenCalled();
      },
    );

    it.each([
      null,
      undefined,
      {},
      { faceId: FACE_ID, eventType: 'CLOCK_IN' },
      { ...INPUT, eid: '' },
      { ...INPUT, eventType: 'INVALID' },
    ])('fails closed on malformed payload: %j', async (input) => {
      await expectUnrecognized(input as KioskFacePunchInput);
      expect(empFindByEid).not.toHaveBeenCalled();
    });

    it.each([
      'not-json',
      'null',
      '{}',
      '[]',
      JSON.stringify(DESCRIPTOR.slice(1)),
      JSON.stringify(['0', ...DESCRIPTOR.slice(1)]),
      '[1e999,' + DESCRIPTOR.slice(1).join(',') + ']',
    ])(
      'fails closed on malformed stored descriptor: %s',
      async (descriptor) => {
        repoFindActiveForEmployee.mockResolvedValue({
          ...FACE_MATCH,
          descriptor,
        });
        await expectUnrecognized(INPUT);
      },
    );

    it.each([{ employeeStatus: 'on_leave' }, { employeeArchivedAt: EVENT_AT }])(
      'rejects inactive or archived enrollment owner: %j',
      async (patch) => {
        repoFindActiveForEmployee.mockResolvedValue({
          ...FACE_MATCH,
          ...patch,
        });
        await expect(
          runInOrganizationA(() => service.punchKiosk(DEVICE, INPUT)),
        ).rejects.toThrow(KioskEmployeeInactiveException);
        expect(punchKiosk).not.toHaveBeenCalled();
        expect(repoMarkUsed).not.toHaveBeenCalled();
      },
    );

    it.each([{ status: 'on_leave' }, { archivedAt: EVENT_AT }])(
      'rejects inactive or archived EID owner: %j',
      async (patch) => {
        empFindByEid.mockResolvedValue({ ...EMPLOYEE, ...patch });
        await expect(
          runInOrganizationA(() => service.punchKiosk(DEVICE, INPUT)),
        ).rejects.toThrow(KioskEmployeeInactiveException);
        expect(punchKiosk).not.toHaveBeenCalled();
      },
    );

    it.each([INPUT, { ...INPUT, descriptor: null }])(
      'rate limits before employee lookup and validation',
      async (input) => {
        jest.mocked(rateLimit).mockResolvedValue(false);
        await expect(
          runInOrganizationA(() =>
            service.punchKiosk(DEVICE, input as KioskFacePunchInput),
          ),
        ).rejects.toMatchObject({ status: 429 });
        expect(rateLimit).toHaveBeenCalledWith(
          `kiosk:face:attempts:${KIOSK_ID}`,
          KIOSK_PUNCH_ATTEMPT_LIMIT,
          KIOSK_PUNCH_WINDOW_SECONDS,
        );
        expect(empFindByEid).not.toHaveBeenCalled();
        expect(repoFindActiveForEmployee).not.toHaveBeenCalled();
        expect(punchKiosk).not.toHaveBeenCalled();
        expect(repoMarkUsed).not.toHaveBeenCalled();
        expect(auditRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'kiosk.attendance.face_rate_limited',
            after: { reason: 'attempt_limit' },
          }),
        );
      },
    );

    it('fails closed when the rate limiter fails', async () => {
      jest.mocked(rateLimit).mockRejectedValue(new Error('redis unavailable'));
      await expect(
        runInOrganizationA(() => service.punchKiosk(DEVICE, INPUT)),
      ).rejects.toThrow('redis unavailable');
      expect(empFindByEid).not.toHaveBeenCalled();
      expect(punchKiosk).not.toHaveBeenCalled();
    });

    it.each([false, true])(
      'preserves the original request context on success/failure: %s',
      async (fail) => {
        await runInOrganizationA(async () => {
          const original = getRequestContext()!;
          original.organizationId = ORG_B;
          const snapshot = { ...original };
          empFindByEid.mockImplementation(async () => {
            expect(getRequestContext()).toMatchObject({
              organizationId: ORG_A,
              requestId: original.requestId,
              userId: undefined,
              membershipId: undefined,
              roles: [],
              permissions: [],
            });
            return EMPLOYEE;
          });
          punchKiosk.mockImplementation(async () => {
            expect(getRequestContext()?.organizationId).toBe(ORG_A);
            if (fail) throw new Error('attendance failed');
            return { eventType: 'CLOCK_IN', eventAt: EVENT_AT };
          });
          const pending = service.punchKiosk(DEVICE, INPUT);
          expect(getRequestContext()).toBe(original);
          if (fail) await expect(pending).rejects.toThrow('attendance failed');
          else await pending;
          expect(getRequestContext()).toBe(original);
          expect(getRequestContext()).toEqual(snapshot);
        });
        if (fail) expect(repoMarkUsed).not.toHaveBeenCalled();
      },
    );

    it('works without an existing context without leaking one', async () => {
      expect(getRequestContext()).toBeUndefined();
      await service.punchKiosk(DEVICE, INPUT);
      expect(getRequestContext()).toBeUndefined();
    });

    it('still rejects mismatches if auditing fails', async () => {
      auditRecord.mockRejectedValue(new Error('audit unavailable'));
      repoFindActiveForEmployee.mockResolvedValue(undefined);
      await expect(
        runInOrganizationA(() => service.punchKiosk(DEVICE, INPUT)),
      ).rejects.toThrow(KioskFaceNotRecognizedException);
      expect(punchKiosk).not.toHaveBeenCalled();
    });
  });
});

describe('face controllers', () => {
  it('exposes self-service paths and guards only', () => {
    expect(Reflect.getMetadata(PATH_METADATA, EmployeeFacesController)).toBe(
      'faces',
    );
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, EmployeeFacesController),
    ).toEqual(['hr.attendance.clock']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, EmployeeFacesController),
    ).toEqual([AuthGuard, TenantGuard, PermissionGuard]);
    for (const [method, path, verb] of [
      [EmployeeFacesController.prototype.listFaces, '/', RequestMethod.GET],
      [
        EmployeeFacesController.prototype.enrollFace,
        'enroll',
        RequestMethod.POST,
      ],
      [
        EmployeeFacesController.prototype.revokeFace,
        'revoke',
        RequestMethod.POST,
      ],
    ] as const) {
      expect(Reflect.getMetadata(PATH_METADATA, method)).toBe(path);
      expect(Reflect.getMetadata(METHOD_METADATA, method)).toBe(verb);
    }
    expect(
      Reflect.getMetadata(
        HTTP_CODE_METADATA,
        EmployeeFacesController.prototype.revokeFace,
      ),
    ).toBe(200);
  });

  it('removes descriptor download and retains only guarded kiosk punch', () => {
    expect(Object.getOwnPropertyNames(KioskFaceController.prototype)).toEqual([
      'constructor',
      'punch',
    ]);
    expect(
      Reflect.getMetadata(PATH_METADATA, KioskFaceController.prototype.punch),
    ).toBe('punch');
    expect(
      Reflect.getMetadata(GUARDS_METADATA, KioskFaceController.prototype.punch),
    ).toEqual([KioskSessionGuard]);
  });
});
