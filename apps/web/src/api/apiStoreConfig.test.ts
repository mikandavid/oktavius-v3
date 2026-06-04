import { describe, expect, it, vi } from 'vitest';

import type { CatalogOption } from '@/components/settings/CatalogOptionsManager';

import {
  createConfiguredCatalogOptionsStore,
  createConfiguredReportStore,
  createConfiguredSavedViewsStore,
} from './apiStoreConfig';

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

describe('API-backed generated store configuration', () => {
  it('keeps saved views on local storage when no production base URL is configured', async () => {
    const storage = createStorage();
    const store = createConfiguredSavedViewsStore({
      listKey: 'clients',
      storage,
      env: {},
    });

    await store.save([{ id: 'custom_1', label: 'Active', filters: { status: 'active' } }]);

    await expect(Promise.resolve(store.load())).resolves.toEqual([
      { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
    ]);
  });

  it('routes saved views to the production endpoint with bearer auth', async () => {
    const fetcher = vi.fn(async () =>
      response([{ id: 'custom_1', label: 'Active', filters: { status: 'active' } }]),
    );
    const store = createConfiguredSavedViewsStore({
      listKey: 'clients',
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: 'https://api.example.test/v1',
        VITE_OKTAVIUS_API_TOKEN: 'secret',
      },
    });

    await expect(store.load()).resolves.toEqual([
      { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
    ]);

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.example.test/v1/generated-stores/saved-views/clients',
      {
        method: 'GET',
        headers: { Authorization: 'Bearer secret' },
      },
    );
  });

  it('routes catalog options to the production endpoint', async () => {
    const defaults: CatalogOption[] = [
      { id: 'net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
    ];
    const fetcher = vi.fn(async () => response(defaults));
    const store = createConfiguredCatalogOptionsStore({
      catalogKey: 'paymentTerms',
      defaults,
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: '/api',
      },
    });

    await expect(store.load()).resolves.toEqual(defaults);

    expect(fetcher).toHaveBeenCalledWith('/api/generated-stores/catalog-options/paymentTerms', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('routes saved reports to the production endpoint', async () => {
    const fetcher = vi.fn(async () =>
      response([{ id: 'report_1', name: 'Pipeline', chartType: 'bar', dataset: 'pipeline' }]),
    );
    const store = createConfiguredReportStore({
      storageKey: 'reports',
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: '/api/',
      },
    });

    await store.save([{ id: 'report_1', name: 'Pipeline', chartType: 'bar', dataset: 'pipeline' }]);

    expect(fetcher).toHaveBeenCalledWith('/api/generated-stores/reports/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { id: 'report_1', name: 'Pipeline', chartType: 'bar', dataset: 'pipeline' },
      ]),
    });
  });
});
