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

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule, HrModule],
  controllers: [KiosksController, KioskTerminalController],
  providers: [KiosksRepository, KioskService, KioskSessionGuard],
  exports: [KiosksRepository, KioskService],
})
export class KioskModule {}
