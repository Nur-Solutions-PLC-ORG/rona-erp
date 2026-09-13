import {
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from '../admin';
import { users } from '../auth';
import { batchLots, items } from '../inventory/master-data';
import {
  inspectionStatusList,
  inspectionTypeList,
  testResultList,
} from './enums';

export const inspections = pgTable(
  'inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    inspectionNumber: text('inspection_number').notNull(),
    type: inspectionTypeList('type').notNull(),
    lotId: uuid('lot_id').notNull(),
    itemId: uuid('item_id').notNull(),
    status: inspectionStatusList('status').default('IN_PROGRESS').notNull(),
    performedBy: uuid('performed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    unique('inspections_organization_number_unique').on(
      table.organizationId,
      table.inspectionNumber,
    ),
    unique('inspections_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'inspections_lot_tenant_fk',
      columns: [table.lotId, table.organizationId],
      foreignColumns: [batchLots.id, batchLots.organizationId],
    }),
    foreignKey({
      name: 'inspections_item_tenant_fk',
      columns: [table.itemId, table.organizationId],
      foreignColumns: [items.id, items.organizationId],
    }),
    index('inspections_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('inspections_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    index('inspections_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    check(
      'inspections_completed_at_set_check',
      sql`${table.status} = 'IN_PROGRESS' or ${table.completedAt} is not null`,
    ),
    check(
      'inspections_reviewed_at_set_check',
      sql`${table.status} <> 'REVIEWED' or ${table.reviewedAt} is not null`,
    ),
  ],
);

export const inspectionTests = pgTable(
  'inspection_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    inspectionId: uuid('inspection_id').notNull(),
    name: text('name').notNull(),
    specification: text('specification'),
    method: text('method'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('inspection_tests_inspection_name_unique').on(
      table.inspectionId,
      table.name,
    ),
    unique('inspection_tests_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'inspection_tests_inspection_tenant_fk',
      columns: [table.inspectionId, table.organizationId],
      foreignColumns: [inspections.id, inspections.organizationId],
    }),
    index('inspection_tests_organization_inspection_idx').on(
      table.organizationId,
      table.inspectionId,
    ),
  ],
);

export const testResults = pgTable(
  'test_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    testId: uuid('test_id').notNull(),
    inspectionId: uuid('inspection_id').notNull(),
    result: testResultList('result').notNull(),
    measuredValue: numeric('measured_value', { precision: 18, scale: 4 }),
    notes: text('notes'),
    performedBy: uuid('performed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('test_results_test_unique').on(table.testId),
    foreignKey({
      name: 'test_results_test_tenant_fk',
      columns: [table.testId, table.organizationId],
      foreignColumns: [inspectionTests.id, inspectionTests.organizationId],
    }),
    foreignKey({
      name: 'test_results_inspection_tenant_fk',
      columns: [table.inspectionId, table.organizationId],
      foreignColumns: [inspections.id, inspections.organizationId],
    }),
    index('test_results_organization_inspection_idx').on(
      table.organizationId,
      table.inspectionId,
    ),
    check(
      'test_results_measured_value_check',
      sql`${table.measuredValue} is null or ${table.measuredValue} >= 0`,
    ),
  ],
);
