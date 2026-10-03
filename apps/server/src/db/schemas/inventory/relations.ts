import { relations } from 'drizzle-orm';
import { organizations } from '../admin';
import { users } from '../auth';
import {
  batchLots,
  items,
  unitsOfMeasure,
  warehouseLocations,
  warehouses,
} from './master-data';
import {
  inventoryMovements,
  inventoryReservations,
  stockBalances,
} from './ledger';

export const unitsOfMeasureRelations = relations(
  unitsOfMeasure,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [unitsOfMeasure.organizationId],
      references: [organizations.id],
    }),
    items: many(items),
  }),
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [items.organizationId],
    references: [organizations.id],
  }),
  unitOfMeasure: one(unitsOfMeasure, {
    fields: [items.unitOfMeasureId],
    references: [unitsOfMeasure.id],
  }),
  lots: many(batchLots),
  movements: many(inventoryMovements),
  stockBalances: many(stockBalances),
  reservations: many(inventoryReservations),
}));

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  locations: many(warehouseLocations),
  reservations: many(inventoryReservations),
}));

export const warehouseLocationsRelations = relations(
  warehouseLocations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [warehouseLocations.organizationId],
      references: [organizations.id],
    }),
    warehouse: one(warehouses, {
      fields: [warehouseLocations.warehouseId],
      references: [warehouses.id],
    }),
    movementsFrom: many(inventoryMovements, {
      relationName: 'movement_from_location',
    }),
    movementsTo: many(inventoryMovements, {
      relationName: 'movement_to_location',
    }),
    stockBalances: many(stockBalances),
  }),
);

export const batchLotsRelations = relations(batchLots, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [batchLots.organizationId],
    references: [organizations.id],
  }),
  item: one(items, {
    fields: [batchLots.itemId],
    references: [items.id],
  }),
  movements: many(inventoryMovements),
  stockBalances: many(stockBalances),
}));

export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [inventoryMovements.organizationId],
      references: [organizations.id],
    }),
    item: one(items, {
      fields: [inventoryMovements.itemId],
      references: [items.id],
    }),
    lot: one(batchLots, {
      fields: [inventoryMovements.lotId],
      references: [batchLots.id],
    }),
    fromLocation: one(warehouseLocations, {
      fields: [inventoryMovements.fromLocationId],
      references: [warehouseLocations.id],
      relationName: 'movement_from_location',
    }),
    toLocation: one(warehouseLocations, {
      fields: [inventoryMovements.toLocationId],
      references: [warehouseLocations.id],
      relationName: 'movement_to_location',
    }),
    performedByUser: one(users, {
      fields: [inventoryMovements.performedBy],
      references: [users.id],
    }),
  }),
);

export const stockBalancesRelations = relations(stockBalances, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockBalances.organizationId],
    references: [organizations.id],
  }),
  item: one(items, {
    fields: [stockBalances.itemId],
    references: [items.id],
  }),
  lot: one(batchLots, {
    fields: [stockBalances.lotId],
    references: [batchLots.id],
  }),
  location: one(warehouseLocations, {
    fields: [stockBalances.locationId],
    references: [warehouseLocations.id],
  }),
}));

export const inventoryReservationsRelations = relations(
  inventoryReservations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [inventoryReservations.organizationId],
      references: [organizations.id],
    }),
    item: one(items, {
      fields: [inventoryReservations.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [inventoryReservations.warehouseId],
      references: [warehouses.id],
    }),
    createdByUser: one(users, {
      fields: [inventoryReservations.createdBy],
      references: [users.id],
    }),
  }),
);
