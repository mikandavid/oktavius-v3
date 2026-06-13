import { afterEach, describe, expect, it } from 'vitest';

import {
  applyDensityToDom,
  clearDensityFromDom,
  DEFAULT_DENSITY,
  DENSITY_STORAGE_KEY,
  isDensity,
  readStoredDensity,
} from './density';

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-density');
});

describe('isDensity', () => {
  it('accepts the three known values and rejects anything else', () => {
    expect(isDensity('compact')).toBe(true);
    expect(isDensity('comfortable')).toBe(true);
    expect(isDensity('spacious')).toBe(true);
    expect(isDensity('cozy')).toBe(false);
    expect(isDensity(null)).toBe(false);
  });
});

describe('readStoredDensity', () => {
  it('returns null when nothing valid is stored', () => {
    expect(readStoredDensity(window.localStorage)).toBeNull();
    window.localStorage.setItem(DENSITY_STORAGE_KEY, 'cozy');
    expect(readStoredDensity(window.localStorage)).toBeNull();
  });

  it('returns the stored density when valid', () => {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, 'compact');
    expect(readStoredDensity(window.localStorage)).toBe('compact');
  });
});

describe('applyDensityToDom / clearDensityFromDom', () => {
  it('sets and removes the data-density attribute on the root', () => {
    applyDensityToDom(document.documentElement, 'spacious');
    expect(document.documentElement.getAttribute('data-density')).toBe('spacious');
    clearDensityFromDom(document.documentElement);
    expect(document.documentElement.hasAttribute('data-density')).toBe(false);
  });
});

describe('DEFAULT_DENSITY', () => {
  it('is comfortable', () => {
    expect(DEFAULT_DENSITY).toBe('comfortable');
  });
});
