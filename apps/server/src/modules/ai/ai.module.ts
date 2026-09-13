import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from '@/modules/auth/auth.module';
import { TenancyModule } from '@/modules/tenancy/tenancy.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { RbacRepository } from '@/modules/rbac/rbac.repository';
import { RbacService } from '@/modules/rbac/rbac.service';
import { db } from '@/db';
import { redisClient } from '@/redis';
import { organizations } from '@/db/schemas/admin';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { AiAlertsService } from './ai-alerts.service.js';
import { AiBundleService } from './ai-bundle.service.js';
import { AiLimitService } from './ai-limit.service.js';
import { AiKnowledgeService } from './knowledge/ai-knowledge.service.js';
import { AiLlmService } from './llm/ai-llm.service.js';
import { AiReportWorker } from './reports/ai-report-worker.js';
import { AiReportJobsRepository } from './reports/ai-report-jobs.repository.js';
import { AiReportStorageService } from './reports/ai-report-storage.service.js';
import {
  AiHrRepository,
  AiInventoryRepository,
  AiProductionRepository,
  AiQualityRepository,
  AiSalesRepository,
  AiTenantRepository,
  AiFinanceRepository,
  AiOrganizationRepository,
  AiBomRepository,
} from './data/index.js';

@Module({
  imports: [AuthModule, TenancyModule, RbacModule],
  controllers: [AiController],
  providers: [
    AiTenantRepository,
    AiHrRepository,
    AiProductionRepository,
    AiInventoryRepository,
    AiQualityRepository,
    AiFinanceRepository,
    AiSalesRepository,
    AiOrganizationRepository,
    AiBomRepository,
    AiAlertsService,
    AiBundleService,
    AiKnowledgeService,
    AiLlmService,
    AiLimitService,
    AiReportJobsRepository,
    AiReportStorageService,
    AiReportWorker,
    AiService,
  ],
  exports: [AiService],
})
export class AiModule implements OnModuleInit {
  constructor(
    private readonly worker: AiReportWorker,
    private readonly rbacRepository: RbacRepository,
    private readonly rbacService: RbacService,
  ) {}

  onModuleInit(): void {
    if (process.env.AI_REPORT_WORKER_MODE !== 'external') {
      this.worker.start();
    }

    void this.syncRbacDefaults().catch(() => undefined);
  }

  private async syncRbacDefaults(): Promise<void> {
    const LOCK_KEY = 'rona:lock:rbac-startup-sync';
    const LOCK_TTL_SECONDS = 300;
    let acquired = false;
    try {
      const result = await redisClient.set(LOCK_KEY, '1', {
        ex: LOCK_TTL_SECONDS,
        nx: true,
      });
      acquired = result === 'OK';
    } catch {
      acquired = true;
    }
    if (!acquired) return;

    try {
      await this.rbacRepository.upsertPermissions();
      const orgRows = await db
        .select({ id: organizations.id })
        .from(organizations);
      for (const org of orgRows) {
        const added = await this.rbacRepository.syncDefaultRolePermissions(
          org.id,
        );
        if (added > 0) {
          await this.rbacService.invalidateOrganization(org.id);
        }
      }
    } catch (error) {
      console.warn(
        `AI module RBAC startup sync skipped: ${String((error as Error).message)}`,
      );
    } finally {
      try {
        await redisClient.del(LOCK_KEY);
      } catch {
      }
    }
  }
}
