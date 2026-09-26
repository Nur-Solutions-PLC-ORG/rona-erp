import z from "zod";
import {
  INSPECTION_STATUS_LIST,
  INSPECTION_TYPE_LIST,
  QA_DECISION_LIST,
  TEST_RESULT_LIST,
} from "@rona/config/quality";

export const inspectionDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  inspectionNumber: z.string(),
  type: z.enum(INSPECTION_TYPE_LIST),
  lotId: z.string(),
  itemId: z.string(),
  status: z.enum(INSPECTION_STATUS_LIST),
  performedBy: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable(),
  reviewedAt: z.date().nullable(),
});

export const inspectionTestDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  inspectionId: z.string(),
  name: z.string(),
  specification: z.string().nullable(),
  method: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const testResultDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  testId: z.string(),
  inspectionId: z.string(),
  result: z.enum(TEST_RESULT_LIST),
  measuredValue: z.string().nullable(),
  notes: z.string().nullable(),
  performedBy: z.string().nullable(),
  createdAt: z.date(),
});

export const qaReviewDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  inspectionId: z.string(),
  decision: z.enum(QA_DECISION_LIST),
  notes: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  createdAt: z.date(),
});

export const releaseDecisionDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  lotId: z.string(),
  inspectionId: z.string(),
  decision: z.enum(QA_DECISION_LIST),
  decidedBy: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});
