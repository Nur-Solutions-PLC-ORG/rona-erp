import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailService } from './email/email.service';

import sql from '../db';
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
      throw new BadRequestException("Please provide either email or both eid and tenant_id");
    }

    try {
      let user;
      let member;

      if (email) {
        const [u] = await sql`SELECT id, email, password_hash, full_name, is_email_verified FROM public.users WHERE email = ${email}`;
        user = u;
        if (user) {
          const [m] = await sql`
            SELECT tenant_id, role 
            FROM public.tenant_members 
            WHERE user_id = ${user.id} 
            LIMIT 1
          `;
          member = m;
        }
      } else {
        const tenantIdVal = tenant_id ?? null;
        const eidVal = eid ?? null;

        const [u] = await sql`
          SELECT id, email, password_hash, full_name, is_email_verified 
          FROM public.users 
          WHERE tenant_id = ${tenantIdVal} AND eid = ${eidVal}
        `;
        user = u;
        if (user) {
          const [m] = await sql`
            SELECT tenant_id, role 
            FROM public.tenant_members 
            WHERE user_id = ${user.id} AND tenant_id = ${tenantIdVal}
            LIMIT 1
          `;
          member = m;
        }
      }

      if (!user || !member) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw new UnauthorizedException("Invalid credentials");
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        app_metadata: {
          role: member.role,
          tenant_id: member.tenant_id
        }
      };

      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: this.ACCESS_TOKEN_TTL });
      
      this.logger.log(`Successful login for user ${user.id} [IP: ${ipAddress}, Agent: ${userAgent}]`);

      return {
        accessToken,
        user: { 
          id: user.id, 
          email: user.email, 
          full_name: user.full_name, 
          role: member.role, 
          tenant_id: member.tenant_id 
        }
      };
    } catch (err: any) {
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Login Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException("Login failed. Please try again later.");
    }
  }

  async me(userId: string) {
    try {
      const [user] = await sql`
        SELECT u.id, u.email, u.full_name, u.status, u.is_email_verified, m.role, m.tenant_id, o.name as company_name
        FROM public.users u
        JOIN public.tenant_members m ON u.id = m.user_id
        JOIN public.organizations o ON m.tenant_id = o.id
        WHERE u.id = ${userId}
      `;

      if (!user) {
        throw new BadRequestException("User not found");
      }

      return { user };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      this.logger.error(`Me Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException("Failed to fetch user profile");
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
      message: 'Verification code sent successfully',
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
      throw new BadRequestException('Invalid or expired verification code');
    }

    inMemoryCodes.delete(email);

    try {
      await sql`UPDATE public.users SET is_email_verified = true WHERE email = ${email}`;
    } catch {}

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
}