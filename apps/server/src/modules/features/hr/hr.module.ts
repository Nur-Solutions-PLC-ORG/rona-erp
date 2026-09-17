import { Module } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { EmployeesController } from './employees.controller';
import { DepartmentsController } from './departments.controller';
import { AttendanceController } from './attendance.controller';
import { ShiftsController } from './shifts.controller';
import { EmployeeFacesController } from './employee-faces.controller';
import { EmployeesRepository } from './employees.repository';
import { DepartmentsRepository } from './departments.repository';
import { AttendanceRepository } from './attendance.repository';
import { ShiftsRepository } from './shifts.repository';
import { FaceRepository } from './face.repository';
import { EmployeesService } from './employees.service';
import { EmergencyContactsService } from './contacts.service';
import { DepartmentsService } from './departments.service';
import { AttendanceService } from './attendance.service';
import { ShiftsService } from './shifts.service';
import { FaceService } from './face.service';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule, AuditModule],
  controllers: [
    EmployeesController,
    DepartmentsController,
    AttendanceController,
    ShiftsController,
    EmployeeFacesController,
  ],
  providers: [
    EmployeesRepository,
    DepartmentsRepository,
    AttendanceRepository,
    ShiftsRepository,
    FaceRepository,
    EmployeesService,
    EmergencyContactsService,
    DepartmentsService,
    AttendanceService,
    ShiftsService,
    FaceService,
  ],
  exports: [
    AttendanceService,
    EmployeesRepository,
    AttendanceRepository,
    FaceService,
  ],
})
export class HrModule {}
