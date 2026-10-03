import { and, asc, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import {
  customerAddresses,
  customerContacts,
  customers,
} from '@/db/schemas/sales';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  CustomerAddressCreateInput,
  CustomerAddressUpdateInput,
  CustomerContactCreateInput,
  CustomerContactUpdateInput,
  CustomerCreateInput,
  CustomerListParams,
  CustomerUpdateInput,
} from '@rona/types/sales';

@Injectable()
export class CustomerRepository extends TenantScopedRepository {
  async create(data: CustomerCreateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(customers)
      .values({ ...data, organizationId: this.organizationId })
      .returning();

    return row;
  }

  async findById(customerId: string) {
    const [row] = await db
      .select()
      .from(customers)
      .where(this.tenantScope(customers, eq(customers.id, customerId)))
      .limit(1);

    return row;
  }

  async findByNameAndPhone(name: string, phone: string) {
    const [row] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.organizationId, this.organizationId),
          eq(customers.name, name),
          eq(customers.phone, phone),
        ),
      )
      .limit(1);

    return row;
  }

  async update(customerId: string, data: CustomerUpdateInput, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(this.tenantScope(customers, eq(customers.id, customerId)))
      .returning();

    return row;
  }

  async list(params: CustomerListParams) {
    const conditions: SQL[] = [];

    if (params.status) {
      conditions.push(eq(customers.status, params.status));
    }
    if (params.salespersonUserId) {
      conditions.push(
        eq(customers.salespersonUserId, params.salespersonUserId),
      );
    }
    if (params.searchQuery) {
      conditions.push(
        or(
          ilike(customers.name, `%${params.searchQuery}%`),
          ilike(customers.phone, `%${params.searchQuery}%`),
        )!,
      );
    }

    const where = this.tenantScope(customers, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select()
      .from(customers)
      .where(where)
      .orderBy(asc(customers.name))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(customers)
      .where(where);

    return { rows, total: Number(total) };
  }

  async createContact(customerId: string, data: CustomerContactCreateInput) {
    const [row] = await db
      .insert(customerContacts)
      .values({
        ...data,
        organizationId: this.organizationId,
        customerId,
      })
      .returning();

    return row;
  }

  async listContacts(customerId: string) {
    return db
      .select()
      .from(customerContacts)
      .where(
        and(
          eq(customerContacts.organizationId, this.organizationId),
          eq(customerContacts.customerId, customerId),
        ),
      )
      .orderBy(asc(customerContacts.name));
  }

  async updateContact(
    contactId: string,
    data: CustomerContactUpdateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(customerContacts)
      .set(data)
      .where(
        and(
          eq(customerContacts.organizationId, this.organizationId),
          eq(customerContacts.id, contactId),
        ),
      )
      .returning();

    return row;
  }

  async deleteContact(contactId: string) {
    await db
      .delete(customerContacts)
      .where(
        and(
          eq(customerContacts.organizationId, this.organizationId),
          eq(customerContacts.id, contactId),
        ),
      );
  }

  async createAddress(customerId: string, data: CustomerAddressCreateInput) {
    const [row] = await db
      .insert(customerAddresses)
      .values({
        ...data,
        organizationId: this.organizationId,
        customerId,
      })
      .returning();

    return row;
  }

  async listAddresses(customerId: string) {
    return db
      .select()
      .from(customerAddresses)
      .where(
        and(
          eq(customerAddresses.organizationId, this.organizationId),
          eq(customerAddresses.customerId, customerId),
        ),
      )
      .orderBy(
        asc(customerAddresses.isDefault),
        asc(customerAddresses.createdAt),
      );
  }

  async updateAddress(
    addressId: string,
    data: CustomerAddressUpdateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(customerAddresses)
      .set(data)
      .where(
        and(
          eq(customerAddresses.organizationId, this.organizationId),
          eq(customerAddresses.id, addressId),
        ),
      )
      .returning();

    return row;
  }

  async deleteAddress(addressId: string) {
    await db
      .delete(customerAddresses)
      .where(
        and(
          eq(customerAddresses.organizationId, this.organizationId),
          eq(customerAddresses.id, addressId),
        ),
      );
  }
}
