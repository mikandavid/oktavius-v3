import { describe, expect, it } from 'vitest';

import { sanitizeDecimalInput } from './input-sanitize';

describe('sanitizeDecimalInput', () => {
  it('keeps typed decimal separators', () => {
    expect(sanitizeDecimalInput('12,5')).toBe('12.5');
    expect(sanitizeDecimalInput('-12.50')).toBe('-12.50');
  });

  it('normalizes pasted formatted decimal values', () => {
    expect(sanitizeDecimalInput('€ 2,400.75x')).toBe('2400.75');
    expect(sanitizeDecimalInput('€ 2.400,75x')).toBe('2400.75');
  });

  it('removes repeated thousands separators', () => {
    expect(sanitizeDecimalInput('1,234,567')).toBe('1234567');
    expect(sanitizeDecimalInput('1.234.567')).toBe('1234567');
  });
});
