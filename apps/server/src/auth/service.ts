import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, sanitizeInput } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from './email/email.service';
import { db } from '../db';
import { users, tenantMembers, userRoles, organizations, sessions, verificationCodes, blacklistedTokens, refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';

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
        const sanitizedEmail = email.toLowerCase().trim();
        const result = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
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
        this.logger.warn(`Failed login attempt for email: ${email} [IP: ${ipAddress}]`);
        throw new UnauthorizedException("wrong login");
      }

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        this.logger.warn(`Locked account login attempt for user ${user.id} [IP: ${ipAddress}]`);
        throw new BadRequestException('Account is temporarily locked. Try again later.');
      }

      const valid = await bcrypt.compare(password, user.password_hash || '');
      if (!valid) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await db.update(users).set({
          failed_login_attempts: attempts,
          locked_until: lockedUntil,
        }).where(eq(users.id, user.id));
        this.logger.warn(`Failed login attempt ${attempts}/5 for user ${user.id} [IP: ${ipAddress}]`);
        throw new UnauthorizedException("wrong login");
      }

      await db.update(users).set({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      }).where(eq(users.id, user.id));
      this.logger.log(`Successful login for user ${user.id} [IP: ${ipAddress}, Agent: ${userAgent}]`);

       const roleStr = member?.role || 'staff';

       if (user.mfa_enabled || roleStr === 'admin' || roleStr === 'owner') {
         await this.sendVerificationCode(user.email);
         return {
           mfa_required: true,
           email: user.email,
           message: "code sent, wait 60s",
         };
       }
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
      const refreshToken = await this.generateRefreshToken(user.id, sessionId);

      this.logger.log(`Successful login for user ${user.id} [IP: ${ipAddress}, Agent: ${userAgent}]`);
      return {
        accessToken,
        refreshToken,
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
    const sanitizedEmail = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlSeconds = 900;
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await db.insert(verificationCodes).values({
      email: sanitizedEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    this.logger.log(`Stored verification code hash in databse for ${email}`);

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
    const sanitizedEmail = email.toLowerCase().trim();
    const now = new Date();
    const rows = await db
      .select()
      .from(verificationCodes)
      .where(and(eq(verificationCodes.email, sanitizedEmail), gt(verificationCodes.expires_at, now)))
      .orderBy(verificationCodes.created_at)
      .limit(1);

    const stored = rows[0];
    if (!stored || !(await bcrypt.compare(code, stored.code_hash))) {
      throw new BadRequestException('bad code');
    }

    await db.delete(verificationCodes).where(eq(verificationCodes.id, stored.id));

    try {
      await db.update(users).set({ is_email_verified: true }).where(eq(users.email, email));
    } catch (e: any) {
      this.logger.error(`Error verifying email in database: ${e.message}`, e.stack);
    }

    return {
      success: true,
      message: 'email verified',
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, orgName } = registerDto;
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = sanitizeInput(name.trim());
    const sanitizedOrgName = sanitizeInput(orgName.trim());

    const existing = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    if (existing[0]) {
      throw new BadRequestException('email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const orgId = randomUUID();
    const userId = randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(organizations).values({ id: orgId, name: sanitizedOrgName });

      await tx.insert(users).values({
        id: userId,
        email: sanitizedEmail,
        password_hash: passwordHash,
        full_name: sanitizedName,
        is_email_verified: false,
        tenant_id: orgId,
      });

      await tx.insert(tenantMembers).values({
        user_id: userId,
        tenant_id: orgId,
        role: 'admin',
      });
    });

    this.logger.log(`New user registered: ${sanitizedEmail}`);

    return {
      message: 'registration successful',
      user: { email: sanitizedEmail, full_name: sanitizedName, role: 'admin' },
    };
  }

  async logout(userId: string, token: string) {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(blacklistedTokens).values({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
    });

    await db.update(refreshTokens).set({ revoked_at: new Date() }).where(eq(refreshTokens.user_id, userId));

    this.logger.log(`Token blacklisted and refresh tokens revoked for user ${userId}`);

    return { success: true, message: 'logged out' };
  }

  async generateRefreshToken(userId: string, sessionId: string) {
    const refreshToken = randomUUID();
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      token_hash: tokenHash,
      user_id: userId,
      session_id: sessionId,
      expires_at: expiresAt,
    });

    return refreshToken;
  }

  async validateRefreshToken(refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const result = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.token_hash, tokenHash), gt(refreshTokens.expires_at, new Date()), eq(refreshTokens.revoked_at, null as any)))
      .limit(1);

    const token = result[0];
    if (!token) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return token;
  }

  async rotateRefreshToken(oldToken: string, userId: string, sessionId: string) {
    await db.update(refreshTokens).set({ revoked_at: new Date() }).where(eq(refreshTokens.user_id, userId));
    return this.generateRefreshToken(userId, sessionId);
  }

  async forgotPassword(email: string) {
    const sanitizedEmail = email.toLowerCase().trim();

    const result = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    const user = result[0];
    if (!user) {
      throw new BadRequestException('email not found');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const ttlSeconds = 900;
    const codeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await db.insert(verificationCodes).values({
      email: sanitizedEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    await this.emailService.sendVerificationEmail(sanitizedEmail, resetCode);

    this.logger.log(`Password reset code sent to ${sanitizedEmail}`);

    return {
      success: true,
      message: 'reset code sent',
      code: process.env.NODE_ENV !== 'production' ? resetCode : undefined,
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const sanitizedEmail = email.toLowerCase().trim();

    const now = new Date();
    const rows = await db
      .select()
      .from(verificationCodes)
      .where(and(eq(verificationCodes.email, sanitizedEmail), gt(verificationCodes.expires_at, now)))
      .orderBy(verificationCodes.created_at)
      .limit(1);

    const stored = rows[0];
    if (!stored || !(await bcrypt.compare(code, stored.code_hash))) {
      throw new BadRequestException('invalid or expired code');
    }

    await db.delete(verificationCodes).where(eq(verificationCodes.id, stored.id));

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.email, sanitizedEmail));

    this.logger.log(`Password reset successful for ${sanitizedEmail}`);

    return { success: true, message: 'password reset successful' };
  }

  async refreshToken(refreshToken: string) {
    const token = await this.validateRefreshToken(refreshToken);

    const userResult = await db.select().from(users).where(eq(users.id, token.user_id)).limit(1);
    const user = userResult[0];
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const memberResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, user.id)).limit(1);
    const member = memberResult[0];

    const roleStr = member?.role || 'staff';
    const newSessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      id: newSessionId,
      user_id: user.id,
      expires_at: expiresAt,
    });

    await db.update(refreshTokens).set({ revoked_at: new Date() }).where(eq(refreshTokens.id, token.id));

    const newRefreshToken = await this.generateRefreshToken(user.id, newSessionId);

    const payload = {
      sub: user.id,
      email: user.email,
      session_id: newSessionId,
      app_metadata: {
        role: roleStr,
        tenant_id: member?.tenant_id || user.tenant_id || '',
      },
    };

    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.ACCESS_TOKEN_TTL });
    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: roleStr,
        tenant_id: member?.tenant_id || user.tenant_id || '',
      },
    };
  }
}