import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from '../admin';
import { users } from '../auth';
import { batchLots } from '../inventory/master-data';
import { qaDecisionList } from './enums';
import { inspections } from './inspections';

export const qaReviews = pgTable(
  'qa_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    inspectionId: uuid('inspection_id').notNull(),
    decision: qaDecisionList('decision').notNull(),
    notes: text('notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('qa_reviews_inspection_unique').on(table.inspectionId),
    foreignKey({
      name: 'qa_reviews_inspection_tenant_fk',
      columns: [table.inspectionId, table.organizationId],
      foreignColumns: [inspections.id, inspections.organizationId],
    }),
    index('qa_reviews_organization_inspection_idx').on(
      table.organizationId,
      table.inspectionId,
    ),
  ],
);

export const releaseDecisions = pgTable(
  'release_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    lotId: uuid('lot_id').notNull(),
    inspectionId: uuid('inspection_id').notNull(),
    decision: qaDecisionList('decision').notNull(),
    decidedBy: uuid('decided_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'release_decisions_lot_tenant_fk',
      columns: [table.lotId, table.organizationId],
      foreignColumns: [batchLots.id, batchLots.organizationId],
    }),
    foreignKey({
      name: 'release_decisions_inspection_tenant_fk',
      columns: [table.inspectionId, table.organizationId],
      foreignColumns: [inspections.id, inspections.organizationId],
    }),
    index('release_decisions_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    index('release_decisions_organization_inspection_idx').on(
      table.organizationId,
      table.inspectionId,
    ),
  ],
);
