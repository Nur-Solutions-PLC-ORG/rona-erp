import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { runWithRequestContext } from '@/context/request-context';
import { RequirePermissions } from './require-permissions.decorator';
import { PermissionGuard } from './permission.guard';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MEMBERSHIP_ID = '33333333-3333-4333-8333-333333333333';

class SecuredController {
  @RequirePermissions('membership.create')
  create(): void {
  }

  @RequirePermissions('membership.read', 'membership.update')
  update(): void {
  }

  open(): void {
  }
}

const guard = new PermissionGuard(new Reflector());
const controller = new SecuredController();

function createContextFor(handler: () => void): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({}) }),
    getHandler: () => handler,
    getClass: () => SecuredController,
  } as unknown as ExecutionContext;
}

function runWithPermissions(
  permissions: string[],
  handler: () => void,
): boolean {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_ID,
      organizationId: ORG_ID,
      membershipId: MEMBERSHIP_ID,
      roles: ['ADMIN'],
      permissions,
    },
    () => guard.canActivate(createContextFor(handler)),
  );
}

describe('PermissionGuard', () => {
  it('allows routes without @RequirePermissions metadata', () => {
    expect(runWithPermissions([], controller.open)).toBe(true);
  });

  it('allows a user that holds the required permission', () => {
    expect(runWithPermissions(['membership.create'], controller.create)).toBe(
      true,
    );
  });

  it('rejects a user without the required permission (403)', () => {
    expect(() =>
      runWithPermissions(['membership.read'], controller.create),
    ).toThrow(ForbiddenException);
  });

  it('requires ALL listed permissions, not just one of them', () => {
    expect(() =>
      runWithPermissions(['membership.read'], controller.update),
    ).toThrow(ForbiddenException);

    expect(
      runWithPermissions(
        ['membership.read', 'membership.update'],
        controller.update,
      ),
    ).toBe(true);
  });

  it('rejects permission checks without a tenant context', () => {
    expect(() =>
      guard.canActivate(createContextFor(controller.create)),
    ).toThrow(ForbiddenException);
  });
});
