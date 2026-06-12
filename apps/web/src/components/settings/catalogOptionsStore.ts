import { type ApiArrayStoreFetcher, createApiArrayStore } from '@/lib/apiArrayStore';

import type { CatalogOption } from './CatalogOptionsManager';

const CATALOG_OPTIONS_STORAGE_PREFIX = 'oktavius.catalogOptions';

type MaybePromise<T> = T | Promise<T>;

export type CatalogOptionsStore = {
  load: () => MaybePromise<CatalogOption[]>;
  save: (options: CatalogOption[]) => MaybePromise<void>;
  clear: () => MaybePromise<void>;
};

export function buildCatalogOptionsStorageKey(catalogKey: string) {
  return `${CATALOG_OPTIONS_STORAGE_PREFIX}.${catalogKey}`;
}

function isCatalogOption(value: unknown): value is CatalogOption {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CatalogOption>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.label === 'string' &&
    candidate.label.length > 0 &&
    typeof candidate.active === 'boolean' &&
    (candidate.code === undefined || typeof candidate.code === 'string') &&
    (candidate.sortOrder === undefined || typeof candidate.sortOrder === 'number')
  );
}

export function parseCatalogOptions(payload: unknown): CatalogOption[] {
  return Array.isArray(payload) ? payload.filter(isCatalogOption) : [];
}

export function loadStoredCatalogOptions(
  storage: Storage | undefined,
  catalogKey: string,
  defaults: CatalogOption[],
): CatalogOption[] {
  if (!storage) return defaults;

  try {
    const raw = storage.getItem(buildCatalogOptionsStorageKey(catalogKey));
    if (!raw) return defaults;
    const validOptions = parseCatalogOptions(JSON.parse(raw) as unknown);
    return validOptions.length > 0 ? validOptions : defaults;
  } catch {
    return defaults;
  }
}

export function createApiCatalogOptionsStore({
  endpoint,
  defaults,
  fetcher,
  headers,
}: {
  endpoint: string;
  defaults: CatalogOption[];
  fetcher?: ApiArrayStoreFetcher;
  headers?: Record<string, string>;
}): CatalogOptionsStore {
  return createApiArrayStore({
    endpoint,
    fetcher,
    headers,
    fallback: defaults,
    parse: parseCatalogOptions,
  });
}

export function storeCatalogOptions(
  storage: Storage | undefined,
  catalogKey: string,
  options: CatalogOption[],
) {
  if (!storage) return;
  storage.setItem(buildCatalogOptionsStorageKey(catalogKey), JSON.stringify(options));
}

export function clearStoredCatalogOptions(storage: Storage | undefined, catalogKey: string) {
  if (!storage) return;
  storage.removeItem(buildCatalogOptionsStorageKey(catalogKey));
}

export function createLocalCatalogOptionsStore(
  storage: Storage | undefined,
  catalogKey: string,
  defaults: CatalogOption[],
): CatalogOptionsStore {
  return {
    load: () => loadStoredCatalogOptions(storage, catalogKey, defaults),
    save: (options) => storeCatalogOptions(storage, catalogKey, options),
    clear: () => clearStoredCatalogOptions(storage, catalogKey),
  };
}
