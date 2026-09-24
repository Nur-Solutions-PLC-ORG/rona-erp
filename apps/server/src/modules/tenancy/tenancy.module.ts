import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyRepository } from './tenancy.repository';
import { TenantContextService } from './tenant-context.service';
import { TenantGuard } from './tenant.guard';
import { TenancyService } from './tenancy.service';
import { TenancyController } from './tenancy.controller';
import { RbacModule } from '@/modules/rbac/rbac.module';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [TenancyController],
  providers: [
    TenancyRepository,
    TenancyService,
    TenantContextService,
    TenantGuard,
  ],
  exports: [
    TenancyRepository,
    TenancyService,
    TenantContextService,
    TenantGuard,
  ],
})
export class TenancyModule {}
