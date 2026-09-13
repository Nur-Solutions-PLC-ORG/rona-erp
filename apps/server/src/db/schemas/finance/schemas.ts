import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { organizations } from '../admin';
import { users } from '../auth';
import { customers } from '../sales';
import { invoiceStatusList, paymentMethodList } from './enums';

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    companyId: uuid('company_id')
      .references(() => organizations.id, { onDelete: 'restrict' })
      .notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'restrict' })
      .notNull(),
    customerVatNumber: text('customer_vat_number'),
    issueDate: timestamp('issue_date', { withTimezone: true })
      .defaultNow()
      .notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    subtotal: numeric('subtotal', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    discountTotal: numeric('discount_total', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    vatPercent: numeric('vat_percent', { precision: 5, scale: 2 })
      .default('15.00')
      .notNull(),
    vatTotal: numeric('vat_total', { precision: 18, scale: 2 })
      .default('0')
      .notNull(),
    total: numeric('total', { precision: 18, scale: 2 }).default('0').notNull(),
    paymentTerms: text('payment_terms'),
    status: invoiceStatusList('status').default('DRAFT').notNull(),
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
    index('invoices_organization_idx').on(table.organizationId),
    index('invoices_organization_customer_idx').on(
      table.organizationId,
      table.customerId,
    ),
    index('invoices_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('invoices_organization_issue_date_idx').on(
      table.organizationId,
      table.issueDate,
    ),
  ],
);

export const invoiceLines = pgTable(
  'invoice_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'cascade' })
      .notNull(),
    salesOrderLineId: uuid('sales_order_line_id'),
    description: text('description').notNull(),
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
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('invoice_lines_invoice_idx').on(table.invoiceId),
    index('invoice_lines_sales_order_line_idx').on(table.salesOrderLineId),
  ],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'restrict' })
      .notNull(),
    method: paymentMethodList('method').notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    reference: text('reference'),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
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
    index('payments_organization_idx').on(table.organizationId),
    index('payments_organization_invoice_idx').on(
      table.organizationId,
      table.invoiceId,
    ),
  ],
);

export const paymentAllocations = pgTable(
  'payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    paymentId: uuid('payment_id')
      .references(() => payments.id, { onDelete: 'cascade' })
      .notNull(),
    invoiceId: uuid('invoice_id')
      .references(() => invoices.id, { onDelete: 'restrict' })
      .notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('payment_allocations_payment_idx').on(table.paymentId),
    index('payment_allocations_invoice_idx').on(table.invoiceId),
    index('payment_allocations_organization_payment_idx').on(
      table.organizationId,
      table.paymentId,
    ),
  ],
);

export const costCenters = pgTable(
  'cost_centers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('cost_centers_organization_idx').on(table.organizationId)],
);

export const costTypes = pgTable(
  'cost_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 80 }).notNull(),
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
    index('cost_types_organization_idx').on(table.organizationId),
    uniqueIndex('cost_types_organization_name_idx').on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const costs = pgTable(
  'costs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    costCenterId: uuid('cost_center_id').references(() => costCenters.id, {
      onDelete: 'set null',
    }),
    category: varchar('category', { length: 80 }).notNull(),
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('costs_organization_idx').on(table.organizationId),
    index('costs_organization_category_idx').on(
      table.organizationId,
      table.category,
    ),
    index('costs_organization_date_idx').on(table.organizationId, table.date),
    index('costs_cost_center_idx').on(table.costCenterId),
  ],
);
