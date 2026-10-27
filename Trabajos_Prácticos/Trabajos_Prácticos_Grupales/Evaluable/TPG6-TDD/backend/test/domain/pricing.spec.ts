import { describe, expect, it } from 'vitest';
import {
  discountPercentFor,
  priceFor,
  subtotalFor,
} from '../../src/domain/pricing';
import { PassType } from '../../src/domain/types';

describe('CA-06 precios de las entradas', () => {
  it('debería costar $10.000 cuando la entrada es REGULAR', () => {
    expect(priceFor(PassType.REGULAR)).toBe(10_000);
  });

  it('debería costar $20.000 cuando la entrada es VIP', () => {
    expect(priceFor(PassType.VIP)).toBe(20_000);
  });
});

describe('CA-12 descuentos por edades', () => {
  it.each([
    { age: 0, percent: 100 },
    { age: 3, percent: 100 },
    { age: 4, percent: 50 },
    { age: 15, percent: 50 },
    { age: 16, percent: 0 },
    { age: 59, percent: 0 },
    { age: 60, percent: 50 },
  ])(
    'debería aplicar un descuento del $percent% cuando el visitante tenga $age años',
    ({ age, percent }) => {
      expect(discountPercentFor(age)).toBe(percent);
    },
  );

  it('debería aplicar también el descuento sobre el precio de la entrada VIP cuando la entrada es VIP', () => {
    const tenYearsOld = 10;

    const subtotal = subtotalFor(PassType.VIP, tenYearsOld);

    expect(subtotal).toBe(10_000);
  });
});
