import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { HrModule } from '@/modules/features/hr/hr.module';
import { KiosksController } from './kiosks.controller';
import { KioskTerminalController } from './kiosk-terminal.controller';
import { KiosksRepository } from './kiosks.repository';
import { KioskService } from './kiosk.service';
import { KioskSessionGuard } from './kiosk-session.guard';
import { CredentialRepository } from './credential.repository';
import { WebAuthnService } from './webauthn.service';
import { WebAuthnAuthenticationController, WebAuthnEnrollmentController } from './webauthn.controller';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule, HrModule],
  controllers: [KiosksController, KioskTerminalController, WebAuthnAuthenticationController, WebAuthnEnrollmentController],
  providers: [KiosksRepository, KioskService, KioskSessionGuard, CredentialRepository, WebAuthnService],
  exports: [KiosksRepository, KioskService],
})
export class KioskModule {}
