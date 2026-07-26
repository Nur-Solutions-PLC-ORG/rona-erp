import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

const POSITION_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  managers: 1,
  staff: 0,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const userPositionLevel = Math.max(
      POSITION_HIERARCHY[user?.position] || 0,
      POSITION_HIERARCHY[user?.role] || 0,
    );
    if (userPositionLevel === 0 && !user?.position && !user?.role) {
      throw new ForbiddenException('no role assigned');
    }
    const userLevel = userPositionLevel;
    return requiredRoles.some((role) => {
      const requiredLevel = POSITION_HIERARCHY[role] || 0;
      return userLevel >= requiredLevel;
    });
  }
}
