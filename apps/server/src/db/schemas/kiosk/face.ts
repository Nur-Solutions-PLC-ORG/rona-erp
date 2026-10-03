import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { employees, organizations } from '../admin';

export const employeeFaces = pgTable(
  'employee_faces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    descriptor: text('descriptor').notNull(),
    enrolledAt: timestamp('enrolled_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    unique('employee_faces_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    index('employee_faces_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
    ),
    foreignKey({
      name: 'employee_faces_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
  ],
);
