import { describe, expect, it, vi } from 'vitest';

import {
  buildSavedViewStorageKey,
  clearStoredSavedViews,
  createApiSavedViewsStore,
  createLocalSavedViewsStore,
  createSavedViewFromFilters,
  loadStoredSavedViews,
  type StoredSavedView,
  storeSavedViews,
} from './savedViewsStorage';

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('saved views storage helpers', () => {
  it('creates a stored view from the current filter values', () => {
    const view = createSavedViewFromFilters({
      label: 'Custom clients',
      filterKeys: ['status', 'owner'],
      values: { status: 'active', owner: '', ignored: 'yes' },
    });

    expect(view).toMatchObject({
      label: 'Custom clients',
      filters: { status: 'active', owner: '' },
    });
    expect(view.id).toMatch(/^custom_/);
  });

  it('loads only valid stored saved views', () => {
    const storageKey = buildSavedViewStorageKey('clients');
    const storage = createStorage({
      [storageKey]: JSON.stringify([
        { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
        { id: '', label: 'Invalid', filters: {} },
        { id: 'custom_2', label: 'Invalid filters', filters: null },
      ]),
    });

    expect(loadStoredSavedViews(storage, 'clients')).toEqual([
      { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
    ]);
  });

  it('stores and clears saved views by list key', () => {
    const storage = createStorage();
    const views: StoredSavedView[] = [
      { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
    ];

    storeSavedViews(storage, 'clients', views);

    expect(loadStoredSavedViews(storage, 'clients')).toEqual(views);

    clearStoredSavedViews(storage, 'clients');

    expect(loadStoredSavedViews(storage, 'clients')).toEqual([]);
  });

  it('exposes a saved-view store adapter for injectable persistence', async () => {
    const storage = createStorage();
    const store = createLocalSavedViewsStore(storage, 'clients');
    const views: StoredSavedView[] = [
      { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
    ];

    await store.save(views);

    expect(await store.load()).toEqual(views);

    await store.clear();

    expect(await store.load()).toEqual([]);
  });

  it('exposes an API store adapter for backend saved-view persistence', async () => {
    const fetcher = vi.fn(async () =>
      response([
        { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
        { id: '', label: 'Invalid', filters: {} },
      ]),
    );
    const store = createApiSavedViewsStore({
      endpoint: '/api/lists/clients/saved-views',
      fetcher,
    });

    await expect(store.load()).resolves.toEqual([
      { id: 'custom_1', label: 'Valid', filters: { status: 'active' } },
    ]);

    await store.save([{ id: 'custom_2', label: 'New view', filters: { city: 'Vienna' } }]);
    await store.clear();

    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/lists/clients/saved-views', {
      method: 'GET',
      headers: undefined,
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/lists/clients/saved-views', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: 'custom_2', label: 'New view', filters: { city: 'Vienna' } }]),
    });
    expect(fetcher).toHaveBeenNthCalledWith(3, '/api/lists/clients/saved-views', {
      method: 'DELETE',
      headers: undefined,
    });
  });
});
