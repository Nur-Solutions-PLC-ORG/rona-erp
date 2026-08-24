import { Injectable } from '@nestjs/common';
import { employees } from '@/db/schemas/admin';
import type {
  EmployeeDto,
  EmployeeListSearchParamsSchema,
  EmployeeSchema,
  EmployeeUpdateSchema,
} from '@rona/types/admin';
import {
  AdminEmployeeIdExistsException,
  AdminEmployeeNotFoundException,
} from './employees.exception';
import { EmployeesRepository } from './employees.repository';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@rona/config';

@Injectable()
export class EmployeesService {
  constructor(private readonly repository: EmployeesRepository) {}
  async listEmployees(params: EmployeeListSearchParamsSchema) {
    const { records, total } = await this.repository.findMany(params);
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_PAGE_SIZE;
    return {
      employees: records.map((record) => this.toDto(record)),
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getEmployee(id: string): Promise<EmployeeDto> {
    const employee = await this.repository.findById(id);
    if (!employee) throw new AdminEmployeeNotFoundException();
    return this.toDto(employee);
  }
  async createEmployee(data: EmployeeSchema): Promise<EmployeeDto> {
    if (await this.repository.findByEid(data.eId))
      throw new AdminEmployeeIdExistsException();
    const employee = await this.repository.create(this.toRecord(data));
    return this.toDto(employee);
  }
  async updateEmployee(
    id: string,
    data: EmployeeUpdateSchema,
  ): Promise<EmployeeDto> {
    await this.getEmployee(id);
    if (data.eId && (await this.repository.findByEid(data.eId, id)))
      throw new AdminEmployeeIdExistsException();
    const employee = await this.repository.update(id, this.toRecord(data));
    if (!employee) throw new AdminEmployeeNotFoundException();
    return this.toDto(employee);
  }
  async deleteEmployee(id: string): Promise<void> {
    if (!(await this.repository.delete(id)))
      throw new AdminEmployeeNotFoundException();
  }
  private toRecord(data: EmployeeSchema): typeof employees.$inferInsert;
  private toRecord(
    data: EmployeeUpdateSchema,
  ): Partial<typeof employees.$inferInsert>;
  private toRecord(
    data: EmployeeSchema | EmployeeUpdateSchema,
  ): Partial<typeof employees.$inferInsert> {
    return {
      ...(data.organizationId !== undefined
        ? { organizationId: data.organizationId }
        : {}),
      ...(data.eId !== undefined ? { eid: data.eId } : {}),
      ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.gender !== undefined ? { gender: data.gender } : {}),
      ...(data.birthDate !== undefined
        ? { birthDate: data.birthDate.toISOString().slice(0, 10) }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    };
  }
  private toDto(
    employee: Awaited<ReturnType<EmployeesRepository['findById']>>,
  ): EmployeeDto {
    return {
      id: employee!.id,
      organizationId: employee!.organizationId,
      eId: employee!.eid,
      fullName: employee!.fullName,
      phone: employee!.phone,
      ...(employee!.email ? { email: employee!.email } : {}),
      gender: employee!.gender,
      birthDate: new Date(`${employee!.birthDate}T00:00:00.000Z`),
      status: employee!.status,
      createdAt: employee!.createdAt,
    };
  }
}
