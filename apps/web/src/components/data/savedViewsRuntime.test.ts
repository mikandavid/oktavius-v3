import { describe, expect, it, vi } from 'vitest';

import {
  createLocalSavedViewsRuntime,
  createSavedViewsStoreFromRuntime,
  type SavedViewsRuntimeAdapter,
} from './savedViewsRuntime';
import type { StoredSavedView } from './savedViewsStorage';

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

describe('saved views runtime', () => {
  it('persists saved views through the local runtime adapter', async () => {
    const runtime = createLocalSavedViewsRuntime(createStorage());
    const store = createSavedViewsStoreFromRuntime(runtime, { listKey: 'clients' });
    const views: StoredSavedView[] = [
      { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
    ];

    await store.save(views);

    await expect(store.load()).resolves.toEqual(views);
  });

  it('adapts a custom runtime to the saved views store contract', async () => {
    const runtime: SavedViewsRuntimeAdapter = {
      fetchViews: vi.fn(async () => [
        { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
      ]),
      persistView: vi.fn(async () => undefined),
      deleteView: vi.fn(async () => undefined),
      shareView: vi.fn(async () => undefined),
    };
    const store = createSavedViewsStoreFromRuntime(runtime, { listKey: 'orders' });

    await expect(store.load()).resolves.toHaveLength(1);
    await store.save([{ id: 'custom_2', label: 'Drafts', filters: { status: 'draft' } }]);
    await store.clear();

    expect(runtime.fetchViews).toHaveBeenCalledWith({ listKey: 'orders' });
    expect(runtime.persistView).toHaveBeenCalledWith(
      { listKey: 'orders' },
      { id: 'custom_2', label: 'Drafts', filters: { status: 'draft' } },
      [{ id: 'custom_2', label: 'Drafts', filters: { status: 'draft' } }],
    );
    expect(runtime.deleteView).toHaveBeenCalledWith({ listKey: 'orders' }, 'custom_2', []);
  });
});
