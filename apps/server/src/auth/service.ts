import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto, sanitizeInput } from './dto/register.dto';
import { JwtPayload } from '@rona/types';
import { EmailService } from './email/email.service';
import { db } from '../db';
import { users, tenantMembers, userRoles, organizations, verificationCodes, blacklistedTokens, refreshTokens } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
const scryptAsync = promisify(scrypt);

const POSITION_HIERARCHY: Record<string, number> = {
  owner: 3,
  admin: 2,
  managers: 1,
  staff: 0,
};

const VALID_POSITIONS = ['owner', 'admin', 'managers', 'staff'];
const VALID_TENANT_ROLES = ['admin', 'staff', 'member'];

@Injectable()
export class AuthService {
  private readonly ACCESS_TOKEN_TTL = '7d';
  private readonly logger = new Logger(AuthService.name);
  private mfaEncryptionKey: Buffer | undefined;

  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  private async getUserPosition(userId: string): Promise<string | undefined> {
    const result = await db.select({ position: userRoles.position }).from(userRoles).where(eq(userRoles.user_id, userId)).limit(1);
    return result[0]?.position;
  }

  hasPermission(userPosition: string | undefined, requiredPosition: string): boolean {
    if (!userPosition) return false;
    return (POSITION_HIERARCHY[userPosition] || 0) >= (POSITION_HIERARCHY[requiredPosition] || 0);
  }

  async onModuleInit() {
    const isProd = process.env.NODE_ENV === 'production';
    const key = process.env.MFA_ENCRYPTION_KEY;
    const salt = process.env.MFA_SCRYPT_SALT;

    if (!key) {
      if (isProd) {
        throw new Error('mfa encryption key missing in production');
      }
      this.logger.warn('mfa encryption key not set  mfa stuff wont work');
      return;
    }

    if (isProd && !salt) {
      throw new Error('mfa scrypt salt missing in production');
    }

    const saltBuffer = Buffer.from(salt || 'rona-erp-mfa-salt', 'utf-8');
    this.mfaEncryptionKey = await scryptAsync(key, saltBuffer, 32) as Buffer;
  }

  private async encryptMfaSecret(secret: string): Promise<string> {
    if (!this.mfaEncryptionKey) {
      throw new InternalServerErrorException('mfa encryption key not set');
    }
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.mfaEncryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  private async decryptMfaSecret(encryptedSecret: string): Promise<string> {
    if (!this.mfaEncryptionKey) {
      throw new InternalServerErrorException('mfa encryption key not set');
    }
    const parts = encryptedSecret.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.mfaEncryptionKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    if (!email || !email.trim()) {
      throw new BadRequestException('email is required');
    }
    if (!password) {
      throw new BadRequestException('password is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('invalid email format');
    }

    try {
      let user;
      let member;

      const cleanEmail = email.toLowerCase().trim();
      const result = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      user = result[0];
      if (user) {
       const memberResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, user.id)).limit(1);
         member = memberResult[0];
      }
      if (!user) {
        this.logger.warn(`login failed for ${email} from ${ipAddress}`);
        throw new UnauthorizedException('wrong login');
      }

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        this.logger.warn(`locked account login try for user ${user.id} from ${ipAddress}`);
        throw new BadRequestException('account locked try again later');
      }

       const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
       if (!isValidPassword) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await db.update(users).set({
          failed_login_attempts: attempts,
          locked_until: lockedUntil,
        }).where(eq(users.id, user.id));
        this.logger.warn(`bad password for user ${user.id} from ${ipAddress} try ${attempts}/5`);
        throw new UnauthorizedException('wrong login'); }
      await db.update(users).set({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      }).where(eq(users.id, user.id));
       this.logger.log(`user ${user.id} logged in from ${ipAddress}`);
       const tenantRole = member?.role || 'staff';
       if (user.mfa_enabled) {
        return {
          mfa_required: true,
          email: user.email,
          message: 'enter the code sent to your email',
        };
      }
      const position = await this.getUserPosition(user.id);
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        position,
         app_metadata: {
           role: tenantRole,
           tenant_id: member?.tenant_id || user.tenant_id || '',
         },
       };
       const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.ACCESS_TOKEN_TTL });
       const refreshToken = await this.generateRefreshToken(user.id);
       this.logger.log(`user ${user.id} logged in from ${ipAddress}`);
       return {
         accessToken,
         refreshToken,
         user: {
           id: user.id,
           email: user.email,
           full_name: user.full_name,
           role: tenantRole,
           tenant_id: member?.tenant_id || user.tenant_id || '',
         },
       };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`login error: ${err.message}`, err.stack);
      throw new InternalServerErrorException('login failed try later');
    }
  }

   async getUserStatus(userId: string, exp?: number) {
     const userResult = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
     const user = userResult[0];
    if (!user) {
      return null;
    }

    const rolesRows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));

    let rolesList: Array<{ position: string; module: string[] }> = [];

    if (rolesRows.length > 0) {
       rolesList = rolesRows.map(roleRow => ({
         position: roleRow.position,
         module: roleRow.module || [],
       }));
    } else {
       const memberResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, userId)).limit(1);
       const member = memberResult[0];
      rolesList = [{
        position: member?.role || 'staff',
        module: ['HR', 'Inventory', 'Finance'],
      }];
    }
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      roles: rolesList,
      expires: exp ? new Date(exp * 1000) : null,
    };
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
        throw new UnauthorizedException('user not found');
      }

      return { user };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`profile error: ${err.message}`, err.stack);
      throw new InternalServerErrorException('could not get profile');
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
    this.logger.log('saved verification code hash');
    await this.emailService.sendVerificationEmail(email, code);
    return {
      success: true,
      message: 'code sent',
      email,
      expiresInMinutes: 15,
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
      await db.update(users).set({ is_email_verified: true }).where(eq(users.email, sanitizedEmail));
     } catch (err: any) {
       this.logger.error(`email verify db error: ${err.message}`, err.stack);
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
      throw new BadRequestException('email already taken');
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

    this.logger.log(`new user signed up: ${sanitizedEmail}`);

    return {
      message: 'signup done',
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

    this.logger.log(`token blacklisted for user ${userId}`);

    return { success: true, message: 'logged out' };
  }

  async generateRefreshToken(userId: string) {
    const refreshToken = randomUUID();
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      token_hash: tokenHash,
      user_id: userId,
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
      throw new UnauthorizedException('refresh token invalid or expired');
    }

    return token;
  }

  async rotateRefreshToken(oldToken: string, userId: string) {
    const tokenHash = await bcrypt.hash(oldToken, 10);
    await db.update(refreshTokens).set({ revoked_at: new Date() }).where(and(eq(refreshTokens.user_id, userId), eq(refreshTokens.token_hash, tokenHash)));
    return this.generateRefreshToken(userId);
  }

  async forgotPassword(email: string) {
    const sanitizedEmail = email.toLowerCase().trim();

    const result = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    const user = result[0];
    if (!user) {
      this.logger.warn('password reset asked for unknown email');
      return { success: true, message: 'reset code sent' };
    }
    await db.delete(verificationCodes).where(eq(verificationCodes.email, sanitizedEmail));

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

    this.logger.log(`password reset code sent to ${sanitizedEmail}`);

    return {
      success: true,
      message: 'reset code sent',
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
      throw new BadRequestException('code invalid or expired');
    }

    await db.delete(verificationCodes).where(eq(verificationCodes.id, stored.id));

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.email, sanitizedEmail));

    this.logger.log(`password reset worked for ${sanitizedEmail}`);

    return { success: true, message: 'password reset done' };
  }

  async generateMfaSecret(userId: string) {
    if (!this.mfaEncryptionKey) {
      throw new BadRequestException('mfa encryption key not set');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const encryptedCode = await this.encryptMfaSecret(code);
    await db.update(users).set({ mfa_secret_encrypted: encryptedCode }).where(eq(users.id, userId));

    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];
    if (user) {
      await this.emailService.sendVerificationEmail(user.email, code);
    }

    this.logger.log(`mfa code sent to user ${userId}`);

    return { success: true, message: 'code sent to your email' };
  }

  async enableMfa(userId: string, code: string) {
    if (!this.mfaEncryptionKey) {
      throw new BadRequestException('mfa encryption key not set');
    }
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];
    if (!user || !user.mfa_secret_encrypted) {
      throw new BadRequestException('mfa setup not started');
    }

    const decryptedCode = await this.decryptMfaSecret(user.mfa_secret_encrypted);
    if (decryptedCode !== code) {
      throw new BadRequestException('bad code');
    }

    await db.update(users).set({ mfa_enabled: true }).where(eq(users.id, userId));

    this.logger.log(`mfa turned on for user ${userId}`);
    return { success: true, message: 'mfa enabled' };
  }

  async verifyMfa(userId: string, code: string): Promise<boolean> {
    if (!this.mfaEncryptionKey) {
      throw new BadRequestException('mfa encryption key not set');
    }
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];
    if (!user || !user.mfa_enabled || !user.mfa_secret_encrypted) {
      return false;
    }

    const decryptedCode = await this.decryptMfaSecret(user.mfa_secret_encrypted);
    return decryptedCode === code;
  }

  async disableMfa(userId: string, code: string) {
    if (!this.mfaEncryptionKey) {
      throw new BadRequestException('mfa encryption key not set');
    }
    const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResult[0];
    if (!user || !user.mfa_enabled || !user.mfa_secret_encrypted) {
      throw new BadRequestException('mfa not turned on');
    }

    const decryptedCode = await this.decryptMfaSecret(user.mfa_secret_encrypted);
    if (decryptedCode !== code) {
      throw new BadRequestException('bad code');
    }

    await db.update(users).set({ mfa_enabled: false, mfa_secret_encrypted: null }).where(eq(users.id, userId));

    this.logger.log(`mfa turned off for user ${userId}`);
    return { success: true, message: 'mfa disabled' };
  }
  async refreshToken(refreshToken: string) {
    const token = await this.validateRefreshToken(refreshToken);

    const userResult = await db.select().from(users).where(eq(users.id, token.user_id)).limit(1);
    const user = userResult[0];
    if (!user) {
      throw new UnauthorizedException('user not found');
    }

     const memberResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, user.id)).limit(1);
     const member = memberResult[0];
 
     const tenantRole = member?.role || 'staff';
 
     await db.update(refreshTokens).set({ revoked_at: new Date() }).where(eq(refreshTokens.id, token.id));
 
     const newRefreshToken = await this.generateRefreshToken(user.id);
 
     const position = await this.getUserPosition(user.id);
     const payload: JwtPayload = {
       sub: user.id,
       email: user.email,
       position,
       app_metadata: {
         role: tenantRole,
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
         role: tenantRole,
         tenant_id: member?.tenant_id || user.tenant_id || '',
       },
     };
  }
  async verifyMfaLogin(email: string, code: string, ipAddress?: string, userAgent?: string) {
    const sanitizedEmail = email.toLowerCase().trim();
    const result = await db.select().from(users).where(eq(users.email, sanitizedEmail)).limit(1);
    const user = result[0];
    if (!user) {
      throw new UnauthorizedException('wrong login');
    }

    const isValid = await this.verifyMfa(user.id, code);
    if (!isValid) {
      this.logger.warn(`bad mfa try for user ${user.id} from ${ipAddress}`);
      throw new UnauthorizedException('bad code');
    }

     const memberResult = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, user.id)).limit(1);
     const member = memberResult[0];
     const tenantRole = member?.role || 'staff';
 
     await db.update(users).set({
       failed_login_attempts: 0,
       locked_until: null,
       last_login_at: new Date(),
     }).where(eq(users.id, user.id));
 
     const position = await this.getUserPosition(user.id);
     const payload: JwtPayload = {
       sub: user.id,
       email: user.email,
       position,
       app_metadata: {
         role: tenantRole,
         tenant_id: member?.tenant_id || user.tenant_id || '',
       },
     };
     const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.ACCESS_TOKEN_TTL });
     const refreshToken = await this.generateRefreshToken(user.id);
 
     this.logger.log(`mfa login worked for user ${user.id} from ${ipAddress}`);
     return {
       accessToken,
       refreshToken,
       user: {
         id: user.id,
         email: user.email,
         full_name: user.full_name,
         role: tenantRole,
         tenant_id: member?.tenant_id || user.tenant_id || '',
       },
     };
  }

  async getTenantUsers(tenantId: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        role: tenantMembers.role,
        position: userRoles.position,
      })
      .from(users)
      .leftJoin(tenantMembers, eq(users.id, tenantMembers.user_id))
      .leftJoin(userRoles, eq(users.id, userRoles.user_id))
      .where(eq(users.tenant_id, tenantId));

     const seen = new Set<string>();
     return result.filter((user) => {
       if (seen.has(user.id)) return false;
       seen.add(user.id);
       return true;
     });
  }

  async setUserPosition(actorId: string, targetId: string, position: string, tenantId: string) {
    if (!VALID_POSITIONS.includes(position)) {
      throw new BadRequestException('invalid position');
    }

    const actor = await db.select().from(users).where(eq(users.id, actorId)).limit(1);
    if (!actor[0]) {
      throw new BadRequestException('actor not found');
    }

    const actorPosition = await this.getUserPosition(actorId);
    if (!this.hasPermission(actorPosition, 'admin')) {
      throw new BadRequestException('only admin or owner can set positions');
    }

    if (actorId === targetId) {
      const currentLevel = POSITION_HIERARCHY[actorPosition || ''] || 0;
      const newLevel = POSITION_HIERARCHY[position] || 0;
      if (newLevel < currentLevel) {
        throw new BadRequestException('cannot lower your own position');
      }
    }

    const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!target[0]) {
      throw new BadRequestException('user not found');
    }

    const targetMember = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, targetId)).limit(1);
    if (!targetMember[0] || targetMember[0].tenant_id !== tenantId) {
      throw new BadRequestException('user not in your role');
    }

    const existing = await db.select().from(userRoles).where(eq(userRoles.user_id, targetId)).limit(1);
    if (existing[0]) {
      await db.update(userRoles).set({ position: position as any, updated_at: new Date() }).where(eq(userRoles.user_id, targetId));
    } else {
      await db.insert(userRoles).values({ user_id: targetId, position: position as any });
    }

    this.logger.log(`user ${targetId} position set to ${position} by ${actorId}`);
    return { success: true };
  }

  async setTenantRole(actorId: string, targetId: string, role: string, tenantId: string) {
    if (!VALID_TENANT_ROLES.includes(role)) {
      throw new BadRequestException('invalid tenant role');
    }

    const actor = await db.select().from(users).where(eq(users.id, actorId)).limit(1);
    if (!actor[0]) {
      throw new BadRequestException('actor not found');
    }

    const actorPosition = await this.getUserPosition(actorId);
    if (!this.hasPermission(actorPosition, 'admin')) {
      throw new BadRequestException('only admin or owner can set tenant roles');
    }

    if (actorId === targetId) {
      throw new BadRequestException('cannot change your own tenant role');
    }

    const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!target[0]) {
      throw new BadRequestException('user not found');
    }

    const targetMember = await db.select().from(tenantMembers).where(eq(tenantMembers.user_id, targetId)).limit(1);
    if (!targetMember[0] || targetMember[0].tenant_id !== tenantId) {
      throw new BadRequestException('user not in your tenant');
    }

    await db.update(tenantMembers).set({ role }).where(eq(tenantMembers.user_id, targetId));

    this.logger.log(`user ${targetId} tenant role set to ${role} by ${actorId}`);
    return { success: true };
  }
}
