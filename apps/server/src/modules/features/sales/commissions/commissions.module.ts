import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { CommissionController } from './commissions.controller';
import { CommissionRepository } from './commissions.repository';
import { CommissionService } from './commissions.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule],
  controllers: [CommissionController],
  providers: [CommissionRepository, CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
