import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from '../admin';
import { users } from '../auth';
import {
  items,
  warehouses,
  batchLots,
  inventoryReservations,
} from '../inventory';
import {
  customerStatusList,
  salesOrderStatusList,
  paymentTermsList,
  commissionStatusList,
} from './enums';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    vatNumber: text('vat_number'),
    salespersonUserId: uuid('salesperson_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: customerStatusList('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('customers_organization_idx').on(table.organizationId),
    index('customers_organization_name_idx').on(
      table.organizationId,
      table.name,
    ),
    index('customers_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('customers_organization_salesperson_idx').on(
      table.organizationId,
      table.salespersonUserId,
    ),
  ],
);

export const customerContacts = pgTable(
  'customer_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    title: text('title'),
    isPrimary: boolean('is_primary').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('customer_contacts_customer_idx').on(table.customerId),
    index('customer_contacts_organization_customer_idx').on(
      table.organizationId,
      table.customerId,
    ),
  ],
);

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    label: text('label'),
    line1: text('line1').notNull(),
    line2: text('line2'),
    city: text('city'),
    region: text('region'),
    postalCode: text('postal_code'),
    country: text('country'),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('customer_addresses_customer_idx').on(table.customerId),
    index('customer_addresses_organization_customer_idx').on(
      table.organizationId,
      table.customerId,
    ),
  ],
);

export const salesOrders = pgTable(
  'sales_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    orderNumber: text('order_number').notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'restrict' })
      .notNull(),
    customerName: text('customer_name'),
    salespersonUserId: uuid('salesperson_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    warehouseId: uuid('warehouse_id')
      .references(() => warehouses.id, { onDelete: 'restrict' })
      .notNull(),
    status: salesOrderStatusList('status').default('DRAFT').notNull(),
    paymentTerms: paymentTermsList('payment_terms'),
    reservationId: uuid('reservation_id').references(
      () => inventoryReservations.id,
      {
        onDelete: 'set null',
      },
    ),
    orderDate: timestamp('order_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    discountTotal: numeric('discount_total', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    vatTotal: numeric('vat_total', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    total: numeric('total', { precision: 18, scale: 2 }).default('0').notNull(),
    notes: text('notes'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    fulfilledAt: timestamp('fulfilled_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('sales_orders_organization_idx').on(table.organizationId),
    index('sales_orders_organization_customer_idx').on(
      table.organizationId,
      table.customerId,
    ),
    index('sales_orders_organization_warehouse_idx').on(
      table.organizationId,
      table.warehouseId,
    ),
    index('sales_orders_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('sales_orders_order_number_idx').on(table.orderNumber),
  ],
);

export const salesOrderLines = pgTable(
  'sales_order_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    orderId: uuid('order_id')
      .references(() => salesOrders.id, { onDelete: 'cascade' })
      .notNull(),
    itemId: uuid('item_id')
      .references(() => items.id, { onDelete: 'restrict' })
      .notNull(),
    quantity: numeric('quantity', { precision: 18, scale: 4 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 2 }).notNull(),
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 })
      .default('0')
      .notNull(),
    vatPercent: numeric('vat_percent', { precision: 5, scale: 2 })
      .default('15.00')
      .notNull(),
    lineNet: numeric('line_net', { precision: 18, scale: 2 }).notNull(),
    lineVat: numeric('line_vat', { precision: 18, scale: 2 }).notNull(),
    lineTotal: numeric('line_total', { precision: 18, scale: 2 }).notNull(),
    lotId: uuid('lot_id').references(() => batchLots.id, {
      onDelete: 'set null',
    }),
    reservedQuantity: numeric('reserved_quantity', { precision: 18, scale: 4 })
      .default('0')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('sales_order_lines_order_idx').on(table.orderId),
    index('sales_order_lines_organization_item_idx').on(
      table.organizationId,
      table.itemId,
    ),
    index('sales_order_lines_lot_idx').on(table.lotId),
  ],
);

export const commissionRules = pgTable(
  'commission_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    salespersonUserId: uuid('salesperson_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    commissionPercent: numeric('commission_percent', {
      precision: 5,
      scale: 2,
    }).notNull(),
    itemId: uuid('item_id').references(() => items.id, {
      onDelete: 'set null',
    }),
    itemCategory: text('item_category'),
    minimumMarginPercent: numeric('minimum_margin_percent', {
      precision: 5,
      scale: 2,
    }),
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
    index('commission_rules_organization_salesperson_idx').on(
      table.organizationId,
      table.salespersonUserId,
    ),
    index('commission_rules_organization_active_idx').on(
      table.organizationId,
      table.isActive,
    ),
  ],
);

export const commissionRecords = pgTable(
  'commission_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    ruleId: uuid('rule_id')
      .references(() => commissionRules.id, { onDelete: 'restrict' })
      .notNull(),
    salespersonUserId: uuid('salesperson_user_id')
      .references(() => users.id, { onDelete: 'restrict' })
      .notNull(),
    salesOrderId: uuid('sales_order_id').references(() => salesOrders.id, {
      onDelete: 'set null',
    }),
    invoiceId: uuid('invoice_id'),
    status: commissionStatusList('status').default('PENDING').notNull(),
    commissionPercent: numeric('commission_percent', {
      precision: 5,
      scale: 2,
    }).notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('commission_records_organization_salesperson_idx').on(
      table.organizationId,
      table.salespersonUserId,
    ),
    index('commission_records_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('commission_records_sales_order_idx').on(table.salesOrderId),
    index('commission_records_invoice_idx').on(table.invoiceId),
  ],
);
