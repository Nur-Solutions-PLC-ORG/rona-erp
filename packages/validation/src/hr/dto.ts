import z from "zod";
import {
  ATTENDANCE_EVENT_TYPE_LIST,
} from "@rona/config/hr";
import {
  EMPLOYEE_STATUS_LIST,
  GENDER_LIST,
} from "@rona/config/admin";

export const departmentDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  modules: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const positionDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  title: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  archivedAt: z.date().nullable(),
});

export const employeeDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  eId: z.string(),
  fullName: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  gender: z.enum(GENDER_LIST),
  birthDate: z.string(),
  status: z.enum(EMPLOYEE_STATUS_LIST),
  departmentId: z.string().nullable(),
  departmentName: z.string().nullable(),
  positionId: z.string().nullable(),
  positionTitle: z.string().nullable(),
  userId: z.string().nullable(),
  hireDate: z.string().nullable(),
  archivedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  hasKioskPasscode: z.boolean().nullable(),
});

export const emergencyContactDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  name: z.string(),
  relationship: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const attendanceEventDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
  eventAt: z.date(),
  recordedBy: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const shiftDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  code: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const employeeShiftDto = z.object({
  id: z.string(),
  assignmentId: z.string(),
  organizationId: z.string(),
  employeeId: z.string(),
  shiftId: z.string(),
  shiftName: z.string(),
  shiftCode: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
