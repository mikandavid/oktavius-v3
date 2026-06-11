import {
  getWindowStorage,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from '@/lib/storage/safeStorage';

const CHUNK_RELOAD_STATE_KEY = 'oktavius.chunk-reload-state';
const LAST_HEALTHY_URL_KEY = 'oktavius.last-healthy-url';
const CHUNK_RELOAD_TTL_MS = 5 * 60 * 1000;
const MAX_AUTO_RELOADS_PER_URL = 1;

interface ChunkReloadState {
  url: string;
  attempts: number;
  updatedAt: number;
}

export interface ChunkLoadRecoveryState {
  isChunkLoadError: boolean;
  shouldAutoReload: boolean;
  hasExceededAutoReloads: boolean;
  lastHealthyUrl: string | null;
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function getCurrentUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return normalizeUrl(window.location.href);
}

function readJson<T>(key: string): T | null {
  const raw = safeStorageGet(getWindowStorage('sessionStorage'), key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  const storage = getWindowStorage('sessionStorage');
  if (value === null) {
    safeStorageRemove(storage, key);
    return;
  }

  safeStorageSet(storage, key, JSON.stringify(value));
}

function getReloadState(): ChunkReloadState | null {
  const state = readJson<ChunkReloadState>(CHUNK_RELOAD_STATE_KEY);
  if (!state) return null;

  if (Date.now() - state.updatedAt > CHUNK_RELOAD_TTL_MS) {
    writeJson(CHUNK_RELOAD_STATE_KEY, null);
    return null;
  }

  return state;
}

function extractErrorText(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join(' ');
  }
  if (!error || typeof error !== 'object') return '';

  const values: string[] = [];
  if ('name' in error && typeof error.name === 'string') values.push(error.name);
  if ('message' in error && typeof error.message === 'string') values.push(error.message);
  if ('reason' in error) values.push(extractErrorText(error.reason));
  if ('error' in error) values.push(extractErrorText(error.error));
  return values.filter(Boolean).join(' ');
}

export function isChunkLoadError(error: unknown): boolean {
  const errorText = extractErrorText(error).toLowerCase();
  if (!errorText) return false;

  if (
    [
      'failed to fetch dynamically imported module',
      'error loading dynamically imported module',
      'importing a module script failed',
      'chunkloaderror',
      'loading chunk',
      'failed to load module script',
      'unable to preload css',
    ].some((signature) => errorText.includes(signature))
  ) {
    return true;
  }

  return /\/assets\/[^\s"'`]+\.(?:js|mjs|css)/i.test(errorText);
}

export function rememberHealthyRoute(url: string): void {
  writeJson(LAST_HEALTHY_URL_KEY, normalizeUrl(url));
}

export function setLastHealthyLocation(url: string): void {
  rememberHealthyRoute(url);
}

export function getLastHealthyLocation(currentUrl: string | null = getCurrentUrl()): string | null {
  const storedUrl = readJson<string>(LAST_HEALTHY_URL_KEY);
  if (!storedUrl) return null;
  if (currentUrl && normalizeUrl(currentUrl) === storedUrl) return null;
  return storedUrl;
}

export function registerChunkLoadReload(currentUrl: string | null = getCurrentUrl()): boolean {
  if (!currentUrl) return false;

  const normalizedUrl = normalizeUrl(currentUrl);
  const existingState = getReloadState();
  const attempts = existingState?.url === normalizedUrl ? existingState.attempts : 0;
  if (attempts >= MAX_AUTO_RELOADS_PER_URL) return false;

  writeJson(CHUNK_RELOAD_STATE_KEY, {
    url: normalizedUrl,
    attempts: attempts + 1,
    updatedAt: Date.now(),
  } satisfies ChunkReloadState);

  return true;
}

export function getChunkLoadRecoveryState(
  error: unknown,
  currentUrl: string | null = getCurrentUrl(),
): ChunkLoadRecoveryState {
  const chunkLoadFailure = isChunkLoadError(error);
  const normalizedUrl = currentUrl ? normalizeUrl(currentUrl) : null;
  const reloadState = getReloadState();
  const attemptsForCurrentUrl =
    normalizedUrl && reloadState?.url === normalizedUrl ? reloadState.attempts : 0;

  return {
    isChunkLoadError: chunkLoadFailure,
    shouldAutoReload:
      chunkLoadFailure &&
      Boolean(normalizedUrl) &&
      attemptsForCurrentUrl < MAX_AUTO_RELOADS_PER_URL,
    hasExceededAutoReloads:
      chunkLoadFailure &&
      Boolean(normalizedUrl) &&
      attemptsForCurrentUrl >= MAX_AUTO_RELOADS_PER_URL,
    lastHealthyUrl: getLastHealthyLocation(normalizedUrl),
  };
}

export function triggerChunkLoadAutoReload(error: unknown): boolean {
  if (!getChunkLoadRecoveryState(error).shouldAutoReload) return false;
  if (!registerChunkLoadReload()) return false;

  window.location.reload();
  return true;
}
