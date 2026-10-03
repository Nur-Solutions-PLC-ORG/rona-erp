import { membershipCreateSchema } from '@rona/validation/tenancy';
import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import type { RbacRepository } from '@/modules/rbac/rbac.repository';
import type { RbacService } from '@/modules/rbac/rbac.service';
import {
  LastOwnerMembershipException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
  UserNotFoundException,
} from '@/modules/tenancy/tenancy.exception';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { MembershipsService } from './memberships.service';
import type { OrganizationRepository } from './organization.repository';

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
  redisClient: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
  },
}));

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORG_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const findMembershipByUser = jest.fn();
const findMembershipById = jest.fn();
const findUserById = jest.fn();
const createMembership = jest.fn();
const updateMembership = jest.fn();
const deleteMembership = jest.fn();
const organizationRepository = {
  findMembershipByUser,
  findMembershipById,
  findUserById,
  createMembership,
  updateMembership,
  deleteMembership,
} as unknown as OrganizationRepository;

const assignRoleToMembership = jest.fn();
const replaceMembershipRoles = jest.fn();
const findMembershipRoleKeys = jest.fn();
const countActiveOwnerMemberships = jest.fn();
const upsertDefaultRoles = jest.fn();
const rbacRepository = {
  assignRoleToMembership,
  replaceMembershipRoles,
  findMembershipRoleKeys,
  countActiveOwnerMemberships,
  upsertDefaultRoles,
} as unknown as RbacRepository;

const invalidateMembership = jest.fn();
const invalidateOrganization = jest.fn();
const rbacService = {
  invalidateMembership,
  invalidateOrganization,
} as unknown as RbacService;

const auditRecord = jest.fn();
const auditService = { record: auditRecord } as unknown as AuditService;

const service = new MembershipsService(
  organizationRepository,
  rbacRepository,
  rbacService,
  auditService,
  new TenantContextService(),
);

const targetMembership = {
  id: 'membership-target',
  organizationId: ORG_A,
  userId: USER_B,
  status: 'active',
  createdAt: NOW,
  updatedAt: NOW,
  userFullName: 'User B',
  userEmail: 'user.b@example.com',
};

const mockTx = { sentinel: 'tx' };

async function runInOrganizationA<T>(callback: () => Promise<T>): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['OWNER'],
      permissions: [],
    },
    callback,
  );
}

describe('MembershipsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
    );

    findMembershipByUser.mockResolvedValue(undefined);
    findMembershipById.mockResolvedValue(targetMembership);
    findUserById.mockResolvedValue({ id: USER_B });
    createMembership.mockResolvedValue({
      id: 'membership-new',
      organizationId: ORG_A,
      userId: USER_B,
      status: 'active',
      createdAt: NOW,
      updatedAt: NOW,
    });
    updateMembership.mockResolvedValue({
      ...targetMembership,
      status: 'suspended',
    });
    deleteMembership.mockResolvedValue(undefined);

    findMembershipRoleKeys.mockResolvedValue(['EMPLOYEE']);
    countActiveOwnerMemberships.mockResolvedValue(2);
    upsertDefaultRoles.mockResolvedValue(undefined);
    assignRoleToMembership.mockResolvedValue(undefined);
    replaceMembershipRoles.mockResolvedValue(undefined);

    invalidateMembership.mockResolvedValue(undefined);
    invalidateOrganization.mockResolvedValue(undefined);
    auditRecord.mockResolvedValue(undefined);
  });

  describe('tenant isolation', () => {
    it('ignores a forged organizationId in the body and uses the tenant context', async () => {
      const forgedPayload = {
        userId: USER_B,
        roleKeys: ['EMPLOYEE'],
        organizationId: ORG_B,
      } as never;

      await runInOrganizationA(() => service.createMembership(forgedPayload));

      expect(createMembership).toHaveBeenCalledWith(USER_B, 'active', mockTx);
      expect(assignRoleToMembership).toHaveBeenCalledWith(
        'membership-new',
        'EMPLOYEE',
        ORG_A,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          action: 'membership.created',
          entityType: 'membership',
          entityId: 'membership-new',
        }),
        mockTx,
      );
      expect(invalidateMembership).toHaveBeenCalledWith(
        'membership-new',
        ORG_A,
      );
    });

    it('strips a forged organizationId during Zod validation', () => {
      const parsed = membershipCreateSchema.parse({
        userId: USER_B,
        roleKeys: ['EMPLOYEE'],
        organizationId: ORG_B,
      });

      expect(parsed).toEqual({ userId: USER_B, roleKeys: ['EMPLOYEE'] });
    });

    it('rejects adding a user that does not exist', async () => {
      findUserById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.createMembership({ userId: USER_B, roleKeys: ['EMPLOYEE'] }),
        ),
      ).rejects.toBeInstanceOf(UserNotFoundException);
    });

    it('rejects updating a membership outside the current organization', async () => {
      findMembershipById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.updateMembership('membership-other-org', {
            status: 'suspended',
          }),
        ),
      ).rejects.toBeInstanceOf(MembershipNotFoundException);
    });

    it('rejects deleting a membership outside the current organization', async () => {
      findMembershipById.mockResolvedValue(undefined);

      await expect(
        runInOrganizationA(() =>
          service.deleteMembership('membership-other-org'),
        ),
      ).rejects.toBeInstanceOf(MembershipNotFoundException);
    });
  });

  describe('last OWNER protection', () => {
    it('prevents suspending the last active OWNER', async () => {
      findMembershipRoleKeys.mockResolvedValue(['OWNER']);
      countActiveOwnerMemberships.mockResolvedValue(1);

      await expect(
        runInOrganizationA(() =>
          service.updateMembership('membership-target', {
            status: 'suspended',
          }),
        ),
      ).rejects.toBeInstanceOf(LastOwnerMembershipException);
    });

    it('prevents removing the OWNER role from the last active OWNER', async () => {
      findMembershipRoleKeys.mockResolvedValue(['OWNER']);
      countActiveOwnerMemberships.mockResolvedValue(1);

      await expect(
        runInOrganizationA(() =>
          service.updateMembership('membership-target', {
            roleKeys: ['EMPLOYEE'],
          }),
        ),
      ).rejects.toBeInstanceOf(LastOwnerMembershipException);
    });

    it('prevents deleting the last active OWNER', async () => {
      findMembershipRoleKeys.mockResolvedValue(['OWNER']);
      countActiveOwnerMemberships.mockResolvedValue(1);

      await expect(
        runInOrganizationA(() => service.deleteMembership('membership-target')),
      ).rejects.toBeInstanceOf(LastOwnerMembershipException);
    });
  });

  describe('membership lifecycle', () => {
    it('rejects duplicate memberships', async () => {
      findMembershipByUser.mockResolvedValue(targetMembership);

      await expect(
        runInOrganizationA(() =>
          service.createMembership({ userId: USER_B, roleKeys: ['EMPLOYEE'] }),
        ),
      ).rejects.toBeInstanceOf(MembershipAlreadyExistsException);
    });

    it('updates a membership and audits before/after in the same transaction', async () => {
      await runInOrganizationA(() =>
        service.updateMembership('membership-target', {
          status: 'suspended',
          roleKeys: ['MANAGER'],
        }),
      );

      expect(updateMembership).toHaveBeenCalledWith(
        'membership-target',
        { status: 'suspended' },
        mockTx,
      );
      expect(replaceMembershipRoles).toHaveBeenCalledWith(
        'membership-target',
        ['MANAGER'],
        ORG_A,
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          actorId: USER_A,
          action: 'membership.updated',
          entityType: 'membership',
          entityId: 'membership-target',
          before: { status: 'active', roles: ['EMPLOYEE'] },
          after: { status: 'suspended', roles: ['MANAGER'] },
        }),
        mockTx,
      );
      expect(invalidateMembership).toHaveBeenCalledWith(
        'membership-target',
        ORG_A,
      );
    });

    it('deletes a membership and audits the deletion', async () => {
      await runInOrganizationA(() =>
        service.deleteMembership('membership-target'),
      );

      expect(deleteMembership).toHaveBeenCalledWith(
        'membership-target',
        mockTx,
      );
      expect(auditRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          actorId: USER_A,
          action: 'membership.deleted',
          entityType: 'membership',
          entityId: 'membership-target',
        }),
        mockTx,
      );
      expect(invalidateMembership).toHaveBeenCalledWith(
        'membership-target',
        ORG_A,
      );
    });
  });
});
