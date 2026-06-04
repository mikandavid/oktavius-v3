import { describe, expect, it, vi } from 'vitest';

import { createApiArrayStore } from './apiArrayStore';

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('API array store', () => {
  it('loads and parses JSON array payloads', async () => {
    const fetcher = vi.fn(async () => response([{ id: 'one' }, { missing: true }]));
    const store = createApiArrayStore({
      endpoint: '/api/items',
      fetcher,
      fallback: [],
      parse: (payload) =>
        Array.isArray(payload)
          ? payload.filter((item): item is { id: string } => {
              return (
                !!item &&
                typeof item === 'object' &&
                typeof (item as { id?: unknown }).id === 'string'
              );
            })
          : [],
    });

    await expect(store.load()).resolves.toEqual([{ id: 'one' }]);
    expect(fetcher).toHaveBeenCalledWith('/api/items', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('saves arrays with PUT JSON requests', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    const store = createApiArrayStore<{ id: string }>({
      endpoint: '/api/items',
      fetcher,
      headers: { Authorization: 'Bearer token' },
      fallback: [],
      parse: () => [],
    });

    await store.save([{ id: 'one' }]);

    expect(fetcher).toHaveBeenCalledWith('/api/items', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{ id: 'one' }]),
    });
  });

  it('clears arrays with DELETE requests', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    const store = createApiArrayStore({
      endpoint: '/api/items',
      fetcher,
      fallback: [],
      parse: () => [],
    });

    await store.clear();

    expect(fetcher).toHaveBeenCalledWith('/api/items', {
      method: 'DELETE',
      headers: undefined,
    });
  });

  it('throws readable errors for failed API requests', async () => {
    const fetcher = vi.fn(
      async () => new Response('Nope', { status: 500, statusText: 'Server Error' }),
    );
    const store = createApiArrayStore({
      endpoint: '/api/items',
      fetcher,
      fallback: [],
      parse: () => [],
    });

    await expect(store.load()).rejects.toThrowError('/api/items failed with 500 Server Error');
  });

  it('falls back when load returns non-array JSON', async () => {
    const fetcher = vi.fn(async () => response({ data: [] }));
    const store = createApiArrayStore({
      endpoint: '/api/items',
      fetcher,
      fallback: [{ id: 'fallback' }],
      parse: (payload) => (Array.isArray(payload) ? (payload as { id: string }[]) : []),
    });

    await expect(store.load()).resolves.toEqual([{ id: 'fallback' }]);
  });
});
