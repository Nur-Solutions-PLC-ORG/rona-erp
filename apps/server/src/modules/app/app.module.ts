import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AppService } from './app.service';
import { AdminModule } from '../admin/admin.module';
import { RouterModule } from '@nestjs/core';
import { UsersModule } from '../features/admin/users/users.module';
import { OrganizationsModule } from '../features/admin/organizations/organizations.module';
import { OrganizationSettingsModule } from '../features/admin/organization-settings/organization-settings.module';
import { BranchesModule } from '../features/admin/branches/branches.module';
import { DepartmentsModule } from '../features/admin/departments/departments.module';
import { EmployeesModule } from '../features/admin/employees/employees.module';
import { PlatformConfigsModule } from '../features/admin/platform-configs/platform-configs.module';
import { DashboardModule } from '../features/admin/dashboard/dashboard.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OrganizationModule } from '../features/organization/organization.module';
import { InventoryModule } from '../features/inventory/inventory.module';
import { ManufacturingModule } from '../features/manufacturing/manufacturing.module';
import { QualityModule } from '../features/quality/quality.module';
import { TraceabilityModule } from '../features/traceability/traceability.module';
import { HrModule } from '../features/hr/hr.module';
import { SalesModule } from '../features/sales/sales.module';
import { FinanceModule } from '../features/finance/finance.module';
import { AiModule } from '../ai/ai.module';
import { KioskModule } from '../features/kiosk/kiosk.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    TenancyModule,
    OrganizationModule,
    InventoryModule,
    ManufacturingModule,
    QualityModule,
    TraceabilityModule,
    HrModule,
    SalesModule,
    FinanceModule,
    AiModule,
    KioskModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'dashboard',
            module: DashboardModule,
          },
          {
            path: 'users',
            module: UsersModule,
          },
          {
            path: 'organizations',
            module: OrganizationsModule,
          },
          { path: 'organization-settings', module: OrganizationSettingsModule },
          { path: 'branches', module: BranchesModule },
          { path: 'departments', module: DepartmentsModule },
          { path: 'employees', module: EmployeesModule },
          { path: 'platform-configs', module: PlatformConfigsModule },
        ],
      },
      {
        path: 'organization',
        module: OrganizationModule,
      },
      {
        path: 'inventory',
        module: InventoryModule,
      },
      {
        path: 'manufacturing',
        module: ManufacturingModule,
      },
      {
        path: 'quality',
        module: QualityModule,
      },
      {
        path: 'traceability',
        module: TraceabilityModule,
      },
      {
        path: 'hr',
        module: HrModule,
      },
    ]),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
