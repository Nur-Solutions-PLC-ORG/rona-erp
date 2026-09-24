import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { organizationMemberships } from '@/db/schemas/tenancy';
import { runWithRequestContext } from '@/context/request-context';
import { AuditRepository } from '@/modules/audit/audit.repository';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import { AttendanceRepository } from '@/modules/features/hr/attendance.repository';
import { DepartmentsRepository } from '@/modules/features/hr/departments.repository';
import { EmployeesRepository } from '@/modules/features/hr/employees.repository';
import { ShiftsRepository } from '@/modules/features/hr/shifts.repository';
import { AttendanceService } from '@/modules/features/hr/attendance.service';
import { EmergencyContactsService } from '@/modules/features/hr/contacts.service';
import { DepartmentsService } from '@/modules/features/hr/departments.service';
import { EmployeesService } from '@/modules/features/hr/employees.service';
import { ShiftsService } from '@/modules/features/hr/shifts.service';
import {
  DEMO_DEPARTMENTS,
  DEMO_EMERGENCY_CONTACT,
  DEMO_SHIFTS,
  buildDemoEmployees,
  buildDemoPositions,
} from './seed-hr-data';

async function main() {
  const targetOrgId = process.env.SEED_ORGANIZATION_ID;

  const [membership] = await db
    .select({
      organizationId: organizationMemberships.organizationId,
      userId: organizationMemberships.userId,
      membershipId: organizationMemberships.id,
    })
    .from(organizationMemberships)
    .where(
      targetOrgId
        ? and(
            eq(organizationMemberships.status, 'active'),
            eq(organizationMemberships.organizationId, targetOrgId),
          )
        : eq(organizationMemberships.status, 'active'),
    )
    .limit(1);

  if (!membership) {
    throw new Error(
      targetOrgId
        ? `No active membership found for organization ${targetOrgId}.`
        : 'No active organization membership found. Create an organization with an owner membership first, or set SEED_ORGANIZATION_ID.',
    );
  }

  const tenantContext = new TenantContextService();
  const employeesRepository = new EmployeesRepository(tenantContext);
  const departmentsRepository = new DepartmentsRepository(tenantContext);
  const attendanceRepository = new AttendanceRepository(tenantContext);
  const shiftsRepository = new ShiftsRepository(tenantContext);
  const auditService = new AuditService(new AuditRepository());
  const employeesService = new EmployeesService(
    employeesRepository,
    auditService,
    tenantContext,
  );
  const contactsService = new EmergencyContactsService(
    employeesRepository,
    auditService,
    tenantContext,
  );
  const departmentsService = new DepartmentsService(
    departmentsRepository,
    employeesRepository,
    auditService,
    tenantContext,
  );
  const attendanceService = new AttendanceService(
    attendanceRepository,
    employeesRepository,
    auditService,
    tenantContext,
  );
  const shiftsService = new ShiftsService(
    shiftsRepository,
    employeesRepository,
    auditService,
    tenantContext,
  );

  const summary = await runWithRequestContext(
    {
      requestId: `seed-hr-${Date.now()}`,
      userId: membership.userId,
      organizationId: membership.organizationId,
      membershipId: membership.membershipId,
      roles: [],
      permissions: ['hr.attendance.manage'],
    },
    () =>
      seedHr({
        employeesService,
        contactsService,
        departmentsService,
        attendanceService,
        shiftsService,
        employeesRepository,
        departmentsRepository,
        attendanceRepository,
        shiftsRepository,
        seedingUserId: membership.userId,
      }),
  );

  console.log(
    `HR seed complete for organization ${membership.organizationId}:`,
  );
  for (const line of summary) {
    console.log(`  - ${line}`);
  }
}

async function seedHr(services: {
  employeesService: EmployeesService;
  contactsService: EmergencyContactsService;
  departmentsService: DepartmentsService;
  attendanceService: AttendanceService;
  shiftsService: ShiftsService;
  employeesRepository: EmployeesRepository;
  departmentsRepository: DepartmentsRepository;
  attendanceRepository: AttendanceRepository;
  shiftsRepository: ShiftsRepository;
  seedingUserId: string;
}): Promise<string[]> {
  const {
    employeesService,
    contactsService,
    departmentsService,
    attendanceService,
    shiftsService,
    employeesRepository,
    departmentsRepository,
    attendanceRepository,
    shiftsRepository,
    seedingUserId,
  } = services;
  const summary: string[] = [];

  const departmentIds: Record<string, string> = {};
  for (const demo of DEMO_DEPARTMENTS) {
    let department = await departmentsRepository.findDepartmentByCode(
      demo.code,
    );
    if (!department) {
      department = await departmentsService.createDepartment({
        name: demo.name,
        code: demo.code,
      });
      summary.push(`Department ${demo.code} (${demo.name}) created`);
    } else {
      summary.push(`Department ${demo.code} reused`);
    }
    departmentIds[demo.code] = department.id;
  }

  const positionIds: Record<string, string> = {};
  for (const demo of buildDemoPositions(departmentIds)) {
    let position = await departmentsRepository.findPositionByCode(demo.code);
    if (!position) {
      position = await departmentsService.createPosition({
        title: demo.title,
        code: demo.code,
        description: demo.description,
        departmentId: demo.departmentId,
      });
      summary.push(`Position ${demo.code} (${demo.title}) created`);
    } else {
      summary.push(`Position ${demo.code} reused`);
    }
    positionIds[demo.code] = position.id;
  }

  const employeeIds: Record<string, string> = {};
  for (const demo of buildDemoEmployees(
    departmentIds,
    positionIds,
    seedingUserId,
  )) {
    const existing = await employeesRepository.findByEid(demo.eId);
    if (!existing) {
      const created = await employeesService.createEmployee(demo);
      employeeIds[demo.eId] = created.id;
      summary.push(
        `Employee ${demo.eId} (${demo.fullName}) created${demo.userId ? ' (linked to seeding user)' : ''}`,
      );
    } else {
      employeeIds[demo.eId] = existing.id;
      summary.push(`Employee ${demo.eId} reused`);
    }
  }

  const linkedEmployeeId = employeeIds['10001'];
  const contacts = await employeesRepository.listContacts(linkedEmployeeId);
  if (contacts.length === 0) {
    await contactsService.createContact(
      linkedEmployeeId,
      DEMO_EMERGENCY_CONTACT,
    );
    summary.push('Emergency contact for employee 10001 created');
  } else {
    summary.push('Emergency contact for employee 10001 reused');
  }

  const shiftIds: Record<string, string> = {};
  for (const demo of DEMO_SHIFTS) {
    let shift = await shiftsRepository.findShiftByCode(demo.code);
    if (!shift) {
      shift = await shiftsService.createShift({ ...demo });
      summary.push(`Shift ${demo.code} (${demo.name}) created`);
    } else {
      summary.push(`Shift ${demo.code} reused`);
    }
    shiftIds[demo.code] = shift.id;
  }

  const assignments =
    await shiftsRepository.listAssignmentsForEmployee(linkedEmployeeId);
  if (assignments.length === 0) {
    await shiftsService.assignShift(linkedEmployeeId, {
      shiftId: shiftIds['MORNING'],
      effectiveFrom: '2026-01-01',
    });
    summary.push('Employee 10001 assigned to MORNING shift from 2026-01-01');
  } else {
    summary.push('Employee 10001 shift assignment reused');
  }

  const bakerEmployeeId = employeeIds['10002'];
  const events =
    await attendanceRepository.listEventsForEmployee(bakerEmployeeId);
  if (events.length === 0) {
    const day = new Date();
    day.setUTCDate(day.getUTCDate() - 1);
    const at = (hours: number, minutes: number) => {
      const d = new Date(day);
      d.setUTCHours(hours, minutes, 0, 0);
      return d;
    };
    await attendanceService.punchManaged({
      employeeId: bakerEmployeeId,
      eventType: 'CLOCK_IN',
      eventAt: at(5, 45),
      notes: 'Demo seed attendance',
    });
    await attendanceService.punchManaged({
      employeeId: bakerEmployeeId,
      eventType: 'BREAK_START',
      eventAt: at(10, 0),
    });
    await attendanceService.punchManaged({
      employeeId: bakerEmployeeId,
      eventType: 'BREAK_END',
      eventAt: at(10, 30),
    });
    await attendanceService.punchManaged({
      employeeId: bakerEmployeeId,
      eventType: 'CLOCK_OUT',
      eventAt: at(14, 15),
    });
    summary.push(
      'Attendance cycle for employee 10002 seeded (CLOCK_IN/BREAK_START/BREAK_END/CLOCK_OUT)',
    );
  } else {
    summary.push('Attendance for employee 10002 already present');
  }

  return summary;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
