import { z } from "zod";
import {
  INSPECTION_TYPE_LIST,
  INSPECTION_STATUS_LIST,
  TEST_RESULT_LIST,
} from "@rona/config/quality";
import { paginationSearchParamsSchema } from "../global/api.js";

export const measuredValueSchema = z
  .string()
  .regex(
    /^\d+(\.\d{1,4})?$/,
    "Measured value must be a positive decimal (max 4 dp)",
  );

export const inspectionCreateSchema = z.object({
  lotId: z.string().min(1, "Lot is required"),
  type: z.enum(INSPECTION_TYPE_LIST),
  inspectionNumber: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
      "Inspection number must start alphanumeric and contain only letters, digits, dot, underscore or hyphen",
    )
    .optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const inspectionListSearchParamsSchema =
  paginationSearchParamsSchema.extend({
    status: z.enum(INSPECTION_STATUS_LIST).optional(),
    type: z.enum(INSPECTION_TYPE_LIST).optional(),
    lotId: z.string().optional(),
    itemId: z.string().optional(),
  });

export const inspectionTestCreateSchema = z.object({
  name: z.string().trim().min(1, "Test name is required").max(200),
  specification: z.string().trim().max(500).optional(),
  method: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const testResultCreateSchema = z.object({
  result: z.enum(TEST_RESULT_LIST),
  measuredValue: measuredValueSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const inspectionCompleteSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});

export const inspectionReviewSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
});
