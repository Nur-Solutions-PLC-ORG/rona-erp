import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { serverConfig } from '@rona/config';

const cookieExtractor = (req: any): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[serverConfig.auth.cookieName];
  }
  return token || ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = cookieExtractor(req);
    if (!token) throw new UnauthorizedException();

    const result = await db.select({ id: users.id, email: users.email, full_name: users.full_name }).from(users).where(eq(users.id, payload.sub as string)).limit(1);
    const user = result[0];
    if (!user) {
      throw new UnauthorizedException();
    }

    const role = payload.role ?? payload.app_metadata?.role;
    const tenantId = payload.tenantId ?? payload.app_metadata?.tenant_id;

    return {
      userId: payload.sub,
      role,
      tenantId,
      ...user,
    };
  }
}
