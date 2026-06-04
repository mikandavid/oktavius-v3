import { describe, expect, it } from 'vitest';

import type { ClientRecord } from '@/app/demo-data';
import { ApiValidationError } from '@/api/demo-client';

import { buildClientsDemoHandlers } from './clients';

const baseClient: ClientRecord = {
  id: 'cli_1',
  orgId: 'org_1',
  name: 'Existing Client',
  type: 'company',
  industry: 'Technology',
  status: 'active',
  email: 'existing@example.com',
  phone: '',
  website: '',
  country: 'AT',
  city: 'Vienna',
  tags: [],
  notes: '',
  annualRevenue: '',
  contractStart: '',
  contractEnd: '',
  accountManager: '',
  createdAt: '2026-01-01',
};

function createHandlers(seed: ClientRecord[] = [baseClient]) {
  let clients = seed;
  return {
    handlers: buildClientsDemoHandlers({
      activeOrgId: 'org_1',
      getClients: () => clients,
      setClients: (next) => {
        clients = typeof next === 'function' ? next(clients) : next;
      },
    }),
    getClients: () => clients,
  };
}

describe('buildClientsDemoHandlers', () => {
  it('returns paged, sorted list responses with server totals', async () => {
    const { handlers } = createHandlers([
      { ...baseClient, id: 'cli_1', name: 'Bravo Client', status: 'active' },
      {
        ...baseClient,
        id: 'cli_2',
        name: 'Alpha Client',
        status: 'prospect',
        email: 'alpha@example.com',
      },
      {
        ...baseClient,
        id: 'cli_3',
        name: 'Charlie Client',
        status: 'inactive',
        email: 'charlie@example.com',
      },
    ]);

    await expect(handlers.list({ page: '1', pageSize: '2', sort: 'name' })).resolves.toMatchObject({
      data: [
        expect.objectContaining({ id: 'cli_2', name: 'Alpha Client' }),
        expect.objectContaining({ id: 'cli_1', name: 'Bravo Client' }),
      ],
      total: 3,
      totalPages: 2,
      page: 1,
      pageSize: 2,
    });
  });

  it('applies search and filter params before pagination', async () => {
    const { handlers } = createHandlers([
      { ...baseClient, id: 'cli_1', name: 'Apex Client', status: 'active' },
      {
        ...baseClient,
        id: 'cli_2',
        name: 'Kunz Contact',
        status: 'prospect',
        email: 'kunz@example.com',
      },
      {
        ...baseClient,
        id: 'cli_3',
        name: 'Kunz Supplier',
        status: 'active',
        email: 'supplier@example.com',
      },
    ]);

    const result = await handlers.list({
      page: '1',
      pageSize: '10',
      sort: '-name',
      search: 'kunz',
      status: 'active',
    });

    expect(result).toMatchObject({
      data: [expect.objectContaining({ id: 'cli_3', name: 'Kunz Supplier' })],
      total: 1,
      totalPages: 1,
      page: 1,
    });
  });

  it('rejects duplicate client emails with field-level validation errors', async () => {
    const { handlers } = createHandlers();

    await expect(
      handlers.create({
        ...baseClient,
        name: 'Duplicate Client',
        email: ' Existing@Example.com ',
      }),
    ).rejects.toMatchObject({
      name: 'ApiValidationError',
      fieldErrors: { email: 'A client with this email already exists.' },
    } satisfies Partial<ApiValidationError>);
  });

  it('creates clients through the API registry contract', async () => {
    const { getClients, handlers } = createHandlers([]);
    const unsafeInput = {
      ...baseClient,
      id: 'ignored',
      name: 'New Client',
      email: 'new@example.com',
    } as unknown as Parameters<typeof handlers.create>[0];

    const created = await handlers.create(unsafeInput);

    expect(created.id).toMatch(/^cli_/);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getClients()).toEqual([created]);
  });
});
