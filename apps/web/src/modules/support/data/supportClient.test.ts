import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupportClient } from './supportClient';

const BASE = 'https://api.example.test/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createSupportClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists tickets, builds query string and normalizes snake_case', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 't1',
            org_id: 'o1',
            org_name: 'Acme',
            user_id: 'u1',
            user_email: 'a@b.c',
            user_name: 'A B',
            subject: 'Upload fails',
            message: 'big pdf',
            category: 'bug',
            status: 'open',
            priority: 'urgent',
            tags: ['x'],
            source: 'web',
            resolution_message: null,
            resolved_at: null,
            resolved_by: null,
            current_page_url: null,
            agent_conversation_id: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 12,
      }),
    );

    const client = createSupportClient({ baseUrl: BASE });
    const result = await client.listTickets({
      page: 1,
      pageSize: 12,
      status: 'open',
      sort: '-updated_at',
    });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain(`${BASE}/support/tickets?`);
    expect(url).toContain('status=open');
    expect(url).toContain('sort=-updated_at');
    expect(result.total).toBe(1);
    expect(result.data[0]!.orgName).toBe('Acme');
    expect(result.data[0]!.priority).toBe('urgent');
  });

  it('creates a ticket with a JSON body', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 't2',
        subject: 'New',
        message: 'm',
        category: 'other',
        status: 'open',
        priority: 'normal',
        source: 'web',
        tags: [],
        created_at: '',
        updated_at: '',
        user_id: 'u',
        user_email: 'e',
      }),
    );
    const client = createSupportClient({ baseUrl: BASE });
    const ticket = await client.createTicket({ subject: 'New', message: 'm', category: 'other' });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      subject: 'New',
      category: 'other',
    });
    expect(ticket.id).toBe('t2');
  });

  it('uploads attachments as multipart form data', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = createSupportClient({ baseUrl: BASE });
    const file = new File(['x'], 'log.txt', { type: 'text/plain' });
    await client.uploadAttachments('t1', [file]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain(`${BASE}/support/tickets/t1/attachments`);
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('updateStatus throws NOT_IMPLEMENTED (scaffold)', async () => {
    const client = createSupportClient({ baseUrl: BASE });
    await expect(client.updateStatus('t1', 'resolved')).rejects.toThrow('NOT_IMPLEMENTED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
