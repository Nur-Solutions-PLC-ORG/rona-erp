import { Injectable } from '@nestjs/common';
import { pooledDb } from '@/db';
import { AuditService } from '@/modules/audit/audit.service';
import { TenantContextService } from '@/modules/tenancy/tenant-context.service';
import type {
  EmergencyContactCreateInput,
  EmergencyContactUpdateInput,
} from '@rona/types/hr';
import {
  EmployeeArchivedException,
  EmployeeNotFoundException,
  EmergencyContactNotFoundException,
} from './hr.exception';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class EmergencyContactsService {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly auditService: AuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async listContacts(employeeId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    return this.employeesRepository.listContacts(employeeId);
  }

  async createContact(employeeId: string, input: EmergencyContactCreateInput) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    return pooledDb.transaction(async (tx) => {
      const created = await this.employeesRepository.createContact(
        employeeId,
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.contact.create',
          entityType: 'emergency_contact',
          entityId: created.id,
          after: {
            employeeId,
            name: created.name,
            relationship: created.relationship,
          },
        },
        tx,
      );
      return created;
    });
  }

  async updateContact(
    employeeId: string,
    contactId: string,
    input: EmergencyContactUpdateInput,
  ) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    const contact = await this.employeesRepository.findContactById(
      employeeId,
      contactId,
    );
    if (!contact) throw new EmergencyContactNotFoundException();

    return pooledDb.transaction(async (tx) => {
      const updated = await this.employeesRepository.updateContact(
        employeeId,
        contactId,
        input,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.contact.update',
          entityType: 'emergency_contact',
          entityId: contactId,
          before: {
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
          },
          after: {
            name: input.name ?? contact.name,
            relationship: input.relationship ?? contact.relationship,
            phone: input.phone ?? contact.phone,
          },
        },
        tx,
      );
      return updated;
    });
  }

  async deleteContact(employeeId: string, contactId: string) {
    const employee = await this.employeesRepository.findById(employeeId);
    if (!employee) throw new EmployeeNotFoundException();
    if (employee.archivedAt) throw new EmployeeArchivedException();

    const contact = await this.employeesRepository.findContactById(
      employeeId,
      contactId,
    );
    if (!contact) throw new EmergencyContactNotFoundException();

    return pooledDb.transaction(async (tx) => {
      const deleted = await this.employeesRepository.deleteContact(
        employeeId,
        contactId,
        tx,
      );
      await this.auditService.record(
        {
          organizationId: this.tenantContext.organizationId,
          action: 'hr.employee.contact.delete',
          entityType: 'emergency_contact',
          entityId: contactId,
          before: {
            employeeId,
            name: contact.name,
            relationship: contact.relationship,
          },
        },
        tx,
      );
      return deleted;
    });
  }
}
