import { Injectable } from '@nestjs/common';
import type {
  BranchDto,
  BranchListSearchParamsSchema,
  BranchSchema,
  BranchUpdateSchema,
} from '@rona/types/admin';
import { AdminBranchNotFoundException } from './branches.exception';
import { BranchesRepository } from './branches.repository';

@Injectable()
export class BranchesService {
  constructor(private readonly repository: BranchesRepository) {}
  async listBranches(params: BranchListSearchParamsSchema) {
    const { records, total } = await this.repository.findMany(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    return {
      branches: records,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getBranch(id: string): Promise<BranchDto> {
    const branch = await this.repository.findById(id);
    if (!branch) throw new AdminBranchNotFoundException();
    return branch;
  }
  createBranch(data: BranchSchema): Promise<BranchDto> {
    return this.repository.create(data);
  }
  async updateBranch(id: string, data: BranchUpdateSchema): Promise<BranchDto> {
    await this.getBranch(id);
    const branch = await this.repository.update(id, data);
    if (!branch) throw new AdminBranchNotFoundException();
    return branch;
  }
  async deleteBranch(id: string): Promise<void> {
    if (!(await this.repository.delete(id)))
      throw new AdminBranchNotFoundException();
  }
}
