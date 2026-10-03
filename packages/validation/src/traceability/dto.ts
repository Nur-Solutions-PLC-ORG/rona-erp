import z from "zod";

export const traceLotDto = z.object({
  id: z.string(),
  organizationId: z.string(),
  lotNumber: z.string(),
  itemId: z.string(),
  itemCode: z.string(),
  itemName: z.string(),
  qualityStatus: z.string(),
  expiryDate: z.date().nullable(),
});

export const lotInspectionSummaryDto = z.object({
  id: z.string(),
  inspectionNumber: z.string(),
  type: z.string(),
  status: z.string(),
  completedAt: z.date().nullable(),
  reviewedAt: z.date().nullable(),
});

export const lotReleaseDecisionDto = z.object({
  id: z.string(),
  inspectionId: z.string(),
  decision: z.string(),
  decidedBy: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
});

export const lotDetailDto = z.object({
  lot: traceLotDto.extend({
    supplier: z.string().nullable(),
    receiptDate: z.date().nullable(),
    manufactureDate: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  inspections: z.array(lotInspectionSummaryDto),
  releaseDecisions: z.array(lotReleaseDecisionDto),
});

export const forwardTraceBatchDto = z.object({
  productionBatchId: z.string(),
  batchNumber: z.string(),
  productionOrderId: z.string(),
  orderNumber: z.string(),
  consumedQuantity: z.string(),
  consumedAt: z.date(),
  outputs: z.array(
    z.object({
      lotId: z.string(),
      lotNumber: z.string(),
      itemId: z.string(),
      itemCode: z.string(),
      itemName: z.string(),
      quantity: z.string(),
      qualityStatus: z.string(),
      outputAt: z.date(),
    }),
  ),
});

export const forwardTraceDto = z.object({
  lot: traceLotDto,
  batches: z.array(forwardTraceBatchDto),
});

export const reverseTraceMaterialDto = z.object({
  lotId: z.string(),
  lotNumber: z.string(),
  itemId: z.string(),
  itemCode: z.string(),
  itemName: z.string(),
  quantity: z.string(),
  isScrap: z.boolean(),
  consumedAt: z.date(),
});

export const reverseTraceDto = z.object({
  lot: traceLotDto,
  producedBy: z
    .object({
      productionBatchId: z.string(),
      batchNumber: z.string(),
      productionOrderId: z.string(),
      orderNumber: z.string(),
      outputQuantity: z.string(),
      completedAt: z.date().nullable(),
      materials: z.array(reverseTraceMaterialDto),
    })
    .nullable(),
});
