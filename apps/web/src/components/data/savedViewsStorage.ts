import { type ApiArrayStoreFetcher, createApiArrayStore } from '@/lib/apiArrayStore';

import type { SavedViewPreset } from './useListSavedViews';

const SAVED_VIEW_STORAGE_PREFIX = 'oktavius.savedViews';

export type StoredSavedView = SavedViewPreset & {
  filters: Record<string, string>;
};

export type MaybePromise<T> = T | Promise<T>;

export type SavedViewsStore = {
  load: () => MaybePromise<StoredSavedView[]>;
  save: (views: StoredSavedView[]) => MaybePromise<void>;
  clear: () => MaybePromise<void>;
};

export function buildSavedViewStorageKey(listKey: string) {
  return `${SAVED_VIEW_STORAGE_PREFIX}.${listKey}`;
}

function isStoredSavedView(value: unknown): value is StoredSavedView {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredSavedView>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.label === 'string' &&
    candidate.label.length > 0 &&
    !!candidate.filters &&
    typeof candidate.filters === 'object' &&
    !Array.isArray(candidate.filters)
  );
}

export function parseStoredSavedViews(payload: unknown): StoredSavedView[] {
  return Array.isArray(payload) ? payload.filter(isStoredSavedView) : [];
}

export function loadStoredSavedViews(
  storage: Storage | undefined,
  listKey: string,
): StoredSavedView[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(buildSavedViewStorageKey(listKey));
    if (!raw) return [];
    return parseStoredSavedViews(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function storeSavedViews(
  storage: Storage | undefined,
  listKey: string,
  views: StoredSavedView[],
) {
  if (!storage) return;
  storage.setItem(buildSavedViewStorageKey(listKey), JSON.stringify(views));
}

export function clearStoredSavedViews(storage: Storage | undefined, listKey: string) {
  if (!storage) return;
  storage.removeItem(buildSavedViewStorageKey(listKey));
}

export function createLocalSavedViewsStore(
  storage: Storage | undefined,
  listKey: string,
): SavedViewsStore {
  return {
    load: () => loadStoredSavedViews(storage, listKey),
    save: (views) => storeSavedViews(storage, listKey, views),
    clear: () => clearStoredSavedViews(storage, listKey),
  };
}

export function createApiSavedViewsStore({
  endpoint,
  fetcher,
  headers,
}: {
  endpoint: string;
  fetcher?: ApiArrayStoreFetcher;
  headers?: Record<string, string>;
}): SavedViewsStore {
  return createApiArrayStore({
    endpoint,
    fetcher,
    headers,
    fallback: [],
    parse: parseStoredSavedViews,
  });
}

export function createSavedViewFromFilters({
  label,
  filterKeys,
  values,
}: {
  label: string;
  filterKeys: string[];
  values: Record<string, string>;
}): StoredSavedView {
  return {
    id: `custom_${Date.now()}`,
    label,
    filters: Object.fromEntries(filterKeys.map((key) => [key, values[key] ?? ''])),
  };
}
