import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { OrganizationController } from './organization.controller';
import { OrganizationRepository } from './organization.repository';
import { OrganizationService } from './organization.service';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule],
  controllers: [OrganizationController],
  providers: [OrganizationRepository, OrganizationService, MembershipsService],
  exports: [OrganizationRepository, OrganizationService, MembershipsService],
})
export class OrganizationModule {}
