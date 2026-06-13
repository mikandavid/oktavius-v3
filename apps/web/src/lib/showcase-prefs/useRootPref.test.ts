import { describe, expect, it } from 'vitest';

import { resolveInitialPref } from './useRootPref';

const parseDensity = (raw: string | null): 'compact' | 'comfortable' | 'spacious' | null =>
  raw === 'compact' || raw === 'comfortable' || raw === 'spacious' ? raw : null;

const parseBool = (raw: string | null): boolean | null =>
  raw === 'true' ? true : raw === 'false' ? false : null;

describe('resolveInitialPref', () => {
  it('uses the default and persist=false when nothing valid is stored', () => {
    expect(resolveInitialPref(null, parseDensity, 'comfortable')).toEqual({
      value: 'comfortable',
      persist: false,
    });
    expect(resolveInitialPref('nope', parseDensity, 'comfortable')).toEqual({
      value: 'comfortable',
      persist: false,
    });
  });

  it('uses the stored value and persist=true when valid', () => {
    expect(resolveInitialPref('compact', parseDensity, 'comfortable')).toEqual({
      value: 'compact',
      persist: true,
    });
  });

  it('treats a valid falsy value as stored (persist=true, not default)', () => {
    expect(resolveInitialPref('false', parseBool, false)).toEqual({ value: false, persist: true });
    expect(resolveInitialPref(null, parseBool, false)).toEqual({ value: false, persist: false });
  });
});
