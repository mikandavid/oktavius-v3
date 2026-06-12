import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getWindowStorage,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from '@/lib/storage/safeStorage';

import { DESIGN_TOKEN_KEYS } from './tokenRegistry';

const STORAGE_KEY = 'oktavius.design-token-overrides';

export type TokenOverrides = Record<string, string>;

function readStoredOverrides(): TokenOverrides {
  try {
    const storage = getWindowStorage('localStorage');
    const raw = safeStorageGet(storage, STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const result: TokenOverrides = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        result[key] = value.trim();
      }
    }
    return result;
  } catch {
    return {};
  }
}

function writeStoredOverrides(overrides: TokenOverrides) {
  if (Object.keys(overrides).length === 0) {
    safeStorageRemove(getWindowStorage('localStorage'), STORAGE_KEY);
    return;
  }
  safeStorageSet(getWindowStorage('localStorage'), STORAGE_KEY, JSON.stringify(overrides));
}

function applyOverridesToDom(overrides: TokenOverrides) {
  const root = document.documentElement;
  for (const key of DESIGN_TOKEN_KEYS) {
    const value = overrides[key];
    if (value) {
      root.style.setProperty(`--${key}`, value);
    } else {
      root.style.removeProperty(`--${key}`);
    }
  }
}

function clearDomOverrides() {
  const root = document.documentElement;
  for (const key of DESIGN_TOKEN_KEYS) {
    root.style.removeProperty(`--${key}`);
  }
}

export function useDesignTokenOverrides(active: boolean) {
  const [overrides, setOverridesState] = useState<TokenOverrides>(() => readStoredOverrides());
  const [persist, setPersist] = useState(true);

  useEffect(() => {
    if (!active) {
      clearDomOverrides();
      return;
    }

    applyOverridesToDom(overrides);
    if (persist) {
      writeStoredOverrides(overrides);
    }

    return () => {
      clearDomOverrides();
    };
  }, [active, overrides, persist]);

  const setOverride = useCallback((key: string, value: string) => {
    setOverridesState((current) => {
      const next = { ...current };
      if (!value.trim()) {
        delete next[key];
      } else {
        next[key] = value.trim();
      }
      return next;
    });
  }, []);

  const resetToken = useCallback((key: string) => {
    setOverridesState((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setOverridesState({});
    safeStorageRemove(getWindowStorage('localStorage'), STORAGE_KEY);
  }, []);

  const exportCss = useMemo(() => {
    const lines = Object.entries(overrides).map(([key, value]) => `  --${key}: ${value};`);
    if (lines.length === 0) return '';
    return `:root {\n${lines.join('\n')}\n}`;
  }, [overrides]);

  const overrideCount = Object.keys(overrides).length;

  return {
    overrides,
    setOverride,
    resetToken,
    resetAll,
    exportCss,
    overrideCount,
    persist,
    setPersist,
  };
}
