import { db } from '@/db';
import {
  branches,
  departments,
  employees,
  organizations,
  platformConfigs,
} from '@/db/schemas/admin';
import { userRoles, users } from '@/db/schemas/auth';
import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';

@Injectable()
export class DashboardRepository {
  async getStatus() {
    const [
      organizationTotal,
      organizationActive,
      departmentTotal,
      branchTotal,
      employeeTotal,
      employeeByStatus,
      userTotal,
      userActive,
      userByRole,
      configs,
    ] = await Promise.all([
      db.select({ total: count() }).from(organizations),
      db
        .select({ total: count() })
        .from(organizations)
        .where(eq(organizations.status, 'active')),
      db.select({ total: count() }).from(departments),
      db.select({ total: count() }).from(branches),
      db.select({ total: count() }).from(employees),
      db
        .select({ status: employees.status, total: count() })
        .from(employees)
        .groupBy(employees.status),
      db.select({ total: count() }).from(users),
      db
        .select({ total: count() })
        .from(users)
        .where(eq(users.status, 'active')),
      db
        .select({ role: userRoles.position, total: count() })
        .from(userRoles)
        .groupBy(userRoles.position),
      db.select().from(platformConfigs),
    ]);

    return {
      organizations: {
        total: organizationTotal[0]?.total ?? 0,
        active: organizationActive[0]?.total ?? 0,
      },
      departments: { total: departmentTotal[0]?.total ?? 0 },
      branches: { total: branchTotal[0]?.total ?? 0 },
      employees: {
        total: employeeTotal[0]?.total ?? 0,
        byStatus: Object.fromEntries(
          employeeByStatus.map(({ status, total }) => [status, total]),
        ),
      },
      users: {
        total: userTotal[0]?.total ?? 0,
        active: userActive[0]?.total ?? 0,
        byRole: Object.fromEntries(
          userByRole.map(({ role, total }) => [role, total]),
        ),
      },
      platformConfigs: {
        total: configs.length,
        configs,
      },
    };
  }
}
