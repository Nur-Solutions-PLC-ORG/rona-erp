import {
  and,
  asc,
  count,
  eq,
  ilike,
  isNull,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db, pooledDb } from '@/db';
import type { Executor } from '@/db/executor';
import { departments, employees, positions } from '@/db/schemas/admin';
import { users } from '@/db/schemas/auth';
import { employeeEmergencyContacts } from '@/db/schemas/hr/contacts';
import { TenantScopedRepository } from '@/modules/tenancy/tenant-scoped.repository';
import type {
  EmergencyContactCreateInput,
  EmergencyContactUpdateInput,
  EmployeeCreateInput,
  EmployeeListParams,
  EmployeeUpdateInput,
} from '@rona/types/hr';

const employeeSelection = {
  id: employees.id,
  organizationId: employees.organizationId,
  eId: employees.eid,
  fullName: employees.fullName,
  phone: employees.phone,
  email: employees.email,
  gender: employees.gender,
  birthDate: employees.birthDate,
  status: employees.status,
  departmentId: employees.departmentId,
  departmentName: departments.name,
  positionId: employees.positionId,
  positionTitle: positions.title,
  userId: employees.userId,
  hireDate: employees.hireDate,
  archivedAt: employees.archivedAt,
  createdAt: employees.createdAt,
  updatedAt: employees.updatedAt,
  hasKioskPasscode: sql<boolean>`${employees.passcodeHash} is not null`,
};

@Injectable()
export class EmployeesRepository extends TenantScopedRepository {
  async create(
    data: Omit<EmployeeCreateInput, 'passcode'> & { passcodeHash?: string },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const { eId, ...rest } = data;
    const [row] = await executor
      .insert(employees)
      .values({ ...rest, eid: eId, organizationId: this.organizationId })
      .returning();
    return row;
  }

  async findById(employeeId: string) {
    const [row] = await db
      .select(employeeSelection)
      .from(employees)
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .leftJoin(positions, eq(positions.id, employees.positionId))
      .where(this.tenantScope(employees, eq(employees.id, employeeId)))
      .limit(1);
    return row;
  }

  async findByIdForUpdate(employeeId: string, tx: Executor) {
    const [row] = await tx
      .select()
      .from(employees)
      .where(this.tenantScope(employees, eq(employees.id, employeeId)))
      .limit(1)
      .for('update');
    return row;
  }

  async findByEid(eid: string) {
    const [row] = await db
      .select()
      .from(employees)
      .where(this.tenantScope(employees, eq(employees.eid, eid)))
      .limit(1);
    return row;
  }

  async findByUserId(userId: string) {
    const [row] = await db
      .select()
      .from(employees)
      .where(
        this.tenantScope(
          employees,
          eq(employees.userId, userId),
          isNull(employees.archivedAt),
        ),
      )
      .limit(1);
    return row;
  }

  async update(
    employeeId: string,
    data: Omit<EmployeeUpdateInput, 'passcode'> & {
      passcodeHash?: string | null;
    },
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employees)
      .set(data)
      .where(this.tenantScope(employees, eq(employees.id, employeeId)))
      .returning();
    return row;
  }

  async archive(employeeId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employees)
      .set({ archivedAt: new Date() })
      .where(this.tenantScope(employees, eq(employees.id, employeeId)))
      .returning();
    return row;
  }

  async restore(employeeId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employees)
      .set({ archivedAt: null })
      .where(this.tenantScope(employees, eq(employees.id, employeeId)))
      .returning();
    return row;
  }

  async list(params: EmployeeListParams) {
    const conditions: SQL[] = [];
    if (params.status) {
      conditions.push(eq(employees.status, params.status));
    }
    if (params.departmentId) {
      conditions.push(eq(employees.departmentId, params.departmentId));
    }
    if (params.positionId) {
      conditions.push(eq(employees.positionId, params.positionId));
    }
    if (!(
      typeof params.includeArchived === 'boolean' && params.includeArchived
    )) {
      conditions.push(isNull(employees.archivedAt));
    }
    if (params.searchQuery) {
      const searchCondition = or(
        ilike(employees.eid, `%${params.searchQuery}%`),
        ilike(employees.fullName, `%${params.searchQuery}%`),
        ilike(employees.phone, `%${params.searchQuery}%`),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const where = this.tenantScope(employees, ...conditions);
    const offset = (params.page - 1) * params.limit;

    const rows = await db
      .select(employeeSelection)
      .from(employees)
      .leftJoin(departments, eq(departments.id, employees.departmentId))
      .leftJoin(positions, eq(positions.id, employees.positionId))
      .where(where)
      .orderBy(asc(employees.eid))
      .limit(params.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(employees)
      .where(where);

    return { rows, total: Number(total) };
  }

  async listContacts(employeeId: string) {
    return db
      .select()
      .from(employeeEmergencyContacts)
      .where(
        this.tenantScope(
          employeeEmergencyContacts,
          eq(employeeEmergencyContacts.employeeId, employeeId),
        ),
      )
      .orderBy(asc(employeeEmergencyContacts.createdAt));
  }

  async findContactById(employeeId: string, contactId: string) {
    const [row] = await db
      .select()
      .from(employeeEmergencyContacts)
      .where(
        this.tenantScope(
          employeeEmergencyContacts,
          eq(employeeEmergencyContacts.id, contactId),
          eq(employeeEmergencyContacts.employeeId, employeeId),
        ),
      )
      .limit(1);
    return row;
  }

  async createContact(
    employeeId: string,
    data: EmergencyContactCreateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .insert(employeeEmergencyContacts)
      .values({
        ...data,
        employeeId,
        organizationId: this.organizationId,
      })
      .returning();
    return row;
  }

  async updateContact(
    employeeId: string,
    contactId: string,
    data: EmergencyContactUpdateInput,
    tx?: Executor,
  ) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .update(employeeEmergencyContacts)
      .set(data)
      .where(
        this.tenantScope(
          employeeEmergencyContacts,
          eq(employeeEmergencyContacts.id, contactId),
          eq(employeeEmergencyContacts.employeeId, employeeId),
        ),
      )
      .returning();
    return row;
  }

  async deleteContact(employeeId: string, contactId: string, tx?: Executor) {
    const executor = tx ?? pooledDb;
    const [row] = await executor
      .delete(employeeEmergencyContacts)
      .where(
        this.tenantScope(
          employeeEmergencyContacts,
          eq(employeeEmergencyContacts.id, contactId),
          eq(employeeEmergencyContacts.employeeId, employeeId),
        ),
      )
      .returning();
    return row;
  }

  async findDepartment(departmentId: string) {
    const [row] = await db
      .select()
      .from(departments)
      .where(this.tenantScope(departments, eq(departments.id, departmentId)))
      .limit(1);
    return row;
  }

  async findPosition(positionId: string) {
    const [row] = await db
      .select()
      .from(positions)
      .where(this.tenantScope(positions, eq(positions.id, positionId)))
      .limit(1);
    return row;
  }

  async countEmployeesInPosition(positionId: string) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(employees)
      .where(
        this.tenantScope(
          employees,
          eq(employees.positionId, positionId),
          isNull(employees.archivedAt),
        ),
      );
    return Number(total);
  }

  async userExists(userId: string) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return Boolean(row);
  }

  async findEmployeeByUser(userId: string) {
    const [row] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.userId, userId),
          eq(employees.organizationId, this.organizationId),
        ),
      )
      .limit(1);
    return row;
  }
}
