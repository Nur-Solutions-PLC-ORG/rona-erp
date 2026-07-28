import { db } from '@/db';
import { userRoles, users } from '@/db/schema';
import { sendVerificationEmail } from '@/emails/resend';
import { getGoogleAuthUrl, getGoogleUserProfile } from '@/google/o-auth';
import { redisClient } from '@/redis';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  OPT_RESEND_DELAY_DURATION_MS,
  VERIFICATION_CODE_EXPIRY_MS,
  VERIFICATION_CODE_LENGTH,
} from '@rona/config/auth';
import type { RegisterSchema } from '@rona/types/auth';
import { Session, SessionUser, UserRole } from '@rona/types/auth';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  // gets user by email
  async validateUserByEmail(email: string) {
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (userRecords.length === 0) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const userRecord = userRecords[0];

    return userRecord;
  }

  // get user with matching email and password
  async validateCredentials(email: string, password: string) {
    const user = await this.validateUserByEmail(email);
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
      });
    }

    return user;
  }

  // Random verification code generator
  generateRandomCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Sends verification code
  async sendVerificationCode(email: string) {
    const lastSendKey = `auth:last_send:${email}`;
    const lastSend = await redisClient.get<number>(lastSendKey);

    if (lastSend && Date.now() - lastSend < OPT_RESEND_DELAY_DURATION_MS) {
      const remaining = Math.ceil(
        (OPT_RESEND_DELAY_DURATION_MS - (Date.now() - lastSend)) / 1000,
      );
      throw new BadRequestException({
        success: false,
        message: `Please wait ${remaining}s before requesting a new code`,
      });
    }

    const code = this.generateRandomCode();
    const codeKey = `auth:code:${email}`;

    await redisClient.set(codeKey, code, { px: VERIFICATION_CODE_EXPIRY_MS });
    await redisClient.set(lastSendKey, Date.now(), {
      px: OPT_RESEND_DELAY_DURATION_MS,
    });

    await sendVerificationEmail(email, code);
  }

  // Verifies code
  async verifyCode(email: string, code: string) {
    const codeKey = `auth:code:${email}`;
    const storedCode = await redisClient.get<string>(codeKey);

    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    await redisClient.del(codeKey);
  }

  // get users roles
  async getRoles(userId: string): Promise<UserRole> {
    const rolesKey = `auth:roles:${userId}`;
    const cachedRoles = await redisClient.get<UserRole>(rolesKey);
    if (cachedRoles) return cachedRoles;

    const rolesRecords = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    if (rolesRecords.length === 0) {
      throw new ForbiddenException({
        success: false,
        message: 'No roles found for user',
      });
    }

    const role = rolesRecords[0];
    const userRole: UserRole = {
      position: role.position,
      modules: role.module,
    };

    await redisClient.set(rolesKey, userRole, { ex: 30 }); // cache for 30s
    return userRole;
  }

  // encoding a jwt session token
  createSession(user: SessionUser): string {
    try {
      const sessionUser: SessionUser = { id: user.id, email: user.email };
      const payload = { user: sessionUser };

      return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
    } catch (e) {
      console.log('session ecoding error: ', e);
      throw new UnauthorizedException({
        success: false,
        message: 'Error encoding token',
      });
    }
  }

  // decoding a jwt session token
  async decodeSession(token: string): Promise<Session> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        user: SessionUser;
        exp: number;
      };
      const roles = await this.getRoles(payload.user.id);

      return {
        user: payload.user,
        roles,
        expires: new Date(payload.exp * 1000).toISOString(),
      };
    } catch (e) {
      console.log('session decoding error: ', e);
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid session token',
      });
    }
  }

  // registers a platform user
  async registerUser(data: RegisterSchema) {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    if (existing.length > 0) {
      throw new BadRequestException({
        success: false,
        message: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUserRecord = await db
      .insert(users)
      .values({
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        tfaEnabled: data.tfaEnabled,
        isEmailVerified: true,
      })
      .returning();

    const newUser = newUserRecord[0];

    await db.insert(userRoles).values({
      userId: newUser.id,
      position: data.role.position,
      module: data.role.modules,
    });
  }

  // generates google auth url
  getGoogleAuthUrl() {
    return getGoogleAuthUrl();
  }

  // handles google callback
  async handleGoogleCallback(code: string) {
    const profile = await getGoogleUserProfile(code);
    const user = await this.validateUserByEmail(profile.email);

    const token = this.createSession(user);
    return { token };
  }
}
