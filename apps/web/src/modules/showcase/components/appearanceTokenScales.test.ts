import { describe, expect, it } from 'vitest';

import {
  activeRoundness,
  activeShadowCard,
  roundnessOverridesFor,
  scaleRem,
} from './appearanceTokenScales';

const bases = {
  radius: '0.875rem',
  'radius-card': '0.75rem',
  'radius-control': '0.625rem',
  'radius-badge': '0.375rem',
};

describe('scaleRem', () => {
  it('scales a rem value by the factor', () => {
    expect(scaleRem('0.875rem', 1.6)).toBe('1.4rem');
    expect(scaleRem('0.75rem', 1.6)).toBe('1.2rem');
  });

  it('returns 0rem for factor 0', () => {
    expect(scaleRem('0.875rem', 0)).toBe('0rem');
  });

  it('rounds to three decimals', () => {
    expect(scaleRem('0.875rem', 0.5)).toBe('0.438rem');
  });

  it('treats non-rem input as 0', () => {
    expect(scaleRem('none', 1.6)).toBe('0rem');
  });
});

describe('roundnessOverridesFor', () => {
  it('produces all four radius overrides at the given factor', () => {
    expect(roundnessOverridesFor(0, bases)).toEqual({
      radius: '0rem',
      'radius-card': '0rem',
      'radius-control': '0rem',
      'radius-badge': '0rem',
    });
  });
});

describe('activeRoundness', () => {
  it('is default when no radius token is overridden', () => {
    expect(activeRoundness({}, bases)).toBe('default');
  });

  it('matches a preset when all four overrides equal it', () => {
    expect(activeRoundness(roundnessOverridesFor(0, bases), bases)).toBe('square');
    expect(activeRoundness(roundnessOverridesFor(1.6, bases), bases)).toBe('round');
  });

  it('is null for a custom (non-preset) radius combination', () => {
    expect(activeRoundness({ radius: '2rem' }, bases)).toBeNull();
  });
});

describe('activeShadowCard', () => {
  it('is off when not overridden', () => {
    expect(activeShadowCard({})).toBe('off');
  });

  it('matches a preset value', () => {
    expect(activeShadowCard({ 'shadow-card': '0 1px 2px 0 rgb(0 0 0 / 0.04)' })).toBe('subtle');
  });

  it('is null for a custom shadow value', () => {
    expect(activeShadowCard({ 'shadow-card': '0 0 0 1px red' })).toBeNull();
  });
});
