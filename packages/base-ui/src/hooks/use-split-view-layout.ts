import { useCallback, useMemo, useState } from 'react';

const STORAGE_PREFIX = 'oktavius:split-view';
type BrowserStorage = Storage | undefined;
const STORAGE_PROBE_KEY = '__oktavius-split-view-storage-probe__';

function getStorageKey(persistKey: string | undefined) {
  return persistKey ? `${STORAGE_PREFIX}:${persistKey}:sidebar-width` : null;
}

function getWindowStorage(): BrowserStorage {
  if (typeof window === 'undefined') return undefined;

  try {
    const storage = window.localStorage;
    storage.setItem(STORAGE_PROBE_KEY, '1');
    storage.removeItem(STORAGE_PROBE_KEY);
    return storage;
  } catch {
    return undefined;
  }
}

function readStoredSidebarWidth(storageKey: string | null) {
  if (!storageKey) return null;
  const storage = getWindowStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return null;

    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function clampSplitViewSidebarWidth(width: number, minWidth: number, maxWidth: number) {
  const safeMin = Math.max(0, Math.round(minWidth));
  const safeMax = Math.max(safeMin, Math.round(maxWidth));

  if (!Number.isFinite(width)) return safeMin;
  return Math.min(Math.max(Math.round(width), safeMin), safeMax);
}

export function useSplitViewLayout(
  persistKey: string | undefined,
  defaultSidebarWidth: number,
  minSidebarWidth: number,
  maxSidebarWidth: number,
) {
  const storageKey = useMemo(() => getStorageKey(persistKey), [persistKey]);

  const [sidebarWidth, setSidebarWidthState] = useState(() => {
    const storedWidth = readStoredSidebarWidth(storageKey);
    return clampSplitViewSidebarWidth(
      storedWidth ?? defaultSidebarWidth,
      minSidebarWidth,
      maxSidebarWidth,
    );
  });

  const setSidebarWidth = useCallback(
    (nextWidth: number) => {
      setSidebarWidthState(clampSplitViewSidebarWidth(nextWidth, minSidebarWidth, maxSidebarWidth));
    },
    [minSidebarWidth, maxSidebarWidth],
  );

  const persistSidebarWidth = useCallback(
    (nextWidth = sidebarWidth) => {
      const storage = getWindowStorage();
      if (!storageKey || !storage) return;

      try {
        storage.setItem(
          storageKey,
          String(clampSplitViewSidebarWidth(nextWidth, minSidebarWidth, maxSidebarWidth)),
        );
      } catch {
        return;
      }
    },
    [storageKey, sidebarWidth, minSidebarWidth, maxSidebarWidth],
  );

  return {
    sidebarWidth,
    setSidebarWidth,
    persistSidebarWidth,
  };
}
