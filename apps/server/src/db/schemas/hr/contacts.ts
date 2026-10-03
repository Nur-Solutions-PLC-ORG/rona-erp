import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { organizations, employees } from '../admin';

export const employeeEmergencyContacts = pgTable(
  'employee_emergency_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    employeeId: uuid('employee_id').notNull(),
    name: text('name').notNull(),
    relationship: text('relationship').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique('employee_emergency_contacts_id_organization_unique').on(
      table.id,
      table.organizationId,
    ),
    foreignKey({
      name: 'employee_emergency_contacts_employee_tenant_fk',
      columns: [table.employeeId, table.organizationId],
      foreignColumns: [employees.id, employees.organizationId],
    }),
    index('employee_emergency_contacts_organization_employee_idx').on(
      table.organizationId,
      table.employeeId,
    ),
  ],
);
