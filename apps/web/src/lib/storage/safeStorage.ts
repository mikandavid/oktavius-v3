export type BrowserStorage = Storage | undefined;
export type BrowserStorageType = 'localStorage' | 'sessionStorage';

const STORAGE_PROBE_KEY = '__oktavius-storage-probe__';

function withStorageErrorBoundary<T>(fallback: T, operation: () => T): T {
  try {
    return operation();
  } catch {
    return fallback;
  }
}

export function getWindowStorage(type: BrowserStorageType): BrowserStorage {
  if (typeof window === 'undefined') return undefined;

  return withStorageErrorBoundary<BrowserStorage>(undefined, () => {
    const storage = window[type];
    storage.setItem(STORAGE_PROBE_KEY, '1');
    storage.removeItem(STORAGE_PROBE_KEY);
    return storage;
  });
}

export function safeStorageGet(storage: BrowserStorage, key: string): string | null {
  if (!storage) return null;
  return withStorageErrorBoundary<string | null>(null, () => storage.getItem(key));
}

export function safeStorageSet(storage: BrowserStorage, key: string, value: string): boolean {
  if (!storage) return false;
  return withStorageErrorBoundary(false, () => {
    storage.setItem(key, value);
    return true;
  });
}

export function safeStorageRemove(storage: BrowserStorage, key: string): boolean {
  if (!storage) return false;
  return withStorageErrorBoundary(false, () => {
    storage.removeItem(key);
    return true;
  });
}
