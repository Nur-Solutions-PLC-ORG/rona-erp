import { relations } from 'drizzle-orm';
import { employees, organizations } from '../admin';
import { kiosks } from './kiosk';
import { employeeFaces } from './face';
import { employeeWebAuthnCredentials } from './webauthn';

export const kiosksRelations = relations(kiosks, ({ one }) => ({
  organization: one(organizations, {
    fields: [kiosks.organizationId],
    references: [organizations.id],
  }),
}));

export const employeeFacesRelations = relations(employeeFaces, ({ one }) => ({
  organization: one(organizations, {
    fields: [employeeFaces.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [employeeFaces.employeeId, employeeFaces.organizationId],
    references: [employees.id, employees.organizationId],
  }),
}));

export const employeeWebAuthnCredentialsRelations = relations(
  employeeWebAuthnCredentials,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [employeeWebAuthnCredentials.organizationId],
      references: [organizations.id],
    }),
    employee: one(employees, {
      fields: [
        employeeWebAuthnCredentials.employeeId,
        employeeWebAuthnCredentials.organizationId,
      ],
      references: [employees.id, employees.organizationId],
    }),
  }),
);
