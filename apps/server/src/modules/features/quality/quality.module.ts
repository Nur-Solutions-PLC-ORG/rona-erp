import { Module } from '@nestjs/common';
import { AuditModule } from '@/modules/audit/audit.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { DecisionsRepository } from './decisions.repository';
import { InspectionsController } from './inspections.controller';
import { InspectionsRepository } from './inspections.repository';
import { InspectionsService } from './inspections.service';
import { QualityReviewsService } from './quality-reviews.service';

@Module({
  imports: [
    AuthModule,
    TenancyModule,
    RbacModule,
    AuditModule,
    InventoryModule,
  ],
  controllers: [InspectionsController],
  providers: [
    InspectionsRepository,
    DecisionsRepository,
    InspectionsService,
    QualityReviewsService,
  ],
  exports: [InspectionsService, QualityReviewsService],
})
export class QualityModule {}
