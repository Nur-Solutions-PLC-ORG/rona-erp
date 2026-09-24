import {
  check,
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
import { batchLots, items, warehouseLocations } from './master-data';
import { warehouses } from './master-data';
import { movementTypeList, reservationStatusList } from './enums';

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    type: movementTypeList('type').notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotId: uuid('lot_id').references(() => batchLots.id, {
      onDelete: 'restrict',
    }),
    fromLocationId: uuid('from_location_id').references(
      () => warehouseLocations.id,
      { onDelete: 'restrict' },
    ),
    toLocationId: uuid('to_location_id').references(
      () => warehouseLocations.id,
      { onDelete: 'restrict' },
    ),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 18, scale: 4 }),
    reference: text('reference'),
    notes: text('notes'),
    performedBy: uuid('performed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('inventory_movements_organization_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    index('inventory_movements_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    index('inventory_movements_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    index('inventory_movements_organization_location_idx').on(
      table.organizationId,
      table.fromLocationId,
      table.toLocationId,
    ),
    check(
      'inventory_movements_quantity_positive_check',
      sql`${table.quantity} > 0`,
    ),
  ],
);

export const stockBalances = pgTable(
  'stock_balances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    lotId: uuid('lot_id')
      .references(() => batchLots.id, { onDelete: 'restrict' })
      .notNull(),
    locationId: uuid('location_id')
      .references(() => warehouseLocations.id, { onDelete: 'restrict' })
      .notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 4 })
      .default('0')
      .notNull(),
    reservedQuantity: numeric('reserved_quantity', {
      precision: 18,
      scale: 4,
    })
      .default('0')
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('stock_balances_item_lot_location_unique').on(
      table.itemId,
      table.lotId,
      table.locationId,
    ),
    index('stock_balances_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    index('stock_balances_organization_location_idx').on(
      table.organizationId,
      table.locationId,
    ),
    index('stock_balances_organization_lot_idx').on(
      table.organizationId,
      table.lotId,
    ),
    check(
      'stock_balances_quantity_non_negative_check',
      sql`${table.quantity} >= 0`,
    ),
    check(
      'stock_balances_reserved_within_quantity_check',
      sql`${table.reservedQuantity} >= 0 and ${table.reservedQuantity} <= ${table.quantity}`,
    ),
  ],
);

export const inventoryReservations = pgTable(
  'inventory_reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id, { onDelete: 'restrict' })
      .notNull(),
    status: reservationStatusList('status').default('ACTIVE').notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    allocatedLots:
      jsonb('allocated_lots').$type<
        Array<{ lotId: string; locationId: string; quantity: string }>
      >(),
    reference: text('reference'),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => [
    index('inventory_reservations_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('inventory_reservations_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    index('inventory_reservations_organization_warehouse_idx').on(
      table.organizationId,
      table.warehouseId,
    ),
    index('inventory_reservations_reference_idx').on(table.reference),
    check(
      'inventory_reservations_quantity_positive_check',
      sql`${table.quantity} > 0`,
    ),
  ],
);
