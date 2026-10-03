import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  unique,
  index,
  foreignKey,
} from 'drizzle-orm/pg-core';
import {
  ORGANIZATION_STATUS_LIST,
  CURRENCY_LIST,
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
  PLATFORM_CONFIG_KEY_LIST,
  PLATFORM_CONFIG_TYPE_LIST,
} from '@rona/config/admin';

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

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  country: text('country').notNull(),
  // Data URL (client-resized upload) or https URL; null shows a fallback icon.
  logoUrl: text('logo_url'),
  status: organizationStatusList('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const organizationSettings = pgTable(
  'organization_settings',
  {
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
  },
  (table) => [
    unique('organization_settings_organization_id_unique').on(
      table.organizationId,
    ),
  ],
);

export const departments = pgTable(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    code: text('code'),
    modules: text('modules').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('departments_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    unique('departments_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    index('departments_organization_idx').on(table.organizationId),
  ],
);

export const positions = pgTable(
  'positions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    code: text('code').notNull(),
    description: text('description'),
    departmentId: uuid('department_id'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('positions_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    unique('positions_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    index('positions_organization_department_idx').on(
      table.organizationId,
      table.departmentId,
    ),
    foreignKey({
      name: 'positions_department_tenant_fk',
      columns: [table.departmentId, table.organizationId],
      foreignColumns: [departments.id, departments.organizationId],
    }),
  ],
);

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

export const employees = pgTable(
  'employees',
  {
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
    departmentId: uuid('department_id'),
    positionId: uuid('position_id'),
    userId: uuid('user_id'),
    passcodeHash: text('passcode_hash'),
    hireDate: date('hire_date'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('employees_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    unique('employees_organization_eid_unique').on(
      table.organizationId,
      table.eid,
    ),
    unique('employees_organization_user_unique').on(
      table.organizationId,
      table.userId,
    ),
    index('employees_organization_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('employees_organization_department_idx').on(
      table.organizationId,
      table.departmentId,
    ),
    foreignKey({
      name: 'employees_department_tenant_fk',
      columns: [table.departmentId, table.organizationId],
      foreignColumns: [departments.id, departments.organizationId],
    }),
    foreignKey({
      name: 'employees_position_tenant_fk',
      columns: [table.positionId, table.organizationId],
      foreignColumns: [positions.id, positions.organizationId],
    }),
  ],
);

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
