import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${process.env.APP_URL || 'http://localhost:8502'}/auth/google/callback`;

    if (!clientID || !clientSecret) {
      throw new BadRequestException('Google credentials are required');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      state: true,
      passReqToCallback: false,
    });
  }

  validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): void {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;
      const picture = profile.photos?.[0]?.value;

      if (!email) {
        this.logger.warn('google profile missing email');
        return done(new BadRequestException('google profile missing email'), false);
      }

      const user = {
        email: email.toLowerCase().trim(),
        firstName: firstName || '',
        lastName: lastName || '',
        picture: picture || '',
        accessToken,
        googleId: profile.id,
      };

      this.logger.log(`google oauth worked for ${user.email}`);
      done(null, user);
    } catch (error: any) {
      this.logger.error(`google strategy error: ${error.message}`, error.stack);
      done(error, false);
    }
  }
}
