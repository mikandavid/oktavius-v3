import { describe, expect, it, vi } from 'vitest';

import type { CatalogOption } from './CatalogOptionsManager';
import {
  buildCatalogOptionsStorageKey,
  type CatalogOptionsStore,
  createApiCatalogOptionsStore,
  createLocalCatalogOptionsStore,
  loadStoredCatalogOptions,
  storeCatalogOptions,
} from './catalogOptionsStore';

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

const defaults: CatalogOption[] = [
  { id: 'pt_net30', label: 'Net 30', code: 'NET30', active: true, sortOrder: 1 },
];

describe('catalog options store', () => {
  it('loads defaults when catalog storage is empty or invalid', () => {
    expect(loadStoredCatalogOptions(createStorage(), 'paymentTerms', defaults)).toEqual(defaults);
    expect(
      loadStoredCatalogOptions(
        createStorage({ [buildCatalogOptionsStorageKey('paymentTerms')]: 'not-json' }),
        'paymentTerms',
        defaults,
      ),
    ).toEqual(defaults);
  });

  it('loads only valid stored catalog options', () => {
    const storage = createStorage({
      [buildCatalogOptionsStorageKey('paymentTerms')]: JSON.stringify([
        { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
        { id: '', label: 'Invalid id', active: true },
        { id: 'pt_missing_label', active: true },
        { id: 'pt_invalid_active', label: 'Bad active', active: 'yes' },
      ]),
    });

    expect(loadStoredCatalogOptions(storage, 'paymentTerms', defaults)).toEqual([
      { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
    ]);
  });

  it('stores catalog options under a scoped key', () => {
    const storage = createStorage();
    const options: CatalogOption[] = [
      { id: 'pt_due', label: 'Due on receipt', code: 'DUE', active: true, sortOrder: 3 },
    ];

    storeCatalogOptions(storage, 'paymentTerms', options);

    expect(loadStoredCatalogOptions(storage, 'paymentTerms', defaults)).toEqual(options);
  });

  it('exposes a store adapter for generated or backend catalog persistence', async () => {
    const storage = createStorage();
    const store: CatalogOptionsStore = createLocalCatalogOptionsStore(
      storage,
      'paymentTerms',
      defaults,
    );
    const options: CatalogOption[] = [
      { id: 'pt_eom', label: 'End of month', code: 'EOM', active: false, sortOrder: 4 },
    ];

    await store.save(options);
    expect(await store.load()).toEqual(options);

    await store.clear();
    expect(await store.load()).toEqual(defaults);
  });

  it('exposes an API store adapter for backend catalog persistence', async () => {
    const fetcher = vi.fn(async () =>
      response([
        { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
        { id: 'pt_invalid', label: 'Invalid active', active: 'yes' },
      ]),
    );
    const store = createApiCatalogOptionsStore({
      endpoint: '/api/catalogs/payment-terms/options',
      defaults,
      fetcher,
    });

    await expect(store.load()).resolves.toEqual([
      { id: 'pt_net14', label: 'Net 14', code: 'NET14', active: true, sortOrder: 2 },
    ]);
  });
});
