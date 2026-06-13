/**
 * Pure mapping logic for the "friendly" appearance controls in the showcase
 * settings drawer. These map preset choices onto design-token overrides.
 */

export const RADIUS_TOKEN_KEYS = [
  'radius',
  'radius-card',
  'radius-control',
  'radius-badge',
] as const;
export type RadiusTokenKey = (typeof RADIUS_TOKEN_KEYS)[number];

export const ROUNDNESS_PRESETS = [
  { id: 'square', label: 'Square', factor: 0 },
  { id: 'subtle', label: 'Subtle', factor: 0.5 },
  { id: 'default', label: 'Default', factor: 1 },
  { id: 'round', label: 'Round', factor: 1.6 },
] as const;
export type RoundnessId = (typeof ROUNDNESS_PRESETS)[number]['id'];

/** Scale a `<number>rem` base value by a factor. Non-rem input scales from 0. */
export function scaleRem(baseRem: string, factor: number): string {
  const match = /^(-?\d*\.?\d+)rem$/.exec(baseRem.trim());
  const base = match ? Number(match[1]) : 0;
  const scaled = Math.round(base * factor * 1000) / 1000;
  return `${scaled}rem`;
}

/** The four radius overrides for a given factor, derived from the base values. */
export function roundnessOverridesFor(
  factor: number,
  bases: Record<string, string>,
): Record<RadiusTokenKey, string> {
  const result = {} as Record<RadiusTokenKey, string>;
  for (const key of RADIUS_TOKEN_KEYS) {
    result[key] = scaleRem(bases[key] ?? '0rem', factor);
  }
  return result;
}

/**
 * Which roundness preset the current overrides correspond to:
 * - 'default' when no radius token is overridden,
 * - a non-default preset id when all four overrides match it exactly,
 * - null when the radius tokens were edited to a custom (non-preset) combination.
 */
export function activeRoundness(
  overrides: Record<string, string | undefined>,
  bases: Record<string, string>,
): RoundnessId | null {
  const anyOverride = RADIUS_TOKEN_KEYS.some((key) => overrides[key] !== undefined);
  if (!anyOverride) return 'default';
  for (const preset of ROUNDNESS_PRESETS) {
    if (preset.id === 'default') continue;
    const want = roundnessOverridesFor(preset.factor, bases);
    if (RADIUS_TOKEN_KEYS.every((key) => overrides[key] === want[key])) return preset.id;
  }
  return null;
}

export const SHADOW_CARD_TOKEN_KEY = 'shadow-card';

export const SHADOW_CARD_PRESETS = [
  { id: 'off', label: 'Off', value: null },
  { id: 'subtle', label: 'Subtle', value: '0 1px 2px 0 rgb(0 0 0 / 0.04)' },
  { id: 'medium', label: 'Medium', value: '0 2px 6px -1px rgb(0 0 0 / 0.08)' },
  { id: 'strong', label: 'Strong', value: '0 6px 16px -4px rgb(0 0 0 / 0.12)' },
] as const;
export type ShadowCardId = (typeof SHADOW_CARD_PRESETS)[number]['id'];

/**
 * Which card-shadow preset is active:
 * - 'off' when `--shadow-card` is not overridden (the default is `none`),
 * - the matching preset id, or
 * - null when overridden to a custom value.
 */
export function activeShadowCard(
  overrides: Record<string, string | undefined>,
): ShadowCardId | null {
  const current = overrides[SHADOW_CARD_TOKEN_KEY];
  if (current === undefined) return 'off';
  const match = SHADOW_CARD_PRESETS.find((preset) => preset.value === current);
  return match ? match.id : null;
}
