import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { HrModule } from '@/modules/features/hr/hr.module';
import { KiosksController } from './kiosks.controller';
import { KioskTerminalController } from './kiosk-terminal.controller';
import { KioskFaceController } from './kiosk-face.controller';
import { KioskWebAuthnController } from './kiosk-webauthn.controller';
import { KioskWebAuthnService } from './kiosk-webauthn.service';
import { KiosksRepository } from './kiosks.repository';
import { KioskService } from './kiosk.service';
import { KioskSessionGuard } from './kiosk-session.guard';
import { WebAuthnChallengeStore } from './webauthn-challenge.store';
import { WebAuthnCredentialRepository } from './webauthn.repository';
import { WebAuthnService } from './webauthn.service';

@Module({
  imports: [
    AuthModule,
    TenancyModule,
    RbacModule,
    AuditModule,
    forwardRef(() => HrModule),
  ],
  controllers: [
    KiosksController,
    KioskTerminalController,
    KioskFaceController,
    KioskWebAuthnController,
  ],
  providers: [
    KiosksRepository,
    KioskService,
    KioskWebAuthnService,
    KioskSessionGuard,
    WebAuthnChallengeStore,
    WebAuthnCredentialRepository,
    WebAuthnService,
  ],
  exports: [KiosksRepository, KioskService, WebAuthnService],
})
export class KioskModule {}
