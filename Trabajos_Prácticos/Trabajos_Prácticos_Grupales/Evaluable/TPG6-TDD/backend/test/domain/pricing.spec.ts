import { describe, expect, it } from 'vitest';
import {
  discountPercentFor,
  priceFor,
  subtotalFor,
} from '../../src/domain/pricing';
import { PassType } from '../../src/domain/types';

describe('CA-06 pass prices', () => {
  it('should cost 10.000 when the pass is REGULAR', () => {
    expect(priceFor(PassType.REGULAR)).toBe(10_000);
  });

  it('should cost 20.000 when the pass is VIP', () => {
    expect(priceFor(PassType.VIP)).toBe(20_000);
  });
});

describe('CA-12 age discounts', () => {
  it.each([
    { age: 0, percent: 100 },
    { age: 3, percent: 100 },
    { age: 4, percent: 50 },
    { age: 15, percent: 50 },
    { age: 16, percent: 0 },
    { age: 59, percent: 0 },
    { age: 60, percent: 50 },
  ])(
    'should apply $percent% when the visitor is $age years old',
    ({ age, percent }) => {
      expect(discountPercentFor(age)).toBe(percent);
    },
  );

  it('should apply the discount over the VIP price when the pass is VIP', () => {
    const tenYearsOld = 10;

    const subtotal = subtotalFor(PassType.VIP, tenYearsOld);

    expect(subtotal).toBe(10_000);
  });
});
