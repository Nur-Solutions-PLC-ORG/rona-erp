import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import sql from '../../db';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException();

    const [user] = await sql`SELECT id, email, full_name FROM public.users WHERE id = ${payload.sub}`;
    if (!user) {
      throw new UnauthorizedException();
    }

    const role = payload.role ?? payload.app_metadata?.role;
    const tenantId = payload.tenantId ?? payload.app_metadata?.tenant_id;

    return {
      userId: payload.sub,
      email: payload.email,
      role,
      tenantId,
      ...user,
    };
  }
}