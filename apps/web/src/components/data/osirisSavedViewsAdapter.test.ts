import { describe, expect, it, vi } from 'vitest';

import { createOsirisSavedViewsAdapter } from './osirisSavedViewsAdapter';

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createOsirisSavedViewsAdapter', () => {
  it('loads saved views from the Osiris generated-store endpoint', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse([{ id: 'custom_1', label: 'Active', filters: { status: 'active' } }]),
    );
    const adapter = createOsirisSavedViewsAdapter({ baseUrl: '/v1', fetcher });

    await expect(adapter.fetchViews({ listKey: 'clients' })).resolves.toEqual([
      { id: 'custom_1', label: 'Active', filters: { status: 'active' } },
    ]);

    expect(fetcher).toHaveBeenCalledWith('/v1/generated-stores/saved-views/clients', {
      method: 'GET',
      credentials: 'include',
    });
  });

  it('persists and clears saved views through the generated-store endpoint', async () => {
    const fetcher = vi.fn(async () => jsonResponse([]));
    const adapter = createOsirisSavedViewsAdapter({ baseUrl: '/v1', fetcher });
    const views = [{ id: 'custom_2', label: 'Drafts', filters: { status: 'draft' } }];

    await adapter.persistView({ listKey: 'orders' }, views[0], views);
    await adapter.deleteView({ listKey: 'orders' }, 'custom_2', []);

    expect(fetcher).toHaveBeenNthCalledWith(1, '/v1/generated-stores/saved-views/orders', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(views),
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/v1/generated-stores/saved-views/orders', {
      method: 'DELETE',
      credentials: 'include',
    });
  });
});
