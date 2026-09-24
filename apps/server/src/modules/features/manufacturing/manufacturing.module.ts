import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BomsController } from './boms.controller';
import { ProductionOrdersController } from './production-orders.controller';
import { ProductionBatchesController } from './production-batches.controller';
import { BomsRepository } from './boms.repository';
import { ProductionOrdersRepository } from './production-orders.repository';
import { ProductionBatchesRepository } from './production-batches.repository';
import { ProductionMathService } from './production-math.service';
import { BomsService } from './boms.service';
import { ProductionOrdersService } from './production-orders.service';
import { ProductionBatchesService } from './production-batches.service';
import { ProductionMaterialsService } from './production-materials.service';
import { ProductionOutputService } from './production-output.service';

@Module({
  imports: [
    AuthModule,
    TenancyModule,
    RbacModule,
    AuditModule,
    InventoryModule,
  ],
  controllers: [
    BomsController,
    ProductionOrdersController,
    ProductionBatchesController,
  ],
  providers: [
    BomsRepository,
    ProductionOrdersRepository,
    ProductionBatchesRepository,
    ProductionMathService,
    BomsService,
    ProductionOrdersService,
    ProductionBatchesService,
    ProductionMaterialsService,
    ProductionOutputService,
  ],
  exports: [
    BomsService,
    ProductionOrdersService,
    ProductionBatchesService,
    ProductionBatchesRepository,
  ],
})
export class ManufacturingModule {}
