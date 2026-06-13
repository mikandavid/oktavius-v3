import { useCallback, useEffect, useState } from 'react';

import {
  getWindowStorage,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from '@/lib/storage/safeStorage';

/**
 * Config for a persisted preference that maps to an attribute on the document root.
 * Pass a STABLE (module-level) object — the effect depends on its functions.
 */
export type RootPrefConfig<T> = {
  /** Attribute set on <html>, e.g. 'data-density'. */
  attribute: string;
  /** localStorage key. */
  storageKey: string;
  defaultValue: T;
  /** Validate a stored string into T, or null when absent/invalid. */
  parse: (raw: string | null) => T | null;
  /** Serialize T for storage. */
  serialize: (value: T) => string;
  /** Map T to the attribute value, or null to REMOVE the attribute. */
  toAttribute: (value: T) => string | null;
};

export type RootPrefController<T> = {
  value: T;
  setValue: (value: T) => void;
  /** When false, the value is not written to localStorage and any stored key is erased. */
  persist: boolean;
  setPersist: (value: boolean) => void;
  reset: () => void;
};

/**
 * Resolve the initial in-memory value + persist flag from a raw stored string.
 * persist is true only when a VALID value was stored (so a valid falsy value still
 * counts as stored).
 */
export function resolveInitialPref<T>(
  raw: string | null,
  parse: (raw: string | null) => T | null,
  defaultValue: T,
): { value: T; persist: boolean } {
  const parsed = parse(raw);
  return { value: parsed ?? defaultValue, persist: parsed !== null };
}

export function useRootPref<T>(config: RootPrefConfig<T>): RootPrefController<T> {
  const { attribute, storageKey, defaultValue, parse, serialize, toAttribute } = config;

  const initial = resolveInitialPref(
    safeStorageGet(getWindowStorage('localStorage'), storageKey),
    parse,
    defaultValue,
  );
  const [value, setValue] = useState<T>(() => initial.value);
  const [persist, setPersist] = useState<boolean>(() => initial.persist);

  useEffect(() => {
    const root = document.documentElement;
    const attr = toAttribute(value);
    if (attr === null) {
      root.removeAttribute(attribute);
    } else {
      root.setAttribute(attribute, attr);
    }
    if (persist) {
      safeStorageSet(getWindowStorage('localStorage'), storageKey, serialize(value));
    } else {
      safeStorageRemove(getWindowStorage('localStorage'), storageKey);
    }
    return () => {
      // On unmount: restore the baseline (attribute removed). On a dependency change
      // React re-runs the effect immediately, so the removal is transient and harmless.
      root.removeAttribute(attribute);
    };
  }, [attribute, storageKey, value, persist, serialize, toAttribute]);

  const reset = useCallback(() => setValue(defaultValue), [defaultValue]);

  return { value, setValue, persist, setPersist, reset };
}
