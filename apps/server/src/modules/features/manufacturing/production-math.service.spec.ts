import { ProductionMathService } from './production-math.service';

describe('ProductionMathService', () => {
  const math = new ProductionMathService();

  describe('calculateRequiredQuantity', () => {
    it('multiplies quantityPerUnit by plannedQuantity at 4dp', () => {
      expect(math.calculateRequiredQuantity('0.500000', '100')).toBe('50.0000');
      expect(math.calculateRequiredQuantity('0.05', '200')).toBe('10.0000');
    });

    it('rounds half-up to 4 decimals', () => {
      expect(math.calculateRequiredQuantity('0.333333', '3')).toBe('1.0000');
      expect(math.calculateRequiredQuantity('0.123456', '1')).toBe('0.1235');
    });

    it('handles zero planned quantity', () => {
      expect(math.calculateRequiredQuantity('0.5', '0')).toBe('0.0000');
    });
  });

  describe('calculateExpectedQuantity', () => {
    it('applies the yield percentage to the planned quantity', () => {
      expect(math.calculateExpectedQuantity('100', '95')).toBe('95.0000');
      expect(math.calculateExpectedQuantity('250', '80')).toBe('200.0000');
    });
  });

  describe('calculateActualYieldPercent', () => {
    it('divides actual by planned as a percentage', () => {
      expect(math.calculateActualYieldPercent('95', '100')).toBe('95.0000');
      expect(math.calculateActualYieldPercent('48', '60')).toBe('80.0000');
    });

    it('returns zero when the planned quantity is zero', () => {
      expect(math.calculateActualYieldPercent('10', '0')).toBe('0.0000');
    });
  });

  describe('calculateConsumedQuantity', () => {
    it('sums consumption quantities at 4dp', () => {
      expect(math.calculateConsumedQuantity(['10.5', '4.25', '1.25'])).toBe(
        '16.0000',
      );
      expect(math.calculateConsumedQuantity([])).toBe('0.0000');
    });
  });

  describe('calculateVarianceQuantity', () => {
    it('is positive on over-consumption', () => {
      expect(math.calculateVarianceQuantity('55', '50')).toBe('5.0000');
    });

    it('is negative on under-consumption', () => {
      expect(math.calculateVarianceQuantity('48', '50')).toBe('-2.0000');
    });

    it('is zero when consumed equals required', () => {
      expect(math.calculateVarianceQuantity('50', '50')).toBe('0.0000');
    });
  });

  describe('roundPerUnit', () => {
    it('rounds BOM line quantities to the 6dp schema scale', () => {
      expect(math.roundPerUnit('0.1234567')).toBe('0.123457');
      expect(math.roundPerUnit('0.5')).toBe('0.500000');
    });
  });
});
