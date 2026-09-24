import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityRepository } from './traceability.repository';
import { TraceabilityService } from './traceability.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule],
  controllers: [TraceabilityController],
  providers: [TraceabilityRepository, TraceabilityService],
  exports: [TraceabilityService],
})
export class TraceabilityModule {}
