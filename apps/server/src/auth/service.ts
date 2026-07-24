import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from './email/email.service';
import { db } from '../db';
import { users, tenantMembers, userRoles, organizations, sessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const inMemoryCodes = new Map<string, { code: string; expires: number }>();
@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_TTL = '7d';

  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password, eid, tenant_id } = loginDto;

    if (!email && (!eid || !tenant_id)) {
      throw new BadRequestException("need email or eid + tenant_id");
    }

    try {
      let user;
      let member;

      if (email) {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        user = result[0];
        if (user) {
          const mResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, user.id)).limit(1);
          member = mResult[0];
        }
      } else {
        const result = await db.select().from(users).where(and(eq(users.tenant_id, tenant_id as string), eq(users.eid, eid as string))).limit(1);
        user = result[0];
        if (user) {
          const mResult = await db.select().from(tenantMembers).where(and(eq(tenantMembers.user_id, user.id), eq(tenantMembers.tenant_id, tenant_id as string))).limit(1);
          member = mResult[0];
        }
      }

      if (!user) {
       throw new UnauthorizedException("wrong login");
      }

      const valid = await bcrypt.compare(password, user.password_hash || '');
      if (!valid) {
       throw new UnauthorizedException("wrong login");
      }

      if (user.mfa_enabled) {
        const verifyRes = await this.sendVerificationCode(user.email);
        return {
          mfa_required: true,
          email: user.email,
         message: "code sent, wait 60s",
          code: verifyRes.code
        };
      }

      const roleStr = member?.role || 'staff';
      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt,
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        session_id: sessionId,
        app_metadata: {
          role: roleStr,
          tenant_id: member?.tenant_id || user.tenant_id || ''
        } };
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.ACCESS_TOKEN_TTL });
      this.logger.log(`Successful login for user ${user.id} [IP: ${ipAddress}, Agent: ${userAgent}]`);
      return {
        accessToken,
        user: { 
          id: user.id, 
          email: user.email, 
          full_name: user.full_name, 
          role: roleStr, 
          tenant_id: member?.tenant_id || user.tenant_id || '' 
        }
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Login Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException("login failed, try later");
    }
  }

  async getUserStatus(userId: string, exp?: number) {
    try {
      const uResult = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
      const user = uResult[0];
      if (!user) return { session: null };

      const rolesRows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
      
      let rolesList: Array<{ position: string; module: string[] }> = [];

      if (rolesRows.length > 0) {
        rolesList = rolesRows.map(r => ({
          position: r.position,
          module: r.module || []
        }));
      } else {
        const mResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, userId)).limit(1);
        const member = mResult[0];
        rolesList = [{
          position: member?.role || "staff",
          module: ["HR", "Inventory", "Finance"]
        }];
      }
      return {
        session: {
          user: {
            id: user.id,
            email: user.email
          },
          roles: rolesList
        },
        expires: exp ? new Date(exp * 1000) : null
      };
    } catch (err: any) {
      this.logger.error(`Status Error: ${err.message}`, err.stack);
      return { session: null };
    }
  }

  async me(userId: string) {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          full_name: users.full_name,
          status: users.status,
          is_email_verified: users.is_email_verified,
          role: tenantMembers.role,
          tenant_id: tenantMembers.tenant_id,
          company_name: organizations.name,
        })
        .from(users)
        .leftJoin(tenantMembers, eq(users.id, tenantMembers.user_id))
        .leftJoin(organizations, eq(tenantMembers.tenant_id, organizations.id))
        .where(eq(users.id, userId))
        .limit(1);

      const user = result[0];

      if (!user) {
        throw new BadRequestException("no user");
      }

      return { user };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Me Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException("failed to get profile");
    }
  }

  async sendVerificationCode(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlSeconds = 900;

    inMemoryCodes.set(email, { code, expires: Date.now() + ttlSeconds * 1000 });
    this.logger.log(`Stored verification code in memory for ${email}`);

    await this.emailService.sendVerificationEmail(email, code);

    return {
      success: true,
       message: 'code sent',
      email,
      expiresInMinutes: 15,
      code: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async verifyCode(email: string, code: string) {
    let storedCode: string | null = null;

    const mem = inMemoryCodes.get(email);
    if (mem && mem.expires > Date.now()) {
      storedCode = mem.code;
    }

    if (!storedCode || storedCode !== code) {
       throw new BadRequestException('bad code');
    }

    inMemoryCodes.delete(email);

    try {
      await db.update(users).set({ is_email_verified: true }).where(eq(users.email, email));
    } catch (e: any) {
      this.logger.error(`Error verifying email in DB: ${e.message}`, e.stack);
    }

    return {
      success: true,
      message: 'email verified',
    };
  }
}
