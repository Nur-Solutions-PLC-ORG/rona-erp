import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { Injectable } from '@nestjs/common';
import { db } from '@/db';
import { aiReportJobs } from '@/db/schemas/ai';
import type { AiExportFormat, AiReportType } from '@rona/types/ai';
import type { RonaContextBundle } from '../types/ai-contexts.types.js';

export type AiReportJobRow = typeof aiReportJobs.$inferSelect;

@Injectable()
export class AiReportJobsRepository {
  async create(data: {
    reportId: string;
    organizationId: string;
    requestedBy: string;
    reportType: AiReportType;
    exportFormat: AiExportFormat;
    periodLabel: string;
    payload: RonaContextBundle;
    authorizedDomains: string[];
    maxAttempts: number;
  }): Promise<AiReportJobRow> {
    const [row] = await db
      .insert(aiReportJobs)
      .values({
        id: data.reportId,
        organizationId: data.organizationId,
        requestedBy: data.requestedBy,
        reportType: data.reportType,
        exportFormat: data.exportFormat,
        periodLabel: data.periodLabel,
        payloadJson: data.payload,
        authorizedDomains: data.authorizedDomains,
        maxAttempts: data.maxAttempts,
        status: 'pending',
        nextAttemptAt: new Date(),
      })
      .returning();
    return row;
  }

  async get(
    reportId: string,
    organizationId: string,
  ): Promise<AiReportJobRow | undefined> {
    const [row] = await db
      .select()
      .from(aiReportJobs)
      .where(
        and(
          eq(aiReportJobs.id, reportId),
          eq(aiReportJobs.organizationId, organizationId),
        ),
      )
      .limit(1);
    return row;
  }

  async claimNext(staleSeconds: number): Promise<AiReportJobRow | undefined> {
    const staleBefore = new Date(Date.now() - staleSeconds * 1000);

    const candidates = await db
      .select()
      .from(aiReportJobs)
      .where(
        and(
          eq(aiReportJobs.status, 'pending'),
          lte(aiReportJobs.nextAttemptAt, new Date()),
          sql`${aiReportJobs.attempts} < ${aiReportJobs.maxAttempts}`,
        ),
      )
      .orderBy(asc(aiReportJobs.nextAttemptAt))
      .limit(5);

    for (const candidate of candidates) {
      const [claimed] = await db
        .update(aiReportJobs)
        .set({
          status: 'processing',
          startedAt: new Date(),
          attempts: candidate.attempts + 1,
        })
        .where(
          and(
            eq(aiReportJobs.id, candidate.id),
            eq(aiReportJobs.status, 'pending'),
          ),
        )
        .returning();
      if (claimed) return claimed;
    }

    const staleRows = await db.execute(sql`
      UPDATE ai_report_jobs
      SET status = 'pending', started_at = NULL
      WHERE id = (
        SELECT id FROM ai_report_jobs
        WHERE status = 'processing'
          AND started_at <= ${staleBefore}
          AND attempts < max_attempts
        ORDER BY started_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *;
    `);
    const raw = staleRows.rows.length > 0 ? staleRows.rows[0] : undefined;
    if (!raw) return undefined;
    return {
      id: raw.report_id as string,
      organizationId: raw.organization_id as string,
      requestedBy: raw.requested_by as string,
      reportType: raw.report_type as AiReportType,
      exportFormat: raw.export_format as AiExportFormat,
      periodLabel: raw.period_label as string,
      payloadJson: raw.payload_json,
      authorizedDomains: (raw.authorized_domains as string[]) ?? [],
      status: 'pending',
      attempts: Number(raw.attempts ?? 0),
      maxAttempts: Number(raw.max_attempts ?? 3),
      nextAttemptAt: new Date(String(raw.next_attempt_at)),
      createdAt: new Date(String(raw.created_at)),
      startedAt: null,
      completedAt: null,
      filename: null,
      storageKey: null,
      byteSize: null,
      errorMessage: null,
    };
  }

  async markReady(
    reportId: string,
    data: { filename: string; storageKey: string; byteSize: number },
  ): Promise<void> {
    await db
      .update(aiReportJobs)
      .set({
        status: 'ready',
        completedAt: new Date(),
        filename: data.filename,
        storageKey: data.storageKey,
        byteSize: data.byteSize,
        errorMessage: null,
      })
      .where(eq(aiReportJobs.id, reportId));
  }

  async markFailed(
    reportId: string,
    error: string,
    retrySeconds: number,
  ): Promise<void> {
    const [job] = await db
      .select()
      .from(aiReportJobs)
      .where(eq(aiReportJobs.id, reportId))
      .limit(1);

    const attempts = job?.attempts ?? 1;
    const maxAttempts = job?.maxAttempts ?? 3;
    const exhausted = attempts >= maxAttempts;

    await db
      .update(aiReportJobs)
      .set({
        status: exhausted ? 'failed' : 'pending',
        completedAt: exhausted ? new Date() : null,
        errorMessage: error.slice(0, 500),
        nextAttemptAt: new Date(Date.now() + retrySeconds * 1000),
      })
      .where(eq(aiReportJobs.id, reportId));
  }

  async deleteExpired(retentionHours: number): Promise<AiReportJobRow[]> {
    const cutoff = new Date(Date.now() - retentionHours * 3_600_000);
    return db
      .delete(aiReportJobs)
      .where(
        and(
          sql`${aiReportJobs.status} in ('ready', 'failed')`,
          lte(aiReportJobs.createdAt, cutoff),
        ),
      )
      .returning();
  }
}
