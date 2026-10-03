import {
  boolean,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations } from '../admin';
import { itemTypeList, qualityStatusList } from './enums';

export const unitsOfMeasure = pgTable(
  'units_of_measure',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('units_of_measure_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
  ],
);

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    type: itemTypeList('type').notNull(),
    unitOfMeasureId: uuid('unit_of_measure_id')
      .references(() => unitsOfMeasure.id, { onDelete: 'restrict' })
      .notNull(),
    reorderPoint: numeric('reorder_point', { precision: 18, scale: 4 }),
    reorderQuantity: numeric('reorder_quantity', { precision: 18, scale: 4 }),
    barcode: text('barcode'),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('items_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    unique('items_id_organization_unique').on(table.id, table.organizationId),
    index('items_organization_type_idx').on(table.organizationId, table.type),
    index('items_organization_archived_idx').on(
      table.organizationId,
      table.isArchived,
    ),
  ],
);

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    address: text('address'),
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
    unique('warehouses_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    unique('warehouses_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    index('warehouses_organization_active_idx').on(
      table.organizationId,
      table.isActive,
    ),
  ],
);

export const warehouseLocations = pgTable(
  'warehouse_locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    warehouseId: uuid('warehouse_id').notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
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
    unique('warehouse_locations_warehouse_code_unique').on(
      table.warehouseId,
      table.code,
    ),
    index('warehouse_locations_organization_idx').on(table.organizationId),
    foreignKey({
      name: 'warehouse_locations_warehouse_tenant_fk',
      columns: [table.warehouseId, table.organizationId],
      foreignColumns: [warehouses.id, warehouses.organizationId],
    }),
  ],
);

export const batchLots = pgTable(
  'batch_lots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotNumber: text('lot_number').notNull(),
    supplier: text('supplier'),
    receiptDate: timestamp('receipt_date', { withTimezone: true }),
    manufactureDate: timestamp('manufacture_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    qualityStatus: qualityStatusList('quality_status')
      .default('QUARANTINED')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('batch_lots_item_lot_unique').on(
      table.organizationId,
      table.itemId,
      table.lotNumber,
    ),
    unique('batch_lots_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    index('batch_lots_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    index('batch_lots_organization_quality_idx').on(
      table.organizationId,
      table.qualityStatus,
    ),
    index('batch_lots_organization_expiry_idx').on(
      table.organizationId,
      table.expiryDate,
    ),
  ],
);
