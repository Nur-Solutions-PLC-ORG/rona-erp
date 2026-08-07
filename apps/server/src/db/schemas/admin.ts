import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from 'drizzle-orm/pg-core';

// ENUMS - Using values from packages config (will be available after build)
export const companyStatusList = pgEnum('company_status_list', [
  'active',
  'inactive',
  'suspended',
]);
export const currencyList = pgEnum('currency_list', ['ETB', 'USD']);
export const employeeStatusList = pgEnum('employee_status_list', [
  'active',
  'inactive',
  'terminated',
  'on_leave',
]);
export const genderList = pgEnum('gender_list', ['M', 'F']);
export const platformConfigTypeList = pgEnum('platform_config_type_list', [
  'string',
  'number',
  'boolean',
]);
export const platformConfigKeys = pgEnum('platform_config_keys', [
  'maintenance_mode',
  'name',
  'contact_phone',
  'contact_email',
]);

// TABLES
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull(),
  status: companyStatusList('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const companySettings = pgTable('company_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  currency: currencyList('currency').default('ETB').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const departments = pgTable('departments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  module: text('module').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  departmentId: uuid('department_id')
    .references(() => departments.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  eId: text('e_id').notNull(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  gender: genderList('gender').default('M').notNull(),
  birthDate: date('birth_date').notNull(),
  status: employeeStatusList('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const platformConfigs = pgTable('platform_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: platformConfigKeys('key').notNull().unique(),
  value: text('value').notNull(),
  type: platformConfigTypeList('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
