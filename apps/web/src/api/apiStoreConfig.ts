import {
  createApiSavedViewsStore,
  createLocalSavedViewsStore,
  type SavedViewsStore,
} from '@/components/data/savedViewsStorage';
import type { CatalogOption } from '@/components/settings/CatalogOptionsManager';
import {
  type CatalogOptionsStore,
  createApiCatalogOptionsStore,
  createLocalCatalogOptionsStore,
} from '@/components/settings/catalogOptionsStore';
import type { ApiArrayStoreFetcher } from '@/lib/apiArrayStore';

export type ApiStoreEnvironment = {
  VITE_OKTAVIUS_API_BASE_URL?: string;
  VITE_OKTAVIUS_API_TOKEN?: string;
};

const GENERATED_STORE_ENDPOINTS = {
  savedViews: '/generated-stores/saved-views',
  catalogOptions: '/generated-stores/catalog-options',
} as const;

function joinPath(base: string, path: string) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function storeEndpoint(baseUrl: string, storePath: string, key: string) {
  return joinPath(joinPath(baseUrl, storePath), encodeURIComponent(key));
}

function configuredHeaders(env: ApiStoreEnvironment) {
  const token = env.VITE_OKTAVIUS_API_TOKEN?.trim();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function configuredBaseUrl(env: ApiStoreEnvironment) {
  return env.VITE_OKTAVIUS_API_BASE_URL?.trim() ?? '';
}

export function createConfiguredSavedViewsStore({
  listKey,
  storage,
  env,
  fetcher,
}: {
  listKey: string;
  storage?: Storage;
  env: ApiStoreEnvironment;
  fetcher?: ApiArrayStoreFetcher;
}): SavedViewsStore {
  const baseUrl = configuredBaseUrl(env);
  if (!baseUrl) return createLocalSavedViewsStore(storage, listKey);

  return createApiSavedViewsStore({
    endpoint: storeEndpoint(baseUrl, GENERATED_STORE_ENDPOINTS.savedViews, listKey),
    fetcher,
    headers: configuredHeaders(env),
  });
}

export function createConfiguredCatalogOptionsStore({
  catalogKey,
  defaults,
  storage,
  env,
  fetcher,
}: {
  catalogKey: string;
  defaults: CatalogOption[];
  storage?: Storage;
  env: ApiStoreEnvironment;
  fetcher?: ApiArrayStoreFetcher;
}): CatalogOptionsStore {
  const baseUrl = configuredBaseUrl(env);
  if (!baseUrl) return createLocalCatalogOptionsStore(storage, catalogKey, defaults);

  return createApiCatalogOptionsStore({
    endpoint: storeEndpoint(baseUrl, GENERATED_STORE_ENDPOINTS.catalogOptions, catalogKey),
    defaults,
    fetcher,
    headers: configuredHeaders(env),
  });
}
