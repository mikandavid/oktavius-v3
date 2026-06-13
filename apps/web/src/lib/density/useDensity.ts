import { useCallback, useEffect, useState } from 'react';

import { getWindowStorage, safeStorageRemove, safeStorageSet } from '@/lib/storage/safeStorage';

import {
  applyDensityToDom,
  clearDensityFromDom,
  DEFAULT_DENSITY,
  type Density,
  DENSITY_STORAGE_KEY,
  readStoredDensity,
} from './density';

export type DensityController = {
  density: Density;
  setDensity: (value: Density) => void;
  /** When false, the current density is not written to localStorage and any
   *  previously stored key is erased. The in-memory density is unchanged. */
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

export function useDensity(): DensityController {
  const storedOnMount = readStoredDensity(getWindowStorage('localStorage'));
  const [density, setDensity] = useState<Density>(() => storedOnMount ?? DEFAULT_DENSITY);
  const [persist, setPersist] = useState<boolean>(() => storedOnMount !== null);

  useEffect(() => {
    const root = document.documentElement;
    applyDensityToDom(root, density);
    if (persist) {
      safeStorageSet(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY, density);
    } else {
      safeStorageRemove(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY);
    }
    return () => {
      // On unmount: restore the baseline (no data-density). On a dependency change
      // React re-runs the effect immediately, so the removal is transient and harmless.
      clearDensityFromDom(root);
    };
  }, [density, persist]);

  const reset = useCallback(() => setDensity(DEFAULT_DENSITY), []);

  return { density, setDensity, persist, setPersist, reset };
}
