import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { db } from '../../db';
import { users, sessions, blacklistedTokens } from '../../db/schema';
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

    const tokenHash = await bcrypt.hash(token, 10);
    const blacklisted = await db.select().from(blacklistedTokens).where(eq(blacklistedTokens.token_hash, tokenHash)).limit(1);
    if (blacklisted[0]) {
      throw new UnauthorizedException('Token has been cancled');
    }

    const sessionResult = await db.select().from(sessions).where(eq(sessions.id, payload.session_id as string)).limit(1);
    const session = sessionResult[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException('Session expired or invalid');
    }

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
