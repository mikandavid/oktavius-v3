import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';

const RELOAD_KEY = 'oktavius.chunkLoadReloadCount';
const LAST_URL_KEY = 'oktavius.lastHealthyUrl';

export type ChunkLoadRecoveryState = {
  isChunkLoadError: boolean;
  shouldAutoReload: boolean;
  hasExceededAutoReloads: boolean;
  lastHealthyUrl: string | null;
};

function isChunkLoadMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('loading chunk') ||
    normalized.includes('chunkloaderror')
  );
}

export function getChunkLoadRecoveryState(error: unknown): ChunkLoadRecoveryState {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  const isChunkLoadError = isChunkLoadMessage(message);
  const storage = getWindowStorage('sessionStorage');
  const reloadCount = Number(safeStorageGet(storage, RELOAD_KEY) ?? '0');
  const shouldAutoReload = isChunkLoadError && reloadCount < 1;
  const lastHealthyUrl = safeStorageGet(storage, LAST_URL_KEY);

  return {
    isChunkLoadError,
    shouldAutoReload,
    hasExceededAutoReloads: isChunkLoadError && reloadCount >= 1,
    lastHealthyUrl,
  };
}

export function registerChunkLoadReload(): boolean {
  const storage = getWindowStorage('sessionStorage');
  const reloadCount = Number(safeStorageGet(storage, RELOAD_KEY) ?? '0');
  if (reloadCount >= 1) return false;
  safeStorageSet(storage, RELOAD_KEY, String(reloadCount + 1));
  return true;
}

export function rememberHealthyRoute(url: string) {
  safeStorageSet(getWindowStorage('sessionStorage'), LAST_URL_KEY, url);
}
