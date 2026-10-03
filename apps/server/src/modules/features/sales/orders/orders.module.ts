import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { InventoryModule } from '@/modules/features/inventory/inventory.module';
import { SalesOrderController } from './orders.controller';
import { SalesOrderRepository } from './orders.repository';
import { SalesOrderService } from './orders.service';

@Module({
  imports: [
    AuthModule,
    TenancyModule,
    RbacModule,
    AuditModule,
    InventoryModule,
  ],
  controllers: [SalesOrderController],
  providers: [SalesOrderRepository, SalesOrderService],
  exports: [SalesOrderService, SalesOrderRepository],
})
export class SalesOrderModule {}
