import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import {
  AI_REPORT_JOB_RETRY_SECONDS,
  AI_REPORT_JOB_STALE_SECONDS,
  AI_REPORT_RETENTION_HOURS,
  AI_REPORT_WORKER_POLL_SECONDS,
} from '@rona/config/ai';
import type { AiReportType } from '@rona/types/ai';
import type { RonaContextBundle } from '../types/ai-contexts.types.js';
import { DOCUMENT_BUILDERS } from './report-documents.js';
import { render } from './report-renderers.js';
import { REPORT_EXTENSIONS, type ReportDocument } from './report-models.js';
import { AiReportJobsRepository } from './ai-report-jobs.repository.js';
import { AiReportStorageService } from './ai-report-storage.service.js';

@Injectable()
export class AiReportWorker implements OnApplicationShutdown {
  private readonly logger = new Logger(AiReportWorker.name);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private sweeping = false;

  constructor(
    private readonly jobs: AiReportJobsRepository,
    private readonly storage: AiReportStorageService,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.logger.log('AI report worker started');
    void this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  onApplicationShutdown(): void {
    this.stop();
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      const processed = await this.processOne();
      this.maybeSweep(processed);
    } catch (error) {
      this.logger.error(`Report worker cycle failed: ${String(error)}`);
    }

    if (!this.running) return;
    this.timer = setTimeout(
      () => void this.tick(),
      AI_REPORT_WORKER_POLL_SECONDS * 1000,
    );
  }

  private async processOne(): Promise<boolean> {
    const job = await this.jobs.claimNext(AI_REPORT_JOB_STALE_SECONDS);
    if (!job) return false;

    try {
      const bundle = job.payloadJson as RonaContextBundle;
      const document = this.buildDocument(bundle, job.reportType);
      const data = await render(document, job.exportFormat);

      const filename = `${job.id}.${REPORT_EXTENSIONS[job.exportFormat]}`;
      const storageKey = await this.storage.put(filename, data);

      await this.jobs.markReady(job.id, {
        filename,
        storageKey,
        byteSize: data.length,
      });
      this.logger.log(
        `Report job completed reportId=${job.id} bytes=${data.length}`,
      );
    } catch (error) {
      this.logger.error(
        `Report job failed reportId=${job.id}: ${String(error)}`,
      );
      await this.jobs.markFailed(
        job.id,
        String(error),
        AI_REPORT_JOB_RETRY_SECONDS,
      );
    }
    return true;
  }

  private buildDocument(
    bundle: RonaContextBundle,
    reportType: AiReportType,
  ): ReportDocument {
    const builder = DOCUMENT_BUILDERS[reportType];
    const [title, summary, tables] = builder(normalizeBundle(bundle));

    return {
      title,
      tenantLabel: bundle.tenantName ?? bundle.tenantId,
      periodLabel: bundle.period.label,
      generatedAt: toDate(bundle.generatedAt),
      sourceSystem: this.bundleSourceSystem(bundle),
      summary,
      tables,
    };
  }

  private bundleSourceSystem(bundle: RonaContextBundle): string {
    const payloads = [
      bundle.hr,
      bundle.production,
      bundle.inventory,
      bundle.finance,
      bundle.sales,
    ];
    for (const payload of payloads) {
      if (payload) return payload.sourceSystem;
    }
    return 'rona-erp';
  }

  private maybeSweep(processed: boolean): void {
    if (!processed || this.sweeping) return;
    this.sweeping = true;
    void this.sweepExpired().finally(() => {
      this.sweeping = false;
    });
  }

  private async sweepExpired(): Promise<void> {
    const expired = await this.jobs.deleteExpired(AI_REPORT_RETENTION_HOURS);
    for (const job of expired) {
      if (job.storageKey) await this.storage.delete(job.storageKey);
    }
    if (expired.length) {
      this.logger.log(
        `Retention sweep removed ${expired.length} expired report job(s)`,
      );
    }
  }
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function normalizeBundle(bundle: RonaContextBundle): RonaContextBundle {
  if (!bundle.alerts.some((alert) => !(alert.detectedAt instanceof Date))) {
    return bundle;
  }
  return {
    ...bundle,
    alerts: bundle.alerts.map((alert) => ({
      ...alert,
      detectedAt: toDate(alert.detectedAt),
    })),
  };
}
