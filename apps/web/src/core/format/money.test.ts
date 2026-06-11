import { describe, expect, it } from 'vitest';

import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats EUR money with stable defaults', () => {
    expect(formatMoney(1234.5)).toBe('1.234,50\u00a0€');
  });

  it('supports decimal output and nullish fallbacks', () => {
    expect(formatMoney(12.345, { style: 'decimal', fractionDigits: 1 })).toBe('12,3');
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(Number.NaN, { emptyFallback: 'n/a' })).toBe('n/a');
  });
});
