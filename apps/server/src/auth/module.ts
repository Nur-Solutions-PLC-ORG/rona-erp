import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './service';
import { AuthController } from './controller';
import { JWT_SECRET } from './constants/auth.constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthService } from './google/service';
import { GoogleAuthController } from './google/controller';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    PassportModule,
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'verify',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'sendVerification',
        ttl: 60000,
        limit: 3,
      },
      {
        name: 'mfa',
        ttl: 60000,
        limit: 5,
      },
      {
        name: 'roleManagement',
        ttl: 60000,
        limit: 10,
      },
    ]),
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController, GoogleAuthController],
  providers: [
    AuthService,
    GoogleAuthService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, EmailService],
})
export class AuthModule {}
