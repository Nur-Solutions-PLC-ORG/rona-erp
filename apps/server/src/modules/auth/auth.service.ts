import { sendPasswordResetEmail, sendVerificationEmail } from '@/emails/resend';
import {
  InvalidCodeException,
  InvalidCredentialsException,
  InvalidResetTokenException,
  SessionException,
  UserNotFoundException,
  UserRoleNotFoundException,
  WaitForResendException,
} from '@/modules/auth/auth.exception';
import { getGoogleAuthUrl, getGoogleUserProfile } from '@/google/o-auth';
import { redisClient } from '@/redis';
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import {
  OPT_RESEND_DELAY_DURATION_MS,
  CODE_EXPIRY_MS,
  CODE_LENGTH,
  SESSION_DURATION,
} from '@rona/config/auth';
import type { RegisterSchema } from '@rona/types/auth';
import { Session, SessionUser, UserRole } from '@rona/types/auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { generateCombinations } from '@/lib/combinations';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  // gets user by email
  async validateUserByEmail(email: string) {
    const userRecord = await this.authRepository.findUserByEmail(email);

    if (!userRecord) {
      throw new InvalidCredentialsException();
    }

    return userRecord;
  }

  // get user with matching email and password
  async validateCredentials(email: string, password: string) {
    const user = await this.validateUserByEmail(email);

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new InvalidCredentialsException();
    }

    return user;
  }

  // Random verification code generator
  generateRandomCode(): string {
    return generateCombinations({
      length: CODE_LENGTH,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    });
  }

  // Sends verification code
  async sendVerificationCode(email: string) {
    const lastSendKey = `auth:last_send:${email}`;

    const lastSend = await redisClient.get<number>(lastSendKey);

    if (lastSend && Date.now() - lastSend < OPT_RESEND_DELAY_DURATION_MS) {
      throw new WaitForResendException();
    }

    const code = this.generateRandomCode();

    const codeKey = `auth:code:${email}`;

    await redisClient.set(codeKey, code, { px: CODE_EXPIRY_MS });
    await redisClient.set(lastSendKey, Date.now(), {
      px: OPT_RESEND_DELAY_DURATION_MS,
    });

    await sendVerificationEmail(email, code);
  }

  async resendVerificationCode(email: string) {
    await this.validateUserByEmail(email);
    await this.sendVerificationCode(email);
  }

  // Verifies code
  async verifyCode(email: string, code: string) {
    const codeKey = `auth:code:${email}`;
    const storedCode = await redisClient.get<string>(codeKey);

    if (!storedCode || storedCode !== code) {
      throw new InvalidCodeException();
    }

    await redisClient.del(codeKey);
  }

  // get users role
  async getRoles(userId: string): Promise<UserRole> {
    const roleKey = `auth:role:${userId}`;
    const cachedRoles = await redisClient.get<UserRole>(roleKey);
    if (cachedRoles) return cachedRoles;

    const role = await this.authRepository.findUserRoleByUserId(userId);

    if (!role) {
      throw new UserRoleNotFoundException();
    }

    const userRole: UserRole = {
      position: role.position,
      modules: role.module,
    };

    await redisClient.set(roleKey, userRole, { ex: SESSION_DURATION / 1000 });
    return userRole;
  }

  // encoding a jwt session token
  createSession(user: SessionUser): string {
    try {
      const payload = { user };

      return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: SESSION_DURATION / 1000,
      });
    } catch (e) {
      console.log('session encoding error: ', e);
      throw new SessionException();
    }
  }

  // decoding a jwt session token
  async decodeSession(token: string): Promise<Session> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        user: SessionUser;
        exp: number;
      };
      const role = await this.getRoles(payload.user.id);

      return {
        user: payload.user,
        role,
        expires: new Date(payload.exp * 1000).toISOString(),
      };
    } catch (e) {
      console.log('session decoding error: ', e);
      throw new SessionException();
    }
  }

  // registers a platform user
  async registerUser(data: RegisterSchema) {
    const existing = await this.authRepository.findUserByEmail(data.email);
    if (existing) {
      throw new BadRequestException({
        success: false,
        message: 'Email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await this.authRepository.createUser({
      fullName: data.fullName,
      email: data.email,
      passwordHash,
      tfaEnabled: data.tfaEnabled,
      isEmailVerified: true,
    });

    await this.authRepository.createUserRole({
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

    const token = this.createSession({
      id: user.id,
      email: user.email,
      name: user.fullName,
    });

    return { token };
  }

  // forgot-password: validates email, generates a secure one-time token, stores it in Redis, and sends a reset email
  async forgotPassword(email: string) {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new UserNotFoundException();
    }

    const token = this.generateRandomCode();

    const resetTokenKey = `auth:reset-token:${user.id}`;
    await redisClient.set(resetTokenKey, token, { px: CODE_EXPIRY_MS });

    await sendPasswordResetEmail(email, token);
  }

  // reset-password: validates the token against Redis, checks expiration, hashes the new password, and updates the user
  async resetPassword(token: string, password: string) {
    const resetTokenKey = `auth:reset-token:*`;
    const [, keys] = await redisClient.scan(0, {
      match: resetTokenKey,
      count: 100,
    });

    let foundKey: string | null = null;

    for (const key of keys) {
      const storedToken = await redisClient.get<string>(key);
      if (storedToken === token) {
        foundKey = key;
        break;
      }
    }

    if (!foundKey) {
      throw new InvalidResetTokenException();
    }

    const userId = foundKey.replace('auth:reset-token:', '');

    const passwordHash = await bcrypt.hash(password, 10);

    await this.authRepository.updateUserPassword(userId, passwordHash);

    await redisClient.del(foundKey);
  }
}
