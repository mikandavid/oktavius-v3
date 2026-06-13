import { type BrowserStorage, safeStorageGet } from '@/lib/storage/safeStorage';

export type Density = 'compact' | 'comfortable' | 'spacious';

export const DENSITIES: readonly Density[] = ['compact', 'comfortable', 'spacious'];
export const DEFAULT_DENSITY: Density = 'comfortable';
export const DENSITY_STORAGE_KEY = 'oktavius.showcase.density';

export function isDensity(value: unknown): value is Density {
  return typeof value === 'string' && (DENSITIES as readonly string[]).includes(value);
}

export function readStoredDensity(storage: BrowserStorage): Density | null {
  const raw = safeStorageGet(storage, DENSITY_STORAGE_KEY);
  return isDensity(raw) ? raw : null;
}

export function applyDensityToDom(root: HTMLElement, density: Density): void {
  root.setAttribute('data-density', density);
}

export function clearDensityFromDom(root: HTMLElement): void {
  root.removeAttribute('data-density');
}
