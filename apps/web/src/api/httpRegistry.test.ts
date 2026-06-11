import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOsirisApiFetcher } from '@/runtime/osiris/apiClient';

import { ApiAuthorizationError, ApiValidationError, type ListResponse } from './contracts';
import { createHttpEntityHandlers, createHttpRegistry } from './httpRegistry';

type Row = {
  id: string;
  name: string;
};

function response(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

const listResponse: ListResponse<Row> = {
  data: [{ id: 'row_1', name: 'Alpha' }],
  total: 1,
  totalPages: 1,
  page: 1,
  pageSize: 10,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HTTP registry adapters', () => {
  it('builds list requests with query params and parses list responses', async () => {
    const fetcher = vi.fn(async () => response(listResponse));
    const handlers = createHttpEntityHandlers<
      Row,
      { page?: string; search?: string },
      Omit<Row, 'id'>
    >({
      basePath: '/api/clients',
      fetcher,
    });

    await expect(handlers.list({ page: '2', search: 'alpha' })).resolves.toEqual(listResponse);
    expect(fetcher).toHaveBeenCalledWith('/api/clients?page=2&search=alpha', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('uses POST, PATCH, and DELETE for generated write contracts', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(response({ id: 'row_1', name: 'Created' }))
      .mockResolvedValueOnce(response({ id: 'row_1', name: 'Updated' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const handlers = createHttpEntityHandlers<Row, Record<string, string>, Omit<Row, 'id'>>({
      basePath: '/api/clients',
      fetcher,
      headers: { Authorization: 'Bearer token' },
    });

    await expect(handlers.create({ name: 'Created' })).resolves.toEqual({
      id: 'row_1',
      name: 'Created',
    });
    await expect(handlers.update('row_1', { name: 'Updated' })).resolves.toEqual({
      id: 'row_1',
      name: 'Updated',
    });
    await expect(handlers.delete('row_1')).resolves.toBeUndefined();

    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/clients', {
      method: 'POST',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Created' }),
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/clients/row_1', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });
    expect(fetcher).toHaveBeenNthCalledWith(3, '/api/clients/row_1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer token' },
    });
  });

  it('normalizes backend validation errors into ApiValidationError', async () => {
    const fetcher = vi.fn(async () =>
      response(
        { message: 'Client could not be saved.', errors: { email: 'Already used.' } },
        { status: 422, statusText: 'Unprocessable Entity' },
      ),
    );
    const handlers = createHttpEntityHandlers<Row, Record<string, string>, Omit<Row, 'id'>>({
      basePath: '/api/clients',
      fetcher,
    });

    await expect(handlers.create({ name: 'Alpha' })).rejects.toMatchObject({
      name: 'ApiValidationError',
      message: 'Client could not be saved.',
      fieldErrors: { email: 'Already used.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('normalizes backend authorization errors into ApiAuthorizationError', async () => {
    const fetcher = vi.fn(async () =>
      response(
        { message: 'Forbidden.', requirement: 'deleteRecords' },
        { status: 403, statusText: 'Forbidden' },
      ),
    );
    const handlers = createHttpEntityHandlers<Row, Record<string, string>, Omit<Row, 'id'>>({
      basePath: '/api/clients',
      fetcher,
    });

    await expect(handlers.delete('row_1')).rejects.toMatchObject({
      name: 'ApiAuthorizationError',
      message: 'Forbidden.',
      requirement: 'deleteRecords',
    } satisfies Partial<ApiAuthorizationError>);
  });

  it('normalizes non-JSON authorization responses instead of surfacing JSON parse errors', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response('<html>Forbidden</html>', {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'Content-Type': 'text/html' },
        }),
    );
    const handlers = createHttpEntityHandlers<Row, Record<string, string>, Omit<Row, 'id'>>({
      basePath: '/api/clients',
      fetcher,
    });

    await expect(handlers.delete('row_1')).rejects.toMatchObject({
      name: 'ApiAuthorizationError',
      message: 'DELETE /api/clients/row_1 is not allowed.',
      requirement: 'unknown',
    } satisfies Partial<ApiAuthorizationError>);
  });

  it('creates a full generated registry from endpoint descriptors', async () => {
    const fetcher = vi.fn(async () => response(listResponse));
    const registry = createHttpRegistry({
      baseUrl: '/api',
      fetcher,
      endpoints: {
        clients: '/clients',
        products: '/products',
        cases: '/cases',
        orders: '/orders',
        invoices: '/invoices',
        contracts: '/contracts',
        incidents: '/incidents',
        projects: '/projects',
        users: '/users',
        organizations: '/organizations',
        parties: '/parties',
        caseChecklists: '/case-checklists',
        contacts: '/contacts',
        vendors: '/vendors',
        leads: '/leads',
        staff: '/staff',
        purchasing: '/purchasing',
      },
    });

    await registry.clients.list({ page: '1' });

    expect(fetcher).toHaveBeenCalledWith('/api/clients?page=1', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('adds Osiris auth and context headers through generated registry requests', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response(listResponse),
    );
    vi.stubGlobal('fetch', fetch);
    const registry = createHttpRegistry({
      baseUrl: '',
      fetcher: createOsirisApiFetcher({
        baseUrl: '/api',
        getAccessToken: () => 'token_1',
        getActiveOrgId: () => 'org_1',
        getActiveSiteId: () => 'site_1',
      }),
      endpoints: {
        clients: '/clients',
        products: '/products',
        cases: '/cases',
        orders: '/orders',
        invoices: '/invoices',
        contracts: '/contracts',
        incidents: '/incidents',
        projects: '/projects',
        users: '/users',
        organizations: '/organizations',
        parties: '/parties',
        caseChecklists: '/case-checklists',
        contacts: '/contacts',
        vendors: '/vendors',
        leads: '/leads',
        staff: '/staff',
        purchasing: '/purchasing',
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

  it('preserves absolute URLs in Osiris fetcher requests', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response(listResponse),
    );
    vi.stubGlobal('fetch', fetch);
    const fetcher = createOsirisApiFetcher({ baseUrl: '/api' });

    await fetcher('https://api.example.test/contacts', { method: 'GET' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/contacts',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('notifies the Osiris runtime when generated requests receive 401 responses', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response({ message: 'Unauthorized.' }, { status: 401, statusText: 'Unauthorized' }),
    );
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const fetcher = createOsirisApiFetcher({ baseUrl: '/api', onUnauthorized });

    await fetcher('/contacts', { method: 'GET' });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not expire the Osiris runtime for permission-only 403 responses', async () => {
    const fetch = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) =>
      response({ message: 'Forbidden.' }, { status: 403, statusText: 'Forbidden' }),
    );
    const onUnauthorized = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const fetcher = createOsirisApiFetcher({ baseUrl: '/api', onUnauthorized });

    await fetcher('/contacts', { method: 'GET' });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
