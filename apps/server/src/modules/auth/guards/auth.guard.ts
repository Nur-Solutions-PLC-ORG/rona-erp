import { SessionNotFoundException } from '@/exceptions/auth/auth.exception';
import { AuthService } from '@/modules/auth/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { COOKIE_NAME } from '@rona/config/auth';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token: unknown = request.cookies[COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      throw new SessionNotFoundException();
    }

    try {
      const session = await this.authService.decodeSession(token);

      request['session'] = session;
    } catch {
      throw new SessionNotFoundException();
    }

    return true;
  }
}
