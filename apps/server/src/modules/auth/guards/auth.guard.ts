import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/modules/auth/service/auth.service';
import { COOKIE_NAME } from '@rona/config/auth';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies[COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException({
        success: false,
        message: 'Session token missing',
      });
    }

    try {
      const session = await this.authService.decodeSession(token);
      request['session'] = session;
    } catch {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid session token',
      });
    }

    return true;
  }
}
