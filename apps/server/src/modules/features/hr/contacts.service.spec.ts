import {
  EmployeeArchivedException,
  EmergencyContactNotFoundException,
} from './hr.exception';
import {
  ARCHIVED_AT,
  CONTACT,
  CONTACT_ID,
  EMPLOYEE,
  EMPLOYEE_ID,
  auditRecord,
  contactsService,
  defaultMocks,
  mockTx,
  repoCreateContact,
  repoDeleteContact,
  repoFindById,
  repoFindContactById,
  repoUpdateContact,
  runInOrganizationA,
  setupTransactionMock,
} from './employees.spec-harness';

jest.mock('@/logger', () => ({
  logger: { child: jest.fn(() => ({ info: jest.fn() })) },
  childLogger: jest.fn(() => ({ info: jest.fn() })),
  generateRequestId: jest.fn(() => 'test-request-id'),
}));

jest.mock('@/db', () => ({
  db: {},
  pooledDb: { transaction: jest.fn() },
}));

jest.mock('@/redis', () => ({
  redisClient: {
    get: jest.fn(async () => null),
    set: jest.fn(async () => 'OK'),
  },
}));

describe('EmergencyContactsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupTransactionMock();
    defaultMocks();
  });

  it('creates a contact and audits it', async () => {
    const result = await runInOrganizationA(() =>
      contactsService.createContact(EMPLOYEE_ID, {
        name: 'Abebe Bekele',
        relationship: 'Brother',
        phone: '+251911000002',
      }),
    );

    expect(repoCreateContact).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      expect.objectContaining({ name: 'Abebe Bekele' }),
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.contact.create',
        entityType: 'emergency_contact',
        entityId: CONTACT_ID,
        after: {
          employeeId: EMPLOYEE_ID,
          name: 'Abebe Bekele',
          relationship: 'Brother',
        },
      }),
      mockTx,
    );
    expect(result).toEqual(CONTACT);
  });

  it('updates a contact and audits before/after', async () => {
    const result = await runInOrganizationA(() =>
      contactsService.updateContact(EMPLOYEE_ID, CONTACT_ID, {
        phone: '+251911000005',
      }),
    );

    expect(repoUpdateContact).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      CONTACT_ID,
      { phone: '+251911000005' },
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.contact.update',
        entityType: 'emergency_contact',
        entityId: CONTACT_ID,
        before: expect.objectContaining({
          phone: '+251911000002',
        }),
        after: expect.objectContaining({
          phone: '+251911000005',
        }),
      }),
      mockTx,
    );
    expect(result).toEqual(CONTACT);
  });

  it('deletes a contact and audits the removed state', async () => {
    await runInOrganizationA(() =>
      contactsService.deleteContact(EMPLOYEE_ID, CONTACT_ID),
    );

    expect(repoDeleteContact).toHaveBeenCalledWith(
      EMPLOYEE_ID,
      CONTACT_ID,
      mockTx,
    );
    expect(auditRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        action: 'hr.employee.contact.delete',
        entityType: 'emergency_contact',
        entityId: CONTACT_ID,
        before: {
          employeeId: EMPLOYEE_ID,
          name: 'Abebe Bekele',
          relationship: 'Brother',
        },
      }),
      mockTx,
    );
  });

  it('rejects contact writes for an archived employee', async () => {
    repoFindById.mockResolvedValue({
      ...EMPLOYEE,
      archivedAt: ARCHIVED_AT,
    });

    await expect(
      runInOrganizationA(() =>
        contactsService.createContact(EMPLOYEE_ID, {
          name: 'Abebe Bekele',
          relationship: 'Brother',
          phone: '+251911000002',
        }),
      ),
    ).rejects.toBeInstanceOf(EmployeeArchivedException);
    expect(repoCreateContact).not.toHaveBeenCalled();
  });

  it('rejects a contact outside the tenant', async () => {
    repoFindContactById.mockResolvedValue(undefined);

    await expect(
      runInOrganizationA(() =>
        contactsService.updateContact(EMPLOYEE_ID, 'forged-contact', {
          phone: '+251911000005',
        }),
      ),
    ).rejects.toBeInstanceOf(EmergencyContactNotFoundException);
    expect(repoUpdateContact).not.toHaveBeenCalled();
  });
});
