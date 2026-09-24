import { Injectable } from '@nestjs/common';
import { LotNotFoundException } from '../inventory/inventory.exception';
import { TraceabilityRepository } from './traceability.repository';

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly traceabilityRepository: TraceabilityRepository,
  ) {}

  async getLotDetail(lotId: string) {
    const lot = await this.traceabilityRepository.findLotWithItem(lotId);
    if (!lot) throw new LotNotFoundException();

    const [inspections, releaseDecisions] = await Promise.all([
      this.traceabilityRepository.findLotInspections(lotId),
      this.traceabilityRepository.findLotReleaseDecisions(lotId),
    ]);

    return { lot, inspections, releaseDecisions };
  }

  async getForwardTrace(lotId: string) {
    const lot = await this.traceabilityRepository.findLotWithItem(lotId);
    if (!lot) throw new LotNotFoundException();

    const consumptions =
      await this.traceabilityRepository.findConsumingBatches(lotId);
    const outputs = await this.traceabilityRepository.findBatchOutputs(
      consumptions.map((c) => c.productionBatchId),
    );

    const outputsByBatch = new Map<string, typeof outputs>();
    for (const output of outputs) {
      const list = outputsByBatch.get(output.productionBatchId) ?? [];
      list.push(output);
      outputsByBatch.set(output.productionBatchId, list);
    }

    return {
      lot,
      batches: consumptions.map((consumption) => ({
        productionBatchId: consumption.productionBatchId,
        batchNumber: consumption.batchNumber,
        productionOrderId: consumption.productionOrderId,
        orderNumber: consumption.orderNumber,
        consumedQuantity: consumption.consumedQuantity,
        consumedAt: consumption.consumedAt,
        outputs: outputsByBatch.get(consumption.productionBatchId) ?? [],
      })),
    };
  }

  async getReverseTrace(lotId: string) {
    const lot = await this.traceabilityRepository.findLotWithItem(lotId);
    if (!lot) throw new LotNotFoundException();

    const producedBy =
      await this.traceabilityRepository.findProducingBatch(lotId);
    if (!producedBy) {
      return { lot, producedBy: null };
    }

    const materials = await this.traceabilityRepository.findBatchMaterials(
      producedBy.productionBatchId,
    );

    return {
      lot,
      producedBy: {
        productionBatchId: producedBy.productionBatchId,
        batchNumber: producedBy.batchNumber,
        productionOrderId: producedBy.productionOrderId,
        orderNumber: producedBy.orderNumber,
        outputQuantity: producedBy.outputQuantity,
        completedAt: producedBy.completedAt,
        materials,
      },
    };
  }
}
