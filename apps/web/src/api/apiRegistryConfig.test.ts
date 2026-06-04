import { describe, expect, it, vi } from 'vitest';

import type { DemoApiRegistry, ListResponse } from './demo-client';
import { createConfiguredApiRegistry, DEFAULT_HTTP_REGISTRY_ENDPOINTS } from './apiRegistryConfig';

type Row = { id: string; name: string };

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const demoRegistry = {
  clients: {
    list: vi.fn(),
  },
} as unknown as DemoApiRegistry;

const listResponse: ListResponse<Row> = {
  data: [{ id: 'row_1', name: 'Alpha' }],
  total: 1,
  totalPages: 1,
  page: 1,
  pageSize: 10,
};

describe('API registry configuration', () => {
  it('keeps the demo registry when no production base URL is configured', () => {
    expect(createConfiguredApiRegistry({ demoRegistry, env: {} })).toBe(demoRegistry);
  });

  it('creates an HTTP registry when a production base URL is configured', async () => {
    const fetcher = vi.fn(async () => response(listResponse));
    const registry = createConfiguredApiRegistry({
      demoRegistry,
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: 'https://api.example.test/v1',
      },
    });

    await expect(registry.clients.list({ page: '1' })).resolves.toEqual(listResponse);
    expect(fetcher).toHaveBeenCalledWith('https://api.example.test/v1/clients?page=1', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('passes configured bearer tokens to HTTP registry requests', async () => {
    const fetcher = vi.fn(async () => response(listResponse));
    const registry = createConfiguredApiRegistry({
      demoRegistry,
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: '/api',
        VITE_OKTAVIUS_API_TOKEN: 'secret',
      },
    });

    await registry.products.list({});

    expect(fetcher).toHaveBeenCalledWith('/api/products', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret' },
    });
  });

  it('documents the generated default endpoint map', () => {
    expect(DEFAULT_HTTP_REGISTRY_ENDPOINTS).toMatchObject({
      clients: '/clients',
      products: '/products',
      cases: '/cases',
      users: '/users',
    });
  });
});
