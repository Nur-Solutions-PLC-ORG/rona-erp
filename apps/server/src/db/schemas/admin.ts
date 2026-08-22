import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
} from '@rona/config/admin';

// ENUMS
export const organizationStatusList = pgEnum(
  'organization_status_list',
  ORGANIZATION_STATUS_LIST,
);
export const currencyList = pgEnum('currency_list', CURRENCY_LIST);
export const employeeStatusList = pgEnum(
  'employee_status_list',
  EMPLOYEE_STATUS_LIST,
);
export const genderList = pgEnum('gender_list', GENDER_LIST);
export const platformConfigTypeList = pgEnum(
  'platform_config_type_list',
  PLATFORM_CONFIG_TYPE_LIST,
);
export const platformConfigKeys = pgEnum(
  'platform_config_keys',
  PLATFORM_CONFIG_KEY_LIST,
);

// TABLES
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull(),
  status: organizationStatusList('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const organizationSettings = pgTable('organization_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
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
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  modules: text('modules').array().notNull().default([]),
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
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
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
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  eid: text('eid').notNull(),
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
