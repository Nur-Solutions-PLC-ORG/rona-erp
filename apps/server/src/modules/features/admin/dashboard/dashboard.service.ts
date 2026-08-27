import { Injectable } from '@nestjs/common';
import type { AdminDashboardStatus } from '@rona/types/admin';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  getStatus(): Promise<AdminDashboardStatus> {
    return this.dashboardRepository.getStatus();
  }
}
