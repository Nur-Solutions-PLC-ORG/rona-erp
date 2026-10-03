import {
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
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
import {
  batchLots,
  items,
  warehouseLocations,
  warehouses,
} from '../inventory/master-data';
import { inventoryReservations } from '../inventory/ledger';
import { boms, bomVersions } from './bom';
import { productionBatchStatusList, productionOrderStatusList } from './enums';

export const productionOrders = pgTable(
  'production_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    orderNumber: text('order_number').notNull(),
    bomId: uuid('bom_id').notNull(),
    bomVersionId: uuid('bom_version_id'),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id, { onDelete: 'restrict' })
      .notNull(),
    status: productionOrderStatusList('status').default('DRAFT').notNull(),
    plannedQuantity: numeric('planned_quantity', {
      precision: 18,
      scale: 4,
    }).notNull(),
    expectedYieldPercent: numeric('expected_yield_percent', {
      precision: 18,
      scale: 4,
    }),
    expectedQuantity: numeric('expected_quantity', {
      precision: 18,
      scale: 4,
    }),
    actualQuantity: numeric('actual_quantity', { precision: 18, scale: 4 }),
    actualYieldPercent: numeric('actual_yield_percent', {
      precision: 18,
      scale: 4,
    }),
    materialVariance: jsonb('material_variance').$type<
      Array<{
        componentItemId: string;
        requiredQuantity: string;
        consumedQuantity: string;
        varianceQuantity: string;
      }>
    >(),
    plannedStartDate: timestamp('planned_start_date', { withTimezone: true }),
    plannedEndDate: timestamp('planned_end_date', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    approvedBy: uuid('approved_by').references(() => users.id, {
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
  },
  (table) => [
    unique('production_orders_organization_number_unique').on(
      table.organizationId,
      table.orderNumber,
    ),
    unique('production_orders_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'production_orders_bom_tenant_fk',
      columns: [table.bomId, table.organizationId],
      foreignColumns: [boms.id, boms.organizationId],
    }),
    foreignKey({
      name: 'production_orders_bom_version_tenant_fk',
      columns: [table.bomVersionId, table.organizationId],
      foreignColumns: [bomVersions.id, bomVersions.organizationId],
    }),
    index('production_orders_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('production_orders_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    check(
      'production_orders_planned_quantity_positive_check',
      sql`${table.plannedQuantity} > 0`,
    ),
  ],
);

export const productionOrderMaterials = pgTable(
  'production_order_materials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    productionOrderId: uuid('production_order_id').notNull(),
    componentItemId: uuid('component_item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    quantityPerUnit: numeric('quantity_per_unit', {
      precision: 18,
      scale: 6,
    }).notNull(),
    requiredQuantity: numeric('required_quantity', {
      precision: 18,
      scale: 4,
    }).notNull(),
    reservationId: uuid('reservation_id').references(
      () => inventoryReservations.id,
      { onDelete: 'set null' },
    ),
    consumedQuantity: numeric('consumed_quantity', {
      precision: 18,
      scale: 4,
    })
      .default('0')
      .notNull(),
    returnedQuantity: numeric('returned_quantity', {
      precision: 18,
      scale: 4,
    })
      .default('0')
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
    unique('production_order_materials_order_component_unique').on(
      table.productionOrderId,
      table.componentItemId,
    ),
    foreignKey({
      name: 'production_order_materials_order_tenant_fk',
      columns: [table.productionOrderId, table.organizationId],
      foreignColumns: [productionOrders.id, productionOrders.organizationId],
    }),
    check(
      'production_order_materials_required_positive_check',
      sql`${table.requiredQuantity} > 0`,
    ),
  ],
);

export const productionBatches = pgTable(
  'production_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    productionOrderId: uuid('production_order_id').notNull(),
    batchNumber: text('batch_number').notNull(),
    status: productionBatchStatusList('status')
      .default('IN_PROGRESS')
      .notNull(),
    scrapQuantity: numeric('scrap_quantity', { precision: 18, scale: 4 })
      .default('0')
      .notNull(),
    outputQuantity: numeric('output_quantity', { precision: 18, scale: 4 })
      .default('0')
      .notNull(),
    notes: text('notes'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('production_batches_organization_number_unique').on(
      table.organizationId,
      table.batchNumber,
    ),
    unique('production_batches_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'production_batches_order_tenant_fk',
      columns: [table.productionOrderId, table.organizationId],
      foreignColumns: [productionOrders.id, productionOrders.organizationId],
    }),
    index('production_batches_organization_order_idx').on(
      table.organizationId,
      table.productionOrderId,
    ),
    check(
      'production_batches_quantities_non_negative_check',
      sql`${table.scrapQuantity} >= 0 and ${table.outputQuantity} >= 0`,
    ),
  ],
);

export const materialConsumptions = pgTable(
  'material_consumptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    productionBatchId: uuid('production_batch_id').notNull(),
    orderMaterialId: uuid('order_material_id'),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotId: uuid('lot_id')
      .references(() => batchLots.id, { onDelete: 'restrict' })
      .notNull(),
    locationId: uuid('location_id')
      .references(() => warehouseLocations.id, { onDelete: 'restrict' })
      .notNull(),
    substitutedForItemId: uuid('substituted_for_item_id'),
    movementId: uuid('movement_id'),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    isScrap: boolean('is_scrap').default(false).notNull(),
    notes: text('notes'),
    consumedAt: timestamp('consumed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'material_consumptions_batch_tenant_fk',
      columns: [table.productionBatchId, table.organizationId],
      foreignColumns: [productionBatches.id, productionBatches.organizationId],
    }),
    index('material_consumptions_organization_batch_idx').on(
      table.organizationId,
      table.productionBatchId,
    ),
    index('material_consumptions_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    check(
      'material_consumptions_quantity_positive_check',
      sql`${table.quantity} > 0`,
    ),
  ],
);

export const materialReturns = pgTable(
  'material_returns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    productionBatchId: uuid('production_batch_id').notNull(),
    orderMaterialId: uuid('order_material_id'),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotId: uuid('lot_id')
      .references(() => batchLots.id, { onDelete: 'restrict' })
      .notNull(),
    locationId: uuid('location_id')
      .references(() => warehouseLocations.id, { onDelete: 'restrict' })
      .notNull(),
    movementId: uuid('movement_id'),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    reason: text('reason').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'material_returns_batch_tenant_fk',
      columns: [table.productionBatchId, table.organizationId],
      foreignColumns: [productionBatches.id, productionBatches.organizationId],
    }),
    index('material_returns_organization_batch_idx').on(
      table.organizationId,
      table.productionBatchId,
    ),
    check(
      'material_returns_quantity_positive_check',
      sql`${table.quantity} > 0`,
    ),
  ],
);

export const productionOutputs = pgTable(
  'production_outputs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    productionBatchId: uuid('production_batch_id').notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotId: uuid('lot_id')
      .references(() => batchLots.id, { onDelete: 'restrict' })
      .notNull(),
    locationId: uuid('location_id')
      .references(() => warehouseLocations.id, { onDelete: 'restrict' })
      .notNull(),
    movementId: uuid('movement_id'),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 4 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: 'production_outputs_batch_tenant_fk',
      columns: [table.productionBatchId, table.organizationId],
      foreignColumns: [productionBatches.id, productionBatches.organizationId],
    }),
    index('production_outputs_organization_batch_idx').on(
      table.organizationId,
      table.productionBatchId,
    ),
    index('production_outputs_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    check(
      'production_outputs_quantity_positive_check',
      sql`${table.quantity} > 0`,
    ),
  ],
);
