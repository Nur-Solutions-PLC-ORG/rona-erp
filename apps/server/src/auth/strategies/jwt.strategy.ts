import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JWT_SECRET } from '../constants/auth.constants';
import { JwtPayload } from '@rona/types';
import { db } from '../../db';
import { users, blacklistedTokens, userRoles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { serverConfig } from '@rona/config';
const cookieExtractor = (req: any): string | null => {
  if (req && req.cookies) {
    return req.cookies[serverConfig.auth.cookieName];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = cookieExtractor(req);
    if (!token) throw new UnauthorizedException();

    const tokenHash = await bcrypt.hash(token, 10);
    const blacklisted = await db.select().from(blacklistedTokens).where(eq(blacklistedTokens.token_hash, tokenHash)).limit(1);
    if (blacklisted[0]) {
      throw new UnauthorizedException('token canceled');
    }

    const result = await db.select({ id: users.id, email: users.email, full_name: users.full_name }).from(users).where(eq(users.id, payload.sub as string)).limit(1);
    const user = result[0];
    if (!user) {
      throw new UnauthorizedException();
    }
    const role = payload.role ?? payload.app_metadata?.role;
    const tenantId = payload.tenantId ?? payload.app_metadata?.tenant_id;

    const userRoleResult = await db.select({ position: userRoles.position }).from(userRoles).where(eq(userRoles.user_id, payload.sub as string)).limit(1);
    const position = userRoleResult[0]?.position || payload.position;

    return {
      userId: payload.sub,
      role,
      position,
      tenantId,
      ...user,
    };
  }
}
