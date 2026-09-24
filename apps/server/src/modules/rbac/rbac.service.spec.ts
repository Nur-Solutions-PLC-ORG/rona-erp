import { redisClient } from '@/redis';
import type { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';

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

const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';
const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const resolveMembershipAccess = jest.fn();
const rbacRepository = {
  resolveMembershipAccess,
} as unknown as RbacRepository;

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(() => {
    jest.clearAllMocks();
    (redisClient.get as unknown as jest.Mock).mockResolvedValue(null);
    (redisClient.set as unknown as jest.Mock).mockResolvedValue('OK');
    resolveMembershipAccess.mockResolvedValue({
      roles: ['OWNER'],
      permissions: ['organization.read', 'organization.update'],
    });
    service = new RbacService(rbacRepository);
  });

  it('resolves roles and permissions for a membership', async () => {
    const access = await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(access).toEqual({
      membershipId: MEMBERSHIP_A,
      organizationId: ORG_A,
      roles: ['OWNER'],
      permissions: ['organization.read', 'organization.update'],
    });
    expect(resolveMembershipAccess).toHaveBeenCalledTimes(1);
    expect(resolveMembershipAccess).toHaveBeenCalledWith(MEMBERSHIP_A, ORG_A);
  });

  it('caches resolved access per membership', async () => {
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(resolveMembershipAccess).toHaveBeenCalledTimes(1);
  });

  it('falls back to empty access when the repository returns nothing', async () => {
    resolveMembershipAccess.mockResolvedValue(undefined);

    const access = await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(access).toEqual({
      membershipId: MEMBERSHIP_A,
      organizationId: ORG_A,
      roles: [],
      permissions: [],
    });
  });

  it('invalidates the cached access for an organization', async () => {
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);
    await service.invalidateOrganization(ORG_A);
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(resolveMembershipAccess).toHaveBeenCalledTimes(2);
    expect(redisClient.set).toHaveBeenCalledWith(
      `rbac:version:${ORG_A}`,
      expect.any(String),
      { ex: 86400 },
    );
  });

  it('invalidates the cached access for a single membership', async () => {
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);
    await service.invalidateMembership(MEMBERSHIP_A, ORG_A);
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(resolveMembershipAccess).toHaveBeenCalledTimes(2);
  });

  it('re-queries when the Redis version changes (cross-instance invalidation)', async () => {
    (redisClient.get as unknown as jest.Mock).mockResolvedValue('42');
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    (redisClient.get as unknown as jest.Mock).mockResolvedValue('43');
    await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);

    expect(resolveMembershipAccess).toHaveBeenCalledTimes(2);
  });

  it('tolerates Redis being unavailable', async () => {
    (redisClient.get as unknown as jest.Mock).mockRejectedValue(
      new Error('redis unavailable'),
    );
    (redisClient.set as unknown as jest.Mock).mockRejectedValue(
      new Error('redis unavailable'),
    );

    const access = await service.resolveMembershipAccess(MEMBERSHIP_A, ORG_A);
    expect(access.roles).toEqual(['OWNER']);

    await expect(
      service.invalidateOrganization(ORG_A),
    ).resolves.toBeUndefined();
  });
});
