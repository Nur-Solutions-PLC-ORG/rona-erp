import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException, Logger, Inject } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import sql from '../../db';

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
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token payload or missing email');
      }

      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        googleId: payload.sub,
        picture: payload.picture,
      };
    } catch (error: any) {
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid Google ID Token');
    }
  }

  async googleLogin(googleUser: { email: string; firstName?: string; lastName?: string; googleId?: string; picture?: string }) {
    if (!googleUser || !googleUser.email) {
      throw new BadRequestException('Google profile missing required email');
    }

    try {
      const email = googleUser.email;
      const full_name = `${googleUser.firstName || ''} ${googleUser.lastName || ''}`.trim() || 'Google User';

      const result = await sql.begin(async (tx) => {
        let [user] = await tx`SELECT id, email, full_name FROM public.users WHERE email = ${email}`;
        let member;

        if (!user) {
          const orgName = `${full_name}'s Org`;
          const [org] = await tx`INSERT INTO public.organizations (name) VALUES (${orgName}) RETURNING id`;
          
          const [newUser] = await tx`
            INSERT INTO public.users (email, password_hash, full_name, is_email_verified)
            VALUES (${email}, 'GOOGLE_OAUTH_ACCOUNT', ${full_name}, TRUE) RETURNING id, email, full_name
          `;
          user = newUser;

          const [newMember] = await tx`
            INSERT INTO public.tenant_members (user_id, tenant_id, role)
            VALUES (${user.id}, ${org.id}, 'admin')
            RETURNING tenant_id, role
          `;
          member = newMember;
        } else {
          const [m] = await tx`
            SELECT tenant_id, role 
            FROM public.tenant_members 
            WHERE user_id = ${user.id} 
            LIMIT 1
          `;
          member = m;
        }

        const sessionId = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        await tx`
          INSERT INTO public.sessions (id, user_id, expires_at)
          VALUES (${sessionId}, ${user.id}, ${expiresAt})
        `;

        return { user, member, sessionId };
      });

      const payload = {
        sub: result.user.id,
        email: result.user.email,
        session_id: result.sessionId,
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
      this.logger.error(`Google Login Error: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Google authentication failed');
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
    const { tokens } = await this.googleClient.getToken(code);
    return tokens;
  }
}
