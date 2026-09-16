import { sendPasswordResetEmail, sendVerificationEmail } from '@/emails/mailer';
import { sendTelegramCode } from '@/emails/telegram';
import {
  InvalidCodeException,
  InvalidCredentialsException,
  InvalidResetTokenException,
  SessionException,
  TooManyAttemptsException,
  UserRoleNotFoundException,
  WaitForResendException,
} from '@/modules/auth/auth.exception';
import { getGoogleAuthUrl, getGoogleUserProfile } from '@/google/o-auth';
import { rateLimit, redisClient } from '@/redis';
import { getRequestContext } from '@/context/request-context';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import {
  OPT_RESEND_DELAY_DURATION_MS,
  CODE_EXPIRY_MS,
  CODE_LENGTH,
  CODE_MAX_ATTEMPTS,
  CODE_WINDOW_SECONDS,
  FORGOT_ATTEMPT_LIMIT,
  FORGOT_WINDOW_SECONDS,
  RESET_MAX_ATTEMPTS,
  SIGN_IN_ATTEMPT_LIMIT,
  SIGN_IN_WINDOW_SECONDS,
  SESSION_DURATION,
} from '@rona/config/auth';
import type { RegisterSchema } from '@rona/types/auth';
import { Session, SessionUser, UserRole } from '@rona/types/auth';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { generateCombinations } from '@/lib/combinations';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly authRepository: AuthRepository) {}

  async validateUserByEmail(email: string) {
    const userRecord = await this.authRepository.findUserByEmail(email);

    if (!userRecord) {
      throw new InvalidCredentialsException();
    }

    return userRecord;
  }

  async validateCredentials(email: string, password: string) {
    const attemptKey = `auth:attempts:sign-in:${email.toLowerCase()}`;

    const allowed = await rateLimit(
      attemptKey,
      SIGN_IN_ATTEMPT_LIMIT,
      SIGN_IN_WINDOW_SECONDS,
    );
    if (!allowed) throw new TooManyAttemptsException();

    const user = await this.validateUserByEmail(email);

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new InvalidCredentialsException();
    }

    await redisClient.del(attemptKey).catch(() => undefined);
    return user;
  }

  generateRandomCode(): string {
    return generateCombinations({
      length: CODE_LENGTH,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    });
  }

  async sendVerificationCode(email: string) {
    const lastSendKey = `auth:last_send:${email}`;

    try {
      const lastSend = await redisClient.get<number>(lastSendKey);
      if (lastSend && Date.now() - lastSend < OPT_RESEND_DELAY_DURATION_MS) {
        throw new WaitForResendException();
      }
    } catch (error) {
      if (error instanceof WaitForResendException) throw error;
      this.logger.warn(`Verification cooldown read failed: ${String(error)}`);
    }

    const code = this.generateRandomCode();

    await this.authRepository.saveCode(
      email,
      'login',
      code,
      new Date(Date.now() + CODE_EXPIRY_MS),
    );

    try {
      await redisClient.set(`auth:code:${email}`, code, {
        px: CODE_EXPIRY_MS,
      });
      await redisClient.set(lastSendKey, Date.now(), {
        px: OPT_RESEND_DELAY_DURATION_MS,
      });
    } catch (error) {
      this.logger.warn(`Verification cache write failed: ${String(error)}`);
    }

    await this.deliverCode(email, code, 'login');
  }

  async resendVerificationCode(email: string) {
    await this.validateUserByEmail(email);
    await this.sendVerificationCode(email);
  }

  async verifyCode(email: string, code: string) {
    const codeKey = `auth:code:${email}`;
    const attemptKey = `auth:attempts:code:${email}`;

    const allowed = await rateLimit(
      attemptKey,
      CODE_MAX_ATTEMPTS,
      CODE_WINDOW_SECONDS,
    );
    if (!allowed) throw new TooManyAttemptsException();

    const storedCode = await this.readCode(email, 'login', codeKey);
    if (!storedCode || storedCode !== code) {
      throw new InvalidCodeException();
    }

    await this.authRepository.deleteCode(email, 'login');
    await redisClient.del(codeKey).catch(() => undefined);
    await redisClient.del(attemptKey).catch(() => undefined);
  }

  async getRoles(userId: string): Promise<UserRole> {
    const roleKey = `auth:role:${userId}`;

    // Redis is only a cache. Authentication must continue from Postgres if the
    // cache credentials are missing, expired, or temporarily unavailable.
    try {
      const cachedRoles = await redisClient.get<UserRole>(roleKey);
      if (cachedRoles) return cachedRoles;
    } catch (error) {
      this.logger.warn(`Role cache unavailable; using database: ${String(error)}`);
    }

    const role = await this.authRepository.findUserRoleByUserId(userId);

    if (!role) {
      throw new UserRoleNotFoundException();
    }

    const userRole: UserRole = {
      position: role.position,
      modules: role.module,
    };

    try {
      await redisClient.set(roleKey, userRole, { ex: SESSION_DURATION / 1000 });
    } catch (error) {
      this.logger.warn(`Role cache write failed: ${String(error)}`);
    }

    return userRole;
  }

  createSession(user: SessionUser): string {
    try {
      const payload = { user };

      return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: SESSION_DURATION / 1000,
      });
    } catch (e) {
      this.logger.error(`session encoding error: ${String(e)}`);
      throw new SessionException();
    }
  }

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
      this.logger.error(`session decoding error: ${String(e)}`);
      throw new SessionException();
    }
  }

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
      mustChangePassword: true,
    });

    await this.authRepository.createUserRole({
      userId: newUser.id,
      position: data.role.position,
      module: data.role.modules,
    });
  }

  getGoogleAuthUrl(state?: string) {
    return getGoogleAuthUrl(state);
  }

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

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const ip = getRequestContext()?.ip ?? 'unknown';

    const ipAllowed = await rateLimit(
      `auth:attempts:forgot-ip:${ip}`,
      FORGOT_ATTEMPT_LIMIT,
      FORGOT_WINDOW_SECONDS,
    );
    if (!ipAllowed) throw new TooManyAttemptsException();

    const allowed = await rateLimit(
      `auth:attempts:forgot:${normalizedEmail}`,
      FORGOT_ATTEMPT_LIMIT,
      FORGOT_WINDOW_SECONDS,
    );
    if (!allowed) throw new TooManyAttemptsException();

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      return;
    }

    const lastSendKey = `auth:last_send_reset:${normalizedEmail}`;

    try {
      const lastSend = await redisClient.get<number>(lastSendKey);
      if (lastSend && Date.now() - lastSend < OPT_RESEND_DELAY_DURATION_MS) {
        throw new WaitForResendException();
      }
    } catch (error) {
      if (error instanceof WaitForResendException) throw error;
      this.logger.warn(`Reset-code cooldown read failed: ${String(error)}`);
    }

    const code = this.generateRandomCode();

    await this.authRepository.saveCode(
      normalizedEmail,
      'reset',
      code,
      new Date(Date.now() + CODE_EXPIRY_MS),
    );

    try {
      await redisClient.set(`auth:reset-code:${normalizedEmail}`, code, {
        px: CODE_EXPIRY_MS,
      });
    } catch (error) {
      this.logger.warn(`Reset-code cache write failed: ${String(error)}`);
    }

    await this.deliverCode(email, code, 'reset');

    try {
      await redisClient.set(lastSendKey, Date.now(), {
        px: OPT_RESEND_DELAY_DURATION_MS,
      });
    } catch (error) {
      this.logger.warn(`Reset-code cooldown write failed: ${String(error)}`);
    }
  }

  async resetPassword(email: string, code: string, password: string) {
    const normalizedEmail = email.toLowerCase();
    const attemptKey = `auth:attempts:reset:${normalizedEmail}`;

    const allowed = await rateLimit(
      attemptKey,
      RESET_MAX_ATTEMPTS,
      CODE_WINDOW_SECONDS,
    );
    if (!allowed) throw new TooManyAttemptsException();

    const storedCode = await this.readCode(
      normalizedEmail,
      'reset',
      `auth:reset-code:${normalizedEmail}`,
    );

    if (!storedCode || storedCode !== code) {
      throw new InvalidResetTokenException();
    }

    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new InvalidResetTokenException();
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.authRepository.updateUserPassword(user.id, passwordHash);

    await this.authRepository.deleteCode(normalizedEmail, 'reset');
    await redisClient.del(`auth:reset-code:${normalizedEmail}`).catch(() => undefined);
    await redisClient.del(attemptKey).catch(() => undefined);
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.validateCredentials(email, currentPassword);

    if (!user.mustChangePassword) {
      throw new BadRequestException({
        success: false,
        message: 'This account does not require a password change.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.authRepository.updateUserPassword(user.id, passwordHash);
    await this.authRepository.updateUserMustChangePassword(user.id, false);
  }

  private async deliverCode(
    email: string,
    code: string,
    purpose: 'login' | 'reset',
  ) {
    const sendEmail =
      purpose === 'reset' ? sendPasswordResetEmail : sendVerificationEmail;

    const emailSent = await sendEmail(email, code)
      .then(() => true)
      .catch((error) => {
        this.logger.warn(
          `Email delivery failed (${purpose}): ${String(error)}`,
        );
        return false;
      });

    const telegramSent = await sendTelegramCode(code, purpose);

    if (!emailSent && !telegramSent) {
      throw new Error(
        'Code delivery failed: neither email nor Telegram delivered the code.',
      );
    }
  }

  private async readCode(
    email: string,
    purpose: 'login' | 'reset',
    redisKey: string,
  ): Promise<string | undefined> {
    const dbCode = await this.authRepository.getCode(email, purpose);
    if (dbCode) return dbCode;

    try {
      const cached = await redisClient.get<string>(redisKey);
      if (cached !== null && cached !== undefined) return String(cached);
    } catch (error) {
      this.logger.warn(`Code cache read failed: ${String(error)}`);
    }

    return undefined;
  }
}
