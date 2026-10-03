import { Module } from '@nestjs/common';
import { CustomerModule } from './customers/customers.module';
import { SalesOrderModule } from './orders/orders.module';
import { CommissionModule } from './commissions/commissions.module';

@Module({
  imports: [CustomerModule, SalesOrderModule, CommissionModule],
  exports: [CustomerModule, SalesOrderModule, CommissionModule],
})
export class SalesModule {}
