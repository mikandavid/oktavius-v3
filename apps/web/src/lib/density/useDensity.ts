import { type RootPrefConfig, useRootPref } from '@/lib/showcase-prefs/useRootPref';

import { DEFAULT_DENSITY, type Density, DENSITY_STORAGE_KEY, isDensity } from './density';

export type DensityController = {
  density: Density;
  setDensity: (value: Density) => void;
  /** When false, the current density is not written to localStorage and any
   *  previously stored key is erased. The in-memory density is unchanged. */
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

const DENSITY_PREF: RootPrefConfig<Density> = {
  attribute: 'data-density',
  storageKey: DENSITY_STORAGE_KEY,
  defaultValue: DEFAULT_DENSITY,
  parse: (raw) => (isDensity(raw) ? raw : null),
  serialize: (value) => value,
  toAttribute: (value) => value, // density always sets the attribute
};

export function useDensity(): DensityController {
  const pref = useRootPref(DENSITY_PREF);
  return {
    density: pref.value,
    setDensity: pref.setValue,
    persist: pref.persist,
    setPersist: pref.setPersist,
    reset: pref.reset,
  };
}
