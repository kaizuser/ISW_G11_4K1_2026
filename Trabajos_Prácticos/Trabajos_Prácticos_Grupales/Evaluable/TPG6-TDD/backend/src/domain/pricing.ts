import { PassType } from './types';

const PASS_PRICES: Record<PassType, number> = {
  [PassType.REGULAR]: 10_000,
  [PassType.VIP]: 20_000,
};

export function priceFor(passType: PassType): number {
  return PASS_PRICES[passType];
}

export function discountPercentFor(age: number): number {
  if (age <= 3) return 100;
  if (age <= 15) return 50;
  if (age >= 60) return 50;
  return 0;
}

export function subtotalFor(passType: PassType, age: number): number {
  return (priceFor(passType) * (100 - discountPercentFor(age))) / 100;
}
