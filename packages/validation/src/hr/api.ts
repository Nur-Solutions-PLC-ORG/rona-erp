import { z } from "zod";
import {
  ATTENDANCE_EVENT_TYPE_LIST,
} from "@rona/config/hr";
import {
  EMPLOYEE_STATUS_LIST,
  EID_LENGTH,
  GENDER_LIST,
} from "@rona/config/admin";
import { paginationSearchParamsSchema } from "../global/api.js";

export const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must be in YYYY-MM-DD format",
  );

export const timeOfDaySchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
    "Time must be in HH:mm or HH:mm:ss format",
  );

const booleanQueryParam = z
  .union([z.boolean(), z.literal("true"), z.literal("false")])
  .transform((value) => value === true || value === "true");

export const employeeCreateSchema = z.object({
  eId: z
    .string()
    .regex(
      new RegExp(`^\\d{${EID_LENGTH}}$`),
      `Employee ID must be exactly ${EID_LENGTH} digits`,
    ),
  fullName: z.string().trim().min(1, "Full name is required").max(200),
  phone: z.string().trim().min(7, "Phone must be at least 7 characters").max(20),
  email: z.string().trim().email().max(200).optional(),
  gender: z.enum(GENDER_LIST),
  birthDate: isoDateSchema,
  status: z.enum(EMPLOYEE_STATUS_LIST).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  hireDate: isoDateSchema.optional(),
});

const clearable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullable().optional();

export const employeeUpdateSchema = employeeCreateSchema
  .partial()
  .omit({ eId: true })
  .extend({
    email: clearable(z.string().trim().email().max(200)),
    departmentId: clearable(z.string().uuid()),
    positionId: clearable(z.string().uuid()),
    userId: clearable(z.string().uuid()),
    hireDate: clearable(isoDateSchema),
  });

export const employeeListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(EMPLOYEE_STATUS_LIST).optional(),
    departmentId: z.string().uuid().optional(),
    positionId: z.string().uuid().optional(),
    includeArchived: booleanQueryParam.optional(),
  });

export const emergencyContactCreateSchema = z.object({
  name: z.string().trim().min(1, "Contact name is required").max(200),
  relationship: z.string().trim().min(1, "Relationship is required").max(100),
  phone: z.string().trim().min(7, "Phone must be at least 7 characters").max(20),
  email: z.string().trim().email().max(200).optional(),
});

export const emergencyContactUpdateSchema =
  emergencyContactCreateSchema.partial();

export const attendanceSelfSchema = z.object({
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
  notes: z.string().trim().max(2000).optional(),
});

export const attendanceManageSchema = z.object({
  employeeId: z.string().uuid(),
  eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST),
  eventAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const attendanceListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    employeeId: z.string().uuid().optional(),
    eventType: z.enum(ATTENDANCE_EVENT_TYPE_LIST).optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
  });

export const departmentCreateSchema = z.object({
  name: z.string().trim().min(1, "Department name is required").max(200),
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Code must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    )
    .optional(),
  modules: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export const departmentUpdateSchema = departmentCreateSchema.partial();

export const positionCreateSchema = z.object({
  title: z.string().trim().min(1, "Position title is required").max(200),
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Code must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    ),
  description: z.string().trim().max(2000).optional(),
  departmentId: z.string().uuid().optional(),
});

export const positionUpdateSchema = positionCreateSchema.partial();

export const positionListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    departmentId: z.string().uuid().optional(),
    includeArchived: booleanQueryParam.optional(),
  });

export const shiftCreateSchema = z.object({
  name: z.string().trim().min(1, "Shift name is required").max(200),
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Code must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    ),
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema,
  breakMinutes: z.coerce.number().int().min(0).max(1440).optional(),
});

export const shiftUpdateSchema = shiftCreateSchema.partial();

export const employeeShiftAssignSchema = z
  .object({
    shiftId: z.string().uuid(),
    effectiveFrom: isoDateSchema,
    effectiveTo: isoDateSchema.optional(),
  })
  .refine(
    (data) => !data.effectiveTo || data.effectiveTo >= data.effectiveFrom,
    { message: "effectiveTo must be on or after effectiveFrom" },
  );

export const employeeShiftEndSchema = z.object({
  effectiveTo: isoDateSchema,
});

export const departmentListSearchParamsSchema = paginationSearchParamsSchema;

export const shiftListSearchParamsSchema = paginationSearchParamsSchema;
