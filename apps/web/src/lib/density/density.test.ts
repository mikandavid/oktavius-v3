import { describe, expect, it } from 'vitest';

import { DEFAULT_DENSITY, isDensity } from './density';

describe('isDensity', () => {
  it('accepts the three known values and rejects anything else', () => {
    expect(isDensity('compact')).toBe(true);
    expect(isDensity('comfortable')).toBe(true);
    expect(isDensity('spacious')).toBe(true);
    expect(isDensity('cozy')).toBe(false);
    expect(isDensity(null)).toBe(false);
  });
});

describe('DEFAULT_DENSITY', () => {
  it('is comfortable', () => {
    expect(DEFAULT_DENSITY).toBe('comfortable');
  });
});
