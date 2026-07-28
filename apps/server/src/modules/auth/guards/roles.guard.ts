import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Position, Session } from '@rona/types/auth';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Position[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { session } = context
      .switchToHttp()
      .getRequest<Request & { session: Session }>();

    if (!session || !session.roles) {
      throw new ForbiddenException({
        success: false,
        message: 'Access denied',
      });
    }

    if (!requiredRoles.includes(session.roles.position)) {
      throw new ForbiddenException({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    return true;
  }
}
