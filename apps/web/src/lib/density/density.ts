export type Density = 'compact' | 'comfortable' | 'spacious';

export const DENSITIES: readonly Density[] = ['compact', 'comfortable', 'spacious'];
export const DEFAULT_DENSITY: Density = 'comfortable';
export const DENSITY_STORAGE_KEY = 'oktavius.showcase.density';

export function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (DENSITIES as readonly string[]).includes(value);
}
