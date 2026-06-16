import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createContactsClient } from './contactsClient';

const BASE = 'https://api.test';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('contactsClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists contacts and normalizes snake_case fields', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 'c1',
            org_id: 'o1',
            name: 'Maria Huber',
            is_business: false,
            email: 'm@h.at',
            address_line1: 'Hauptstr. 1',
            postal_code: '1010',
            category_ids: ['cat1'],
            tags: ['vip'],
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        totalPages: 1,
      }),
    );

    const client = createContactsClient({ baseUrl: BASE });
    const result = await client.listContacts({ page: 1, pageSize: 100, sort: '-created_at' });

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('/contacts?');
    expect(url).toContain('pageSize=100');
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: 'c1',
      orgId: 'o1',
      isBusiness: false,
      addressLine1: 'Hauptstr. 1',
      postalCode: '1010',
      categoryIds: ['cat1'],
      tags: ['vip'],
    });
  });

  it('sends a camelCase payload on create and normalizes the response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ id: 'c2', name: 'Acme GmbH', is_business: true }),
    );
    const client = createContactsClient({ baseUrl: BASE });
    const created = await client.createContact({
      name: 'Acme GmbH',
      isBusiness: true,
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      linkedin: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      clientCode: '',
      categoryIds: ['cat1'],
      tags: [],
      notes: '',
    });

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ name: 'Acme GmbH', isBusiness: true, categoryIds: ['cat1'] });
    expect(created).toMatchObject({ id: 'c2', isBusiness: true });
  });

  it('throws with the server message on a failed request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 500));
    const client = createContactsClient({ baseUrl: BASE });
    await expect(client.getContact('x')).rejects.toThrow('nope');
  });

  it('issues a DELETE for a contact', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const client = createContactsClient({ baseUrl: BASE });
    await client.deleteContact('c9');
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain('/contacts/c9');
    expect((init as RequestInit).method).toBe('DELETE');
    expect((init as RequestInit).credentials).toBe('include');
  });
});
