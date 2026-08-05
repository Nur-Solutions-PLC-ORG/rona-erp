import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '@/db';
import { users, userRoles } from '@/db/schemas/auth';
import {
  companies,
  companySettings,
  departments,
  branches,
  employees,
  platformConfigs,
} from '@/db/schemas/admin';
import { eq, and, like, desc } from 'drizzle-orm';

@Injectable()
export class AdminService {
  // Users
  async getUsers(query: any) {
    const { page = 1, limit = 10, searchQuery, status, position, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (tenantId) conditions.push(eq(users.tenantId, tenantId));
    if (status) conditions.push(eq(users.status, status));
    if (searchQuery) {
      conditions.push(
        like(users.fullName, `%${searchQuery}%`),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    const totalResult = await db
      .select({ count: users.id })
      .from(users)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createUser(body: any) {
    const result = await db.insert(users).values({
      tenantId: body.tenantId,
      fullName: body.fullName,
      email: body.email,
      passwordHash: body.password,
      status: body.status,
    }).returning();
    
    // Create user role
    await db.insert(userRoles).values({
      userId: result[0].id,
      position: body.role.position,
      module: body.role.modules,
    });
    
    return result[0];
  }

  async getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    if (!result[0]) throw new NotFoundException('User not found');
    return result[0];
  }

  async updateUser(id: string, body: any) {
    const result = await db
      .update(users)
      .set({
        tenantId: body.tenantId,
        fullName: body.fullName,
        email: body.email,
        passwordHash: body.password,
        status: body.status,
      })
      .where(eq(users.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('User not found');
    
    // Update user role
    await db
      .update(userRoles)
      .set({
        position: body.role.position,
        module: body.role.modules,
      })
      .where(eq(userRoles.userId, id));
    
    return result[0];
  }

  async deleteUser(id: string) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (!result[0]) throw new NotFoundException('User not found');
  }

  // Companies
  async getCompanies(query: any) {
    const { page = 1, limit = 10, searchQuery, status } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (status) conditions.push(eq(companies.status, status));
    if (searchQuery) {
      conditions.push(like(companies.name, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(companies)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(companies.createdAt));

    const totalResult = await db
      .select({ count: companies.id })
      .from(companies)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCompany(body: any) {
    const result = await db.insert(companies).values({
      name: body.name,
      slug: body.slug,
      email: body.email,
      phone: body.phone,
      country: body.country,
      status: body.status,
    }).returning();
    return result[0];
  }

  async getCompanyById(id: string) {
    const result = await db.select().from(companies).where(eq(companies.id, id));
    if (!result[0]) throw new NotFoundException('Company not found');
    return result[0];
  }

  async updateCompany(id: string, body: any) {
    const result = await db
      .update(companies)
      .set({
        name: body.name,
        slug: body.slug,
        email: body.email,
        phone: body.phone,
        country: body.country,
        status: body.status,
      })
      .where(eq(companies.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Company not found');
    return result[0];
  }

  async deleteCompany(id: string) {
    const result = await db.delete(companies).where(eq(companies.id, id)).returning();
    if (!result[0]) throw new NotFoundException('Company not found');
  }

  // Company Settings
  async getCompanySettings(query: any) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const data = await db
      .select()
      .from(companySettings)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(companySettings.createdAt));

    const totalResult = await db.select({ count: companySettings.id }).from(companySettings);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createCompanySettings(body: any) {
    const result = await db.insert(companySettings).values({
      tenantId: body.tenantId,
      currency: body.currency,
    }).returning();
    return result[0];
  }

  async getCompanySettingsById(id: string) {
    const result = await db
      .select()
      .from(companySettings)
      .where(eq(companySettings.id, id));
    if (!result[0]) throw new NotFoundException('Company settings not found');
    return result[0];
  }

  async updateCompanySettings(id: string, body: any) {
    const result = await db
      .update(companySettings)
      .set({
        tenantId: body.tenantId,
        currency: body.currency,
      })
      .where(eq(companySettings.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Company settings not found');
    return result[0];
  }

  async deleteCompanySettings(id: string) {
    const result = await db
      .delete(companySettings)
      .where(eq(companySettings.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Company settings not found');
  }

  // Departments
  async getDepartments(query: any) {
    const { page = 1, limit = 10, searchQuery } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (searchQuery) {
      conditions.push(like(departments.name, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(departments)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(departments.createdAt));

    const totalResult = await db
      .select({ count: departments.id })
      .from(departments)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createDepartment(body: any) {
    const result = await db.insert(departments).values({
      tenantId: body.tenantId,
      name: body.name,
      module: body.module,
    }).returning();
    return result[0];
  }

  async getDepartmentById(id: string) {
    const result = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));
    if (!result[0]) throw new NotFoundException('Department not found');
    return result[0];
  }

  async updateDepartment(id: string, body: any) {
    const result = await db
      .update(departments)
      .set({
        tenantId: body.tenantId,
        name: body.name,
        module: body.module,
      })
      .where(eq(departments.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Department not found');
    return result[0];
  }

  async deleteDepartment(id: string) {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Department not found');
  }

  // Branches
  async getBranches(query: any) {
    const { page = 1, limit = 10, searchQuery } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (searchQuery) {
      conditions.push(like(branches.name, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(branches)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(branches.createdAt));

    const totalResult = await db
      .select({ count: branches.id })
      .from(branches)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createBranch(body: any) {
    const result = await db.insert(branches).values({
      tenantId: body.tenantId,
      departmentId: body.departmentId,
      name: body.name,
    }).returning();
    return result[0];
  }

  async getBranchById(id: string) {
    const result = await db.select().from(branches).where(eq(branches.id, id));
    if (!result[0]) throw new NotFoundException('Branch not found');
    return result[0];
  }

  async updateBranch(id: string, body: any) {
    const result = await db
      .update(branches)
      .set({
        tenantId: body.tenantId,
        departmentId: body.departmentId,
        name: body.name,
      })
      .where(eq(branches.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Branch not found');
    return result[0];
  }

  async deleteBranch(id: string) {
    const result = await db.delete(branches).where(eq(branches.id, id)).returning();
    if (!result[0]) throw new NotFoundException('Branch not found');
  }

  // Employees
  async getEmployees(query: any) {
    const { page = 1, limit = 10, searchQuery, status } = query;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (status) conditions.push(eq(employees.status, status));
    if (searchQuery) {
      conditions.push(like(employees.fullName, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(employees)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(employees.createdAt));

    const totalResult = await db
      .select({ count: employees.id })
      .from(employees)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createEmployee(body: any) {
    const result = await db.insert(employees).values({
      tenantId: body.tenantId,
      eId: body.eId,
      fullName: body.fullName,
      phone: body.phone,
      email: body.email,
      gender: body.gender,
      birthDate: body.birthDate,
      status: body.status,
    }).returning();
    return result[0];
  }

  async getEmployeeById(id: string) {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    if (!result[0]) throw new NotFoundException('Employee not found');
    return result[0];
  }

  async updateEmployee(id: string, body: any) {
    const result = await db
      .update(employees)
      .set({
        tenantId: body.tenantId,
        eId: body.eId,
        fullName: body.fullName,
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        birthDate: body.birthDate,
        status: body.status,
      })
      .where(eq(employees.id, id))
      .returning();
    if (!result[0]) throw new NotFoundException('Employee not found');
    return result[0];
  }

  async deleteEmployee(id: string) {
    const result = await db.delete(employees).where(eq(employees.id, id)).returning();
    if (!result[0]) throw new NotFoundException('Employee not found');
  }

  // Platform Configs
  async getPlatformConfigs() {
    const result = await db.select().from(platformConfigs);
    return result;
  }

  async getPlatformConfigByKey(key: string) {
    const result = await db
      .select()
      .from(platformConfigs)
      .where(eq(platformConfigs.key, key as any));
    if (!result[0]) throw new NotFoundException('Platform config not found');
    return result[0];
  }

  async updatePlatformConfig(body: any) {
    const result = await db
      .update(platformConfigs)
      .set({
        value: body.value,
        type: body.type,
      })
      .where(eq(platformConfigs.key, body.key as any))
      .returning();
    if (!result[0]) throw new NotFoundException('Platform config not found');
    return result[0];
  }

  // Role Management
  async getUserRoles(userId: string) {
    const result = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return result;
  }

  async updateUserRole(userId: string, body: any) {
    const result = await db
      .update(userRoles)
      .set({
        position: body.position,
        module: body.module,
      })
      .where(eq(userRoles.userId, userId))
      .returning();
    if (!result[0]) throw new NotFoundException('User role not found');
    return result[0];
  }

  async deleteUserRole(userId: string) {
    const result = await db.delete(userRoles).where(eq(userRoles.userId, userId)).returning();
    if (!result[0]) throw new NotFoundException('User role not found');
  }
}
