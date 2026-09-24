import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getRequestContext } from '@/context/request-context';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import type { Permission } from '@rona/types/tenancy';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const ctx = getRequestContext();

    if (!ctx?.userId || !ctx?.organizationId) {
      throw new ForbiddenException(
        'Tenant context is required for permission checks',
      );
    }

    const hasAll = requiredPermissions.every((permission) =>
      ctx.permissions.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
