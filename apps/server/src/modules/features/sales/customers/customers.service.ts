import { Injectable } from '@nestjs/common';
import { CustomerRepository } from './customers.repository';
import { AuditService } from '@/modules/audit/audit.service';
import type {
  CustomerCreateInput,
  CustomerUpdateInput,
  CustomerListParams,
  CustomerContactCreateInput,
  CustomerContactUpdateInput,
  CustomerAddressCreateInput,
  CustomerAddressUpdateInput,
} from '@rona/types/sales';

@Injectable()
export class CustomerService {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly audit: AuditService,
  ) {}

  async create(data: CustomerCreateInput) {
    const customer = await this.repo.create(data);
    await this.audit.record({
      organizationId: customer.organizationId,
      action: 'CUSTOMER_CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      after: customer,
    });
    return customer;
  }

  async findById(id: string) {
    const customer = await this.repo.findById(id);
    if (!customer) return null;
    const [contacts, addresses] = await Promise.all([
      this.repo.listContacts(id),
      this.repo.listAddresses(id),
    ]);
    return { ...customer, contacts, addresses };
  }

  async update(id: string, data: CustomerUpdateInput) {
    const before = await this.repo.findById(id);
    const updated = await this.repo.update(id, data);
    await this.audit.record({
      organizationId: updated.organizationId,
      action: 'CUSTOMER_UPDATE',
      entityType: 'Customer',
      entityId: updated.id,
      before,
      after: updated,
    });
    return updated;
  }

  async list(params: CustomerListParams) {
    return this.repo.list(params);
  }

  async addContact(customerId: string, data: CustomerContactCreateInput) {
    return this.repo.createContact(customerId, data);
  }
  async updateContact(id: string, data: CustomerContactUpdateInput) {
    return this.repo.updateContact(id, data);
  }
  async deleteContact(id: string) {
    return this.repo.deleteContact(id);
  }
  async addAddress(customerId: string, data: CustomerAddressCreateInput) {
    return this.repo.createAddress(customerId, data);
  }
  async updateAddress(id: string, data: CustomerAddressUpdateInput) {
    return this.repo.updateAddress(id, data);
  }
  async deleteAddress(id: string) {
    return this.repo.deleteAddress(id);
  }
}
