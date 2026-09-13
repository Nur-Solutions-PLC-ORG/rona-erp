import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { ItemsController } from './items.controller';
import { WarehousesController } from './warehouses.controller';
import { StockController } from './stock.controller';
import { ReservationsController } from './reservations.controller';
import { ItemsRepository } from './items.repository';
import { WarehousesRepository } from './warehouses.repository';
import { StockRepository } from './stock.repository';
import { ReservationsRepository } from './reservations.repository';
import { AllocationService } from './allocation.service';
import { StockLedgerService } from './stock-ledger.service';
import { StockInboundService } from './stock-inbound.service';
import { StockOutboundService } from './stock-outbound.service';
import { StockQueryService } from './stock-query.service';
import { ItemsService } from './items.service';
import { WarehousesService } from './warehouses.service';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule],
  controllers: [
    ItemsController,
    WarehousesController,
    StockController,
    ReservationsController,
  ],
  providers: [
    ItemsRepository,
    WarehousesRepository,
    StockRepository,
    ReservationsRepository,
    AllocationService,
    StockLedgerService,
    StockInboundService,
    StockOutboundService,
    StockQueryService,
    ItemsService,
    WarehousesService,
    ReservationsService,
  ],
  exports: [
    ItemsService,
    WarehousesService,
    StockQueryService,
    ReservationsService,
    StockInboundService,
    StockLedgerService,
    ItemsRepository,
    WarehousesRepository,
    StockRepository,
    ReservationsRepository,
    AllocationService,
  ],
})
export class InventoryModule {}
