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

@Module({
  imports: [
    AuthModule,
    AdminModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
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
        ],
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
