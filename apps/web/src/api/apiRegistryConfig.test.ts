import { describe, expect, it, vi } from 'vitest';

import {
  createConfiguredApiRegistry,
  createOsirisApiRegistry,
  DEFAULT_HTTP_REGISTRY_ENDPOINTS,
} from './apiRegistryConfig';
import type { ListResponse } from './contracts';

type Row = { id: string; name: string };

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const listResponse: ListResponse<Row> = {
  data: [{ id: 'row_1', name: 'Alpha' }],
  total: 1,
  totalPages: 1,
  page: 1,
  pageSize: 10,
};

describe('API registry configuration', () => {
  it('throws when no production base URL is configured', () => {
    expect(() => createConfiguredApiRegistry({ env: {} })).toThrow(
      'VITE_OKTAVIUS_API_BASE_URL is required for API registry.',
    );
  });

  it('creates an HTTP registry when a production base URL is configured', async () => {
    const fetcher = vi.fn(async () => response(listResponse));
    const registry = createConfiguredApiRegistry({
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
      fetcher,
      env: {
        VITE_OKTAVIUS_API_BASE_URL: '/api',
        VITE_OKTAVIUS_API_TOKEN: 'secret',
      },
    });

    await registry.projects.list({});

    expect(fetcher).toHaveBeenCalledWith('/api/projects', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret' },
    });
  });

  it('creates an Osiris /v1 registry when no base URL is configured', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response(listResponse),
    );
    vi.stubGlobal('fetch', fetch);
    const registry = createOsirisApiRegistry({
      env: {},
      osiris: {
        getAccessToken: () => 'token_1',
        getActiveOrgId: () => 'org_1',
        getActiveSiteId: () => 'site_1',
      },
    });

    await registry.clients.list({ page: '1' });

    expect(fetch).toHaveBeenCalledWith(
      '/v1/clients?page=1',
      expect.objectContaining({
        credentials: 'include',
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
  });

  it('can build an Osiris dynamic fetcher registry', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response(listResponse),
    );
    vi.stubGlobal('fetch', fetch);
    const registry = createOsirisApiRegistry({
      env: {
        VITE_OKTAVIUS_API_BASE_URL: '/api',
      },
      osiris: {
        getAccessToken: () => 'token_1',
        getActiveOrgId: () => 'org_1',
        getActiveSiteId: () => 'site_1',
      },
    });

    await registry.contacts.list({ page: '1' });

    expect(fetch).toHaveBeenCalledWith(
      '/api/contacts?page=1',
      expect.objectContaining({
        credentials: 'include',
        method: 'GET',
        headers: expect.any(Headers),
      }),
    );
    const headers = fetch.mock.calls[0]?.[1]?.headers;
    expect(headers).toBeInstanceOf(Headers);
    if (!(headers instanceof Headers)) throw new Error('Expected fetch headers to be Headers.');
    expect(headers.get('Authorization')).toBe('Bearer token_1');
    expect(headers.get('X-Org-Id')).toBe('org_1');
    expect(headers.get('X-Site-Id')).toBe('site_1');
  });

  it('keeps the default endpoint map override-only (endpoints derive from resource keys)', () => {
    expect(DEFAULT_HTTP_REGISTRY_ENDPOINTS).toEqual({});
  });
});
