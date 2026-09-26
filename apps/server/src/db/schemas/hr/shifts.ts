import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations, employees } from '../admin';

export const shifts = pgTable(
  'shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    breakMinutes: integer('break_minutes').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('shifts_id_organization_unique').on(table.id, table.organizationId),
    unique('shifts_organization_code_unique').on(
      table.organizationId,
      table.code,
    ),
    check(
      'shifts_break_minutes_check',
      sql`${table.breakMinutes} >= 0 and ${table.breakMinutes} <= 1440`,
    ),
  ],
);

export const employeeShifts = pgTable(
  'employee_shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    shiftId: uuid('shift_id').notNull(),
    effectiveFrom: date('effective_from').notNull(),
    effectiveTo: date('effective_to'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('employee_shifts_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'employee_shifts_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
    foreignKey({
      name: 'employee_shifts_shift_tenant_fk',
      columns: [table.shiftId, table.organizationId],
      foreignColumns: [shifts.id, shifts.organizationId],
    }),
    unique('employee_shifts_organization_employee_from_unique').on(
      table.organizationId,
      table.employeeId,
      table.effectiveFrom,
    ),
    uniqueIndex('employee_shifts_active_unique')
      .on(table.organizationId, table.employeeId)
      .where(sql`${table.effectiveTo} is null`),
    index('employee_shifts_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
    ),
    check(
      'employee_shifts_effective_range_check',
      sql`${table.effectiveTo} is null or ${table.effectiveTo} >= ${table.effectiveFrom}`,
    ),
  ],
);
