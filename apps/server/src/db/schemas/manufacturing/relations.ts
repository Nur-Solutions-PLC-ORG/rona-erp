import { relations } from 'drizzle-orm';
import { organizations } from '../admin';
import { users } from '../auth';
import {
  batchLots,
  items,
  warehouseLocations,
  warehouses,
} from '../inventory/master-data';
import { inventoryMovements, inventoryReservations } from '../inventory/ledger';
import { boms, bomLines, bomVersions } from './bom';
import {
  materialConsumptions,
  materialReturns,
  productionBatches,
  productionOrderMaterials,
  productionOutputs,
  productionOrders,
} from './production';

export const bomsRelations = relations(boms, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [boms.organizationId],
    references: [organizations.id],
  }),
  item: one(items, {
    fields: [boms.itemId],
    references: [items.id],
  }),
  versions: many(bomVersions),
}));

export const bomVersionsRelations = relations(bomVersions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bomVersions.organizationId],
    references: [organizations.id],
  }),
  bom: one(boms, {
    fields: [bomVersions.bomId],
    references: [boms.id],
  }),
  lines: many(bomLines),
}));

export const bomLinesRelations = relations(bomLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [bomLines.organizationId],
    references: [organizations.id],
  }),
  bomVersion: one(bomVersions, {
    fields: [bomLines.bomVersionId],
    references: [bomVersions.id],
  }),
  componentItem: one(items, {
    fields: [bomLines.componentItemId],
    references: [items.id],
  }),
}));

export const productionOrdersRelations = relations(
  productionOrders,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [productionOrders.organizationId],
      references: [organizations.id],
    }),
    bom: one(boms, {
      fields: [productionOrders.bomId],
      references: [boms.id],
    }),
    bomVersion: one(bomVersions, {
      fields: [productionOrders.bomVersionId],
      references: [bomVersions.id],
    }),
    item: one(items, {
      fields: [productionOrders.itemId],
      references: [items.id],
    }),
    warehouse: one(warehouses, {
      fields: [productionOrders.warehouseId],
      references: [warehouses.id],
    }),
    approvedByUser: one(users, {
      fields: [productionOrders.approvedBy],
      references: [users.id],
    }),
    materials: many(productionOrderMaterials),
    batches: many(productionBatches),
  }),
);

export const productionOrderMaterialsRelations = relations(
  productionOrderMaterials,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [productionOrderMaterials.organizationId],
      references: [organizations.id],
    }),
    productionOrder: one(productionOrders, {
      fields: [productionOrderMaterials.productionOrderId],
      references: [productionOrders.id],
    }),
    componentItem: one(items, {
      fields: [productionOrderMaterials.componentItemId],
      references: [items.id],
    }),
    reservation: one(inventoryReservations, {
      fields: [productionOrderMaterials.reservationId],
      references: [inventoryReservations.id],
    }),
  }),
);

export const productionBatchesRelations = relations(
  productionBatches,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [productionBatches.organizationId],
      references: [organizations.id],
    }),
    productionOrder: one(productionOrders, {
      fields: [productionBatches.productionOrderId],
      references: [productionOrders.id],
    }),
    consumptions: many(materialConsumptions),
    returns: many(materialReturns),
    outputs: many(productionOutputs),
  }),
);

export const materialConsumptionsRelations = relations(
  materialConsumptions,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [materialConsumptions.organizationId],
      references: [organizations.id],
    }),
    productionBatch: one(productionBatches, {
      fields: [materialConsumptions.productionBatchId],
      references: [productionBatches.id],
    }),
    item: one(items, {
      fields: [materialConsumptions.itemId],
      references: [items.id],
    }),
    lot: one(batchLots, {
      fields: [materialConsumptions.lotId],
      references: [batchLots.id],
    }),
    location: one(warehouseLocations, {
      fields: [materialConsumptions.locationId],
      references: [warehouseLocations.id],
    }),
    movement: one(inventoryMovements, {
      fields: [materialConsumptions.movementId],
      references: [inventoryMovements.id],
    }),
  }),
);

export const materialReturnsRelations = relations(
  materialReturns,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [materialReturns.organizationId],
      references: [organizations.id],
    }),
    productionBatch: one(productionBatches, {
      fields: [materialReturns.productionBatchId],
      references: [productionBatches.id],
    }),
    item: one(items, {
      fields: [materialReturns.itemId],
      references: [items.id],
    }),
    lot: one(batchLots, {
      fields: [materialReturns.lotId],
      references: [batchLots.id],
    }),
    location: one(warehouseLocations, {
      fields: [materialReturns.locationId],
      references: [warehouseLocations.id],
    }),
    movement: one(inventoryMovements, {
      fields: [materialReturns.movementId],
      references: [inventoryMovements.id],
    }),
  }),
);

export const productionOutputsRelations = relations(
  productionOutputs,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [productionOutputs.organizationId],
      references: [organizations.id],
    }),
    productionBatch: one(productionBatches, {
      fields: [productionOutputs.productionBatchId],
      references: [productionBatches.id],
    }),
    item: one(items, {
      fields: [productionOutputs.itemId],
      references: [items.id],
    }),
    lot: one(batchLots, {
      fields: [productionOutputs.lotId],
      references: [batchLots.id],
    }),
    location: one(warehouseLocations, {
      fields: [productionOutputs.locationId],
      references: [warehouseLocations.id],
    }),
    movement: one(inventoryMovements, {
      fields: [productionOutputs.movementId],
      references: [inventoryMovements.id],
    }),
  }),
);
