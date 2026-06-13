import { type RootPrefConfig, useRootPref } from './useRootPref';

export const REDUCED_MOTION_STORAGE_KEY = 'oktavius.showcase.reduced-motion';

const REDUCED_MOTION_PREF: RootPrefConfig<boolean> = {
  attribute: 'data-reduced-motion',
  storageKey: REDUCED_MOTION_STORAGE_KEY,
  defaultValue: false,
  parse: (raw) => (raw === 'true' ? true : raw === 'false' ? false : null),
  serialize: (value) => String(value),
  toAttribute: (value) => (value ? 'true' : null),
};

export type ReducedMotionController = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

export function useReducedMotion(): ReducedMotionController {
  const pref = useRootPref(REDUCED_MOTION_PREF);
  return {
    enabled: pref.value,
    setEnabled: pref.setValue,
    persist: pref.persist,
    setPersist: pref.setPersist,
    reset: pref.reset,
  };
}
