import {
  boolean,
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
import { items } from '../inventory/master-data';
import { bomVersionStatusList } from './enums';

export const boms = pgTable(
  'boms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('boms_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    unique('boms_id_organization_unique').on(table.id, table.organizationId),
    index('boms_organization_item_idx').on(table.organizationId, table.itemId),
  ],
);

export const bomVersions = pgTable(
  'bom_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    bomId: uuid('bom_id').notNull(),
    version: numeric('version', { precision: 10, scale: 0 }).notNull(),
    status: bomVersionStatusList('status').default('DRAFT').notNull(),
    isUsedInProduction: boolean('is_used_in_production')
      .default(false)
      .notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('bom_versions_bom_version_unique').on(table.bomId, table.version),
    unique('bom_versions_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'bom_versions_bom_tenant_fk',
      columns: [table.bomId, table.organizationId],
      foreignColumns: [boms.id, boms.organizationId],
    }),
    index('bom_versions_bom_status_idx').on(table.bomId, table.status),
    index('bom_versions_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
  ],
);

export const bomLines = pgTable(
  'bom_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    bomVersionId: uuid('bom_version_id').notNull(),
    componentItemId: uuid('component_item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    quantityPerUnit: numeric('quantity_per_unit', {
      precision: 18,
      scale: 6,
    }).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('bom_lines_version_component_unique').on(
      table.bomVersionId,
      table.componentItemId,
    ),
    foreignKey({
      name: 'bom_lines_version_tenant_fk',
      columns: [table.bomVersionId, table.organizationId],
      foreignColumns: [bomVersions.id, bomVersions.organizationId],
    }),
    check(
      'bom_lines_quantity_per_unit_positive_check',
      sql`${table.quantityPerUnit} > 0`,
    ),
  ],
);
