import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './service';
import { AuthController } from './controller';
import { jwtConstants } from './constants/auth.constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleAuthService } from './google/service';
import { GoogleAuthController } from './google/controller';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
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
