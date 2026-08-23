import { Injectable } from '@nestjs/common';
import type {
  DepartmentDto,
  DepartmentListSearchParamsSchema,
  DepartmentSchema,
  DepartmentUpdateSchema,
} from '@rona/types/admin';
import { AdminDepartmentNotFoundException } from './departments.exception';
import { DepartmentsRepository } from './departments.repository';

@Injectable()
export class DepartmentsService {
  constructor(private readonly repository: DepartmentsRepository) {}
  async listDepartments(params: DepartmentListSearchParamsSchema) {
    const { records, total } = await this.repository.findMany(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    return {
      departments: records.map((record) => this.toDto(record)),
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getDepartment(id: string): Promise<DepartmentDto> {
    const department = await this.repository.findById(id);
    if (!department) throw new AdminDepartmentNotFoundException();
    return this.toDto(department);
  }
  async createDepartment(data: DepartmentSchema): Promise<DepartmentDto> {
    const department = await this.repository.create({
      organizationId: data.organizationId,
      name: data.name,
      modules: data.module,
    });
    return this.toDto(department);
  }
  async updateDepartment(
    id: string,
    data: DepartmentUpdateSchema,
  ): Promise<DepartmentDto> {
    await this.getDepartment(id);
    const department = await this.repository.update(id, {
      ...(data.organizationId !== undefined
        ? { organizationId: data.organizationId }
        : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.module !== undefined ? { modules: data.module } : {}),
    });
    if (!department) throw new AdminDepartmentNotFoundException();
    return this.toDto(department);
  }
  async deleteDepartment(id: string): Promise<void> {
    if (!(await this.repository.delete(id)))
      throw new AdminDepartmentNotFoundException();
  }
  private toDto(
    department: Awaited<ReturnType<DepartmentsRepository['findById']>>,
  ): DepartmentDto {
    return {
      id: department!.id,
      organizationId: department!.organizationId,
      name: department!.name,
      module: department!.modules as DepartmentDto['module'],
      createdAt: department!.createdAt,
    };
  }
}
