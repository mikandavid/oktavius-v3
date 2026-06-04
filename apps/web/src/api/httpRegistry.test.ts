import { describe, expect, it, vi } from 'vitest';

import { ApiAuthorizationError, ApiValidationError, type ListResponse } from './demo-client';
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
});
