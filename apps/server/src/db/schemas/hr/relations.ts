import { relations } from 'drizzle-orm';
import { organizations } from '../admin';
import { departments, employees, positions } from '../admin';
import { users } from '../auth';
import { attendanceEvents } from './attendance';
import { employeeEmergencyContacts } from './contacts';
import { employeeShifts, shifts } from './shifts';

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [departments.organizationId],
    references: [organizations.id],
  }),
  positions: many(positions),
  employees: many(employees),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [positions.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  position: one(positions, {
    fields: [employees.positionId],
    references: [positions.id],
  }),
  linkedUser: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  emergencyContacts: many(employeeEmergencyContacts),
  attendanceEvents: many(attendanceEvents),
  shiftAssignments: many(employeeShifts),
}));

export const employeeEmergencyContactsRelations = relations(
  employeeEmergencyContacts,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeEmergencyContacts.employeeId],
      references: [employees.id],
    }),
  }),
);

export const attendanceEventsRelations = relations(
  attendanceEvents,
  ({ one }) => ({
    employee: one(employees, {
      fields: [attendanceEvents.employeeId],
      references: [employees.id],
    }),
    recordedByUser: one(users, {
      fields: [attendanceEvents.recordedBy],
      references: [users.id],
    }),
  }),
);

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [shifts.organizationId],
    references: [organizations.id],
  }),
  assignments: many(employeeShifts),
}));

export const employeeShiftsRelations = relations(employeeShifts, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeShifts.employeeId],
    references: [employees.id],
  }),
  shift: one(shifts, {
    fields: [employeeShifts.shiftId],
    references: [shifts.id],
  }),
}));
