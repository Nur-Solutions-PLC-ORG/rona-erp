import { Module } from '@nestjs/common';
import { UsersModule } from '../features/admin/users/users.module';
import { OrganizationsModule } from '../features/admin/organizations/organizations.module';
import { OrganizationSettingsModule } from '../features/admin/organization-settings/organization-settings.module';
import { BranchesModule } from '../features/admin/branches/branches.module';
import { DepartmentsModule } from '../features/admin/departments/departments.module';
import { EmployeesModule } from '../features/admin/employees/employees.module';

@Module({
  imports: [
    UsersModule,
    OrganizationsModule,
    OrganizationSettingsModule,
    BranchesModule,
    DepartmentsModule,
    EmployeesModule,
  ],
  exports: [],
})
export class AdminModule {}
