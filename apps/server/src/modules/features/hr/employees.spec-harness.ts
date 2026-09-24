// Shared test

import { runWithRequestContext } from '@/context/request-context';
import { pooledDb } from '@/db';
import type { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';
import { EmergencyContactsService } from './contacts.service';

export const USER_A = '11111111-1111-4111-8111-111111111111';
export const ORG_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MEMBERSHIP_A = '33333333-3333-4333-8333-333333333333';

export const EMPLOYEE_ID = 'employee-1';
export const DEPARTMENT_ID = 'department-1';
export const POSITION_ID = 'position-1';
export const CONTACT_ID = 'contact-1';
export const ARCHIVED_AT = new Date('2026-05-01T00:00:00Z');

export const EMPLOYEE = {
  id: EMPLOYEE_ID,
  organizationId: ORG_A,
  eid: '10001',
  fullName: 'Selam Bekele',
  phone: '+251911000001',
  email: 'selam.bekele@rona.example',
  gender: 'F',
  birthDate: '1995-03-14',
  status: 'ACTIVE',
  departmentId: DEPARTMENT_ID,
  positionId: POSITION_ID,
  userId: null,
  hireDate: '2026-01-05',
  archivedAt: null,
};

export const DEPARTMENT = {
  id: DEPARTMENT_ID,
  organizationId: ORG_A,
  name: 'Production',
  code: 'PROD',
};

export const POSITION = {
  id: POSITION_ID,
  organizationId: ORG_A,
  title: 'Supervisor',
  code: 'SUP',
  archivedAt: null,
};

export const CONTACT = {
  id: CONTACT_ID,
  organizationId: ORG_A,
  employeeId: EMPLOYEE_ID,
  name: 'Abebe Bekele',
  relationship: 'Brother',
  phone: '+251911000002',
};

export const repoCreate = jest.fn();
export const repoFindById = jest.fn();
export const repoFindByEid = jest.fn();
export const repoFindDepartment = jest.fn();
export const repoFindPosition = jest.fn();
export const repoIsActiveOrganizationMember = jest.fn();
export const repoFindEmployeeByUser = jest.fn();
export const repoUpdate = jest.fn();
export const repoArchive = jest.fn();
export const repoRestore = jest.fn();
export const repoList = jest.fn();
export const repoListContacts = jest.fn();
export const repoFindContactById = jest.fn();
export const repoCreateContact = jest.fn();
export const repoUpdateContact = jest.fn();
export const repoDeleteContact = jest.fn();

export const employeesRepository = {
  create: repoCreate,
  findById: repoFindById,
  findByEid: repoFindByEid,
  findDepartment: repoFindDepartment,
  findPosition: repoFindPosition,
  isActiveOrganizationMember: repoIsActiveOrganizationMember,
  findEmployeeByUser: repoFindEmployeeByUser,
  update: repoUpdate,
  archive: repoArchive,
  restore: repoRestore,
  list: repoList,
  listContacts: repoListContacts,
  findContactById: repoFindContactById,
  createContact: repoCreateContact,
  updateContact: repoUpdateContact,
  deleteContact: repoDeleteContact,
} as unknown as EmployeesRepository;

export const auditRecord = jest.fn();
export const auditService = { record: auditRecord } as unknown as AuditService;

export const employeesService = new EmployeesService(
  employeesRepository,
  auditService,
  new TenantContextService(),
);

export const contactsService = new EmergencyContactsService(
  employeesRepository,
  auditService,
  new TenantContextService(),
);

export const mockTx = { sentinel: 'tx' };

export function setupTransactionMock(): void {
  (pooledDb.transaction as unknown as jest.Mock).mockImplementation(
    async (callback: (tx: unknown) => Promise<unknown>) => callback(mockTx),
  );
}

export function defaultMocks(): void {
  repoFindById.mockResolvedValue(EMPLOYEE);
  repoFindByEid.mockResolvedValue(undefined);
  repoFindDepartment.mockResolvedValue(DEPARTMENT);
  repoFindPosition.mockResolvedValue(POSITION);
  repoIsActiveOrganizationMember.mockResolvedValue(true);
  repoFindEmployeeByUser.mockResolvedValue(undefined);
  repoCreate.mockResolvedValue(EMPLOYEE);
  repoUpdate.mockResolvedValue(EMPLOYEE);
  repoArchive.mockResolvedValue({ ...EMPLOYEE, archivedAt: ARCHIVED_AT });
  repoRestore.mockResolvedValue(EMPLOYEE);
  repoList.mockResolvedValue({ rows: [EMPLOYEE], total: 1 });
  repoListContacts.mockResolvedValue([CONTACT]);
  repoFindContactById.mockResolvedValue(CONTACT);
  repoCreateContact.mockResolvedValue(CONTACT);
  repoUpdateContact.mockResolvedValue(CONTACT);
  repoDeleteContact.mockResolvedValue(CONTACT);
  auditRecord.mockResolvedValue(undefined);
}

export async function runInOrganizationA<T>(
  callback: () => Promise<T>,
): Promise<T> {
  return runWithRequestContext(
    {
      requestId: 'req-test',
      userId: USER_A,
      organizationId: ORG_A,
      membershipId: MEMBERSHIP_A,
      roles: ['HR_MANAGER'],
      permissions: [],
    },
    callback,
  );
}
