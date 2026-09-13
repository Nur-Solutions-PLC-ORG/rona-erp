import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { organizations } from '../admin';
import {
  AI_EXPORT_FORMAT_LIST,
  AI_REPORT_JOB_STATUS_LIST,
  AI_REPORT_TYPE_LIST,
} from '@rona/config/ai';

export const aiReportTypeList = pgEnum(
  'ai_report_type_list',
  AI_REPORT_TYPE_LIST,
);
export const aiExportFormatList = pgEnum(
  'ai_export_format_list',
  AI_EXPORT_FORMAT_LIST,
);
export const aiReportJobStatusList = pgEnum(
  'ai_report_job_status_list',
  AI_REPORT_JOB_STATUS_LIST,
);

export const aiReportJobs = pgTable(
  'ai_report_jobs',
  {
    id: varchar('report_id', { length: 80 }).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    requestedBy: text('requested_by').notNull(),
    reportType: aiReportTypeList('report_type').notNull(),
    exportFormat: aiExportFormatList('export_format').notNull(),
    periodLabel: text('period_label').notNull(),
    payloadJson: jsonb('payload_json').notNull(),
    authorizedDomains: jsonb('authorized_domains')
      .$type<string[]>()
      .notNull()
      .default([]),
    status: aiReportJobStatusList('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    filename: varchar('filename', { length: 180 }),
    storageKey: varchar('storage_key', { length: 300 }),
    byteSize: integer('byte_size'),
    errorMessage: varchar('error_message', { length: 500 }),
  },
  (table) => [
    index('ai_report_jobs_organization_idx').on(table.organizationId),
    index('ai_report_jobs_status_next_attempt_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('ai_report_jobs_organization_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    index('ai_report_jobs_status_created_idx').on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const aiKnowledgeDocuments = pgTable(
  'ai_knowledge_documents',
  {
    id: varchar('doc_id', { length: 100 }).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    domain: varchar('domain', { length: 50 }).notNull(),
    title: varchar('title', { length: 250 }).notNull(),
    content: text('content').notNull(),
    category: varchar('category', { length: 80 }).default('policy').notNull(),
    tags: jsonb('tags').$type<string[]>().default([]).notNull(),
    version: integer('version').default(1).notNull(),
    status: varchar('status', { length: 20 }).default('approved').notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveUntil: timestamp('effective_until', { withTimezone: true }),
    sourceRef: varchar('source_ref', { length: 300 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('ai_knowledge_documents_organization_idx').on(table.organizationId),
    index('ai_knowledge_documents_domain_idx').on(table.domain),
    index('ai_knowledge_documents_status_idx').on(table.status),
  ],
);
