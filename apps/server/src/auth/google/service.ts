import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@rona/types';
import sql from '../../db';
import { sanitizeInput } from '../dto/register.dto';
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8502/auth/google/callback'
  );

  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}
  async verifyGoogleToken(idToken: string) {
    if (!idToken || typeof idToken !== 'string') {
      throw new BadRequestException('bad google id token');
    }
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        this.logger.warn('google token has no email');
        throw new BadRequestException('invalid google token');
      }
      if (!payload.email_verified) {
        this.logger.warn(`google email not verified for ${payload.email}`);
        throw new BadRequestException('google email not verified');
      }
      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        googleId: payload.sub,
        picture: payload.picture,
      };
    } catch (error: any) {
      this.logger.error(`google token verify failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('invalid google id token');
    }
  }
  async googleLogin(googleUser: { email: string; firstName?: string; lastName?: string; googleId?: string; picture?: string }) {
    if (!googleUser || !googleUser.email) {
      throw new BadRequestException('google profile missing email');
    }
    try {
      const email = googleUser.email.toLowerCase().trim();
      const full_name = sanitizeInput(
        `${googleUser.firstName || ''} ${googleUser.lastName || ''}`.trim() || 'Google User');
      const result = await sql.begin(async (tx) => {
        let [user] = await tx`SELECT id, email, full_name FROM public.users WHERE email = ${email}`;
        let member;
        if (!user) {
          const orgName = `${full_name}'s Org`;
           const [insertedOrg] = await tx`INSERT INTO public.organizations (name) VALUES (${orgName}) RETURNING id`;
          
          const [newUser] = await tx`
            INSERT INTO public.users (email, password_hash, full_name, is_email_verified)
            VALUES (${email}, 'GOOGLE_OAUTH_ACCOUNT', ${full_name}, TRUE) RETURNING id, email, full_name
          `;
          user = newUser;
          const [newMember] = await tx`
            INSERT INTO public.tenant_members (user_id, tenant_id, role)
             VALUES (${user.id}, ${insertedOrg.id}, 'admin')
            RETURNING tenant_id, role
          `;
          member = newMember;
        } else {
           const [memberRow] = await tx`
             SELECT tenant_id, role 
             FROM public.tenant_members 
             WHERE user_id = ${user.id} 
             LIMIT 1
           `;
           member = memberRow;
        }
        return { user, member };
      });
      const position = result.member?.role === 'admin' ? 'admin' : undefined;
      const payload: JwtPayload = {
        sub: result.user.id,
        email: result.user.email,
        position,
        app_metadata: {
          role: result.member?.role || 'member',
          tenant_id: result.member?.tenant_id || '',
        },
      };
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });
      this.logger.log(`Successful Google OAuth login for user ${result.user.id}`);
      return {
        accessToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name,
          role: result.member?.role || 'member',
          tenant_id: result.member?.tenant_id || '',
        },
      };
    } catch (err: any) {
      this.logger.error(`google login error for ${googleUser.email}: ${err.message}`, err.stack);
      throw new InternalServerErrorException('google auth failed');
    }
  }
  getGoogleAuthUrl() {
    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
  }
  async getTokensFromCode(code: string) {
    if (!code || typeof code !== 'string') {
      throw new BadRequestException('bad auth code');
    }
    try {
      const { tokens } = await this.googleClient.getToken(code);
      return tokens;
    } catch (error: any) {
      this.logger.error(`code exchange failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('code exchange failed');
    }
  }
}
