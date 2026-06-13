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
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

export function useDensity(): DensityController {
  const [density, setDensity] = useState<Density>(
    () => readStoredDensity(getWindowStorage('localStorage')) ?? DEFAULT_DENSITY,
  );
  const [persist, setPersist] = useState<boolean>(
    () => readStoredDensity(getWindowStorage('localStorage')) !== null,
  );

  useEffect(() => {
    const root = document.documentElement;
    applyDensityToDom(root, density);
    if (persist) {
      safeStorageSet(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY, density);
    } else {
      safeStorageRemove(getWindowStorage('localStorage'), DENSITY_STORAGE_KEY);
    }
    return () => {
      clearDensityFromDom(root);
    };
  }, [density, persist]);

  const reset = useCallback(() => setDensity(DEFAULT_DENSITY), []);

  return { density, setDensity, persist, setPersist, reset };
}
