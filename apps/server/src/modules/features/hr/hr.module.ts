import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { EmployeesController } from './employees.controller';
import { DepartmentsController } from './departments.controller';
import { AttendanceController } from './attendance.controller';
import { ShiftsController } from './shifts.controller';
import { EmployeesRepository } from './employees.repository';
import { DepartmentsRepository } from './departments.repository';
import { AttendanceRepository } from './attendance.repository';
import { ShiftsRepository } from './shifts.repository';
import { EmployeesService } from './employees.service';
import { EmergencyContactsService } from './contacts.service';
import { DepartmentsService } from './departments.service';
import { AttendanceService } from './attendance.service';
import { ShiftsService } from './shifts.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule],
  controllers: [
    EmployeesController,
    DepartmentsController,
    AttendanceController,
    ShiftsController,
  ],
  providers: [
    EmployeesRepository,
    DepartmentsRepository,
    AttendanceRepository,
    ShiftsRepository,
    EmployeesService,
    EmergencyContactsService,
    DepartmentsService,
    AttendanceService,
    ShiftsService,
  ],
  exports: [AttendanceService, EmployeesRepository, AttendanceRepository],
})
export class HrModule {}
