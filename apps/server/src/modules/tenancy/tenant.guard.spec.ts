import type { ExecutionContext } from '@nestjs/common';
import { ORGANIZATION_HEADER } from '@rona/config/tenancy';
import {
  getRequestContext,
  runWithRequestContext,
} from '@/context/request-context';
import type { RbacService } from '@/modules/rbac/rbac.service';
import {
  InvalidOrganizationHeaderException,
  NoActiveMembershipException,
  OrganizationAccessDeniedException,
} from './tenancy.exception';
import { TenantGuard } from './tenant.guard';
import type { TenancyRepository } from './tenancy.repository';

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
const MEMBERSHIP_B = '44444444-4444-4444-8444-444444444444';

const findActiveMembershipAccess = jest.fn();
const findDefaultMembership = jest.fn();
const tenancyRepository = {
  findActiveMembershipAccess,
  findDefaultMembership,
} as unknown as TenancyRepository;

const resolveMembershipAccess = jest.fn();
const rbacService = { resolveMembershipAccess } as unknown as RbacService;

const guard = new TenantGuard(tenancyRepository, rbacService);

interface MockSession {
  user: { id: string };
}

function createExecutionContext(
  session: MockSession | undefined,
  organizationHeader?: string,
): ExecutionContext {
  const headers: Record<string, string> = {};
  if (organizationHeader !== undefined) {
    headers[ORGANIZATION_HEADER] = organizationHeader;
  }
  const request = {
    session,
    header: (name: string) => headers[name],
  };

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => TenantGuard,
  } as unknown as ExecutionContext;
}

async function activate(context: ExecutionContext): Promise<{
  allowed: boolean;
  context: ReturnType<typeof getRequestContext>;
}> {
  return runWithRequestContext(
    { requestId: 'req-test', roles: [], permissions: [] },
    async () => {
      const allowed = await guard.canActivate(context);
      return { allowed, context: getRequestContext() };
    },
  );
}

async function captureError(context: ExecutionContext): Promise<unknown> {
  return activate(context).then(
    () => undefined,
    (error: unknown) => error,
  );
}

describe('TenantGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    findActiveMembershipAccess.mockImplementation(
      async (userId: string, organizationId: string) => {
        if (userId === USER_A && organizationId === ORG_A) {
          return {
            membershipId: MEMBERSHIP_A,
            organizationId: ORG_A,
            organizationName: 'Organization A',
            organizationSlug: 'org-a',
            userId: USER_A,
          };
        }
        if (userId === USER_B && organizationId === ORG_B) {
          return {
            membershipId: MEMBERSHIP_B,
            organizationId: ORG_B,
            organizationName: 'Organization B',
            organizationSlug: 'org-b',
            userId: USER_B,
          };
        }
        return undefined;
      },
    );

    findDefaultMembership.mockResolvedValue(undefined);

    resolveMembershipAccess.mockImplementation(
      async (membershipId: string, organizationId: string) => ({
        membershipId,
        organizationId,
        roles: ['OWNER'],
        permissions: ['organization.read'],
      }),
    );
  });

  describe('tenant isolation', () => {
    it('allows User A to access Organization A where they hold an active membership', async () => {
      const result = await activate(
        createExecutionContext({ user: { id: USER_A } }, ORG_A),
      );

      expect(result.allowed).toBe(true);
      expect(findActiveMembershipAccess).toHaveBeenCalledWith(USER_A, ORG_A);
      expect(result.context).toMatchObject({
        userId: USER_A,
        organizationId: ORG_A,
        membershipId: MEMBERSHIP_A,
        roles: ['OWNER'],
        permissions: ['organization.read'],
      });
    });

    it('allows User B to access Organization B where they hold an active membership', async () => {
      const result = await activate(
        createExecutionContext({ user: { id: USER_B } }, ORG_B),
      );

      expect(result.allowed).toBe(true);
      expect(result.context).toMatchObject({
        userId: USER_B,
        organizationId: ORG_B,
        membershipId: MEMBERSHIP_B,
      });
    });

    it('denies User A access to Organization B (forged organization header)', async () => {
      const error = await captureError(
        createExecutionContext({ user: { id: USER_A } }, ORG_B),
      );

      expect(error).toBeInstanceOf(OrganizationAccessDeniedException);
      expect(error).toHaveProperty('status', 403);
      expect(findActiveMembershipAccess).toHaveBeenCalledWith(USER_A, ORG_B);
    });

    it('denies User B access to Organization A (forged organization header)', async () => {
      const error = await captureError(
        createExecutionContext({ user: { id: USER_B } }, ORG_A),
      );

      expect(error).toBeInstanceOf(OrganizationAccessDeniedException);
      expect(error).toHaveProperty('status', 403);
      expect(findActiveMembershipAccess).toHaveBeenCalledWith(USER_B, ORG_A);
    });
  });

  describe('organization resolution', () => {
    it('resolves RBAC access from the verified membership, not from the raw header', async () => {
      await activate(createExecutionContext({ user: { id: USER_A } }, ORG_A));

      expect(resolveMembershipAccess).toHaveBeenCalledWith(MEMBERSHIP_A, ORG_A);
    });

    it('rejects a malformed organization header before any database lookup', async () => {
      const error = await captureError(
        createExecutionContext({ user: { id: USER_A } }, 'not-a-uuid'),
      );

      expect(error).toBeInstanceOf(InvalidOrganizationHeaderException);
      expect(error).toHaveProperty('status', 400);
      expect(findActiveMembershipAccess).not.toHaveBeenCalled();
    });

    it('falls back to the default membership when no organization header is sent', async () => {
      findDefaultMembership.mockResolvedValue({
        membershipId: MEMBERSHIP_A,
        organizationId: ORG_A,
        organizationName: 'Organization A',
        organizationSlug: 'org-a',
        userId: USER_A,
      });

      const result = await activate(
        createExecutionContext({ user: { id: USER_A } }),
      );

      expect(result.allowed).toBe(true);
      expect(findDefaultMembership).toHaveBeenCalledWith(USER_A);
      expect(findActiveMembershipAccess).not.toHaveBeenCalled();
      expect(result.context).toMatchObject({ organizationId: ORG_A });
    });

    it('rejects authenticated users without any active membership', async () => {
      const error = await captureError(
        createExecutionContext({ user: { id: USER_A } }),
      );

      expect(error).toBeInstanceOf(NoActiveMembershipException);
      expect(error).toHaveProperty('status', 403);
    });

    it('defensively rejects requests without an authenticated session', async () => {
      const error = await captureError(
        createExecutionContext(undefined, ORG_A),
      );

      expect(error).toBeInstanceOf(NoActiveMembershipException);
      expect(findActiveMembershipAccess).not.toHaveBeenCalled();
    });
  });
});
