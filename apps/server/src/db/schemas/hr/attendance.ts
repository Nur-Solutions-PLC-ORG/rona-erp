import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from '../admin';
import { users } from '../auth';
import { employees } from '../admin';
import { attendanceEventTypeList } from './enums';

export const attendanceEvents = pgTable(
  'attendance_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    eventType: attendanceEventTypeList('event_type').notNull(),
    eventAt: timestamp('event_at', { withTimezone: true }).notNull(),
    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('attendance_events_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'attendance_events_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
    index('attendance_events_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
      table.eventAt,
    ),
    index('attendance_events_organization_type_idx').on(
      table.organizationId,
      table.eventType,
      table.eventAt,
    ),
    check(
      'attendance_events_event_at_not_future_check',
      sql`${table.eventAt} <= now()`,
    ),
  ],
);
