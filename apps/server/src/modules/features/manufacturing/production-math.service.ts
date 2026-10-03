import { Injectable } from '@nestjs/common';
import { BOM_QUANTITY_SCALE } from '@rona/config/manufacturing';

function sum(values: string[], scale = 4): string {
  const total = values.reduce((acc, value) => acc + Number(value), 0);
  return total.toFixed(scale);
}

@Injectable()
export class ProductionMathService {
  calculateRequiredQuantity(
    quantityPerUnit: string,
    plannedQuantity: string,
  ): string {
    const required =
      Number(quantityPerUnit) * Number(plannedQuantity) * Math.pow(10, 4);
    return (Math.round(required) / Math.pow(10, 4)).toFixed(4);
  }

  calculateExpectedQuantity(
    plannedQuantity: string,
    yieldPercent: string,
  ): string {
    const expected = (Number(plannedQuantity) * Number(yieldPercent)) / 100;
    return expected.toFixed(4);
  }

  calculateActualYieldPercent(
    actualQuantity: string,
    plannedQuantity: string,
  ): string {
    const planned = Number(plannedQuantity);
    if (planned === 0) return '0.0000';
    return ((Number(actualQuantity) / planned) * 100).toFixed(4);
  }

  calculateConsumedQuantity(consumptionQuantities: string[]): string {
    return sum(consumptionQuantities);
  }

  calculateVarianceQuantity(
    consumedQuantity: string,
    requiredQuantity: string,
  ): string {
    return (Number(consumedQuantity) - Number(requiredQuantity)).toFixed(4);
  }

  roundPerUnit(quantityPerUnit: string): string {
    const factor = Math.pow(10, BOM_QUANTITY_SCALE);
    const rounded = Math.round(Number(quantityPerUnit) * factor) / factor;
    return rounded.toFixed(BOM_QUANTITY_SCALE);
  }
}
