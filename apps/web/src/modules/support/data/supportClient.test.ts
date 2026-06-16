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

  it('lists attachments and normalizes snake_case', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 'n1',
            parent_id: 'p1',
            node_type: 'file',
            name: 'report.pdf',
            mime_type: 'application/pdf',
            file_extension: 'pdf',
            file_size_bytes: 204800,
            upload_status: 'ready',
            trashed_at: null,
            purge_after_at: null,
            created_by: 'u1',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
      }),
    );

    const client = createSupportClient({ baseUrl: BASE });
    const result = await client.listAttachments('t1');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('n1');
    expect(result[0]!.parentId).toBe('p1');
    expect(result[0]!.nodeType).toBe('file');
    expect(result[0]!.mimeType).toBe('application/pdf');
    expect(result[0]!.fileSizeBytes).toBe(204800);
    expect(result[0]!.fileExtension).toBe('pdf');
    expect(result[0]!.uploadStatus).toBe('ready');
    expect(result[0]!.createdAt).toBe('2026-01-01T00:00:00Z');
  });

  describe('triage mutations', () => {
    it('updateStatus PATCHes the ticket with status only', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          id: 't1',
          status: 'in_progress',
          user_id: 'u1',
          user_email: 'a@b.c',
          subject: 's',
          message: 'm',
          category: 'bug',
          priority: 'normal',
          source: 'web',
          tags: [],
          created_at: '',
          updated_at: '',
        }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      const ticket = await client.updateStatus('t1', 'in_progress');
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toContain('/support/tickets/t1');
      expect((init as RequestInit).method).toBe('PATCH');
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ status: 'in_progress' });
      expect(ticket.status).toBe('in_progress');
    });

    it('updatePriority PATCHes priority only', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          id: 't1',
          priority: 'high',
          user_id: 'u1',
          user_email: 'a@b.c',
          subject: 's',
          message: 'm',
          category: 'bug',
          status: 'open',
          source: 'web',
          tags: [],
          created_at: '',
          updated_at: '',
        }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      await client.updatePriority('t1', 'high');
      const [, init] = fetchMock.mock.calls[0]!;
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ priority: 'high' });
    });

    it('assign PATCHes assigneeUserId (null clears)', async () => {
      const ticketStub = {
        id: 't1',
        user_id: 'u1',
        user_email: 'a@b.c',
        subject: 's',
        message: 'm',
        category: 'bug',
        status: 'open',
        priority: 'normal',
        source: 'web',
        tags: [],
        created_at: '',
        updated_at: '',
      };
      fetchMock.mockResolvedValueOnce(jsonResponse(ticketStub));
      fetchMock.mockResolvedValueOnce(jsonResponse(ticketStub));
      const client = createSupportClient({ baseUrl: BASE });

      // positive case: assigning a user
      await client.assign('t1', 'u1');
      const [, initPositive] = fetchMock.mock.calls[0]!;
      expect(JSON.parse((initPositive as RequestInit).body as string)).toEqual({
        assigneeUserId: 'u1',
      });

      // null case: clearing the assignee
      await client.assign('t1', null);
      const [, initNull] = fetchMock.mock.calls[1]!;
      expect(JSON.parse((initNull as RequestInit).body as string)).toEqual({
        assigneeUserId: null,
      });
    });

    it('resolve POSTs to the resolve endpoint with the message', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          id: 't1',
          status: 'resolved',
          user_id: 'u1',
          user_email: 'a@b.c',
          subject: 's',
          message: 'm',
          category: 'bug',
          priority: 'normal',
          source: 'web',
          tags: [],
          created_at: '',
          updated_at: '',
        }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      await client.resolve('t1', 'Fixed in build 42.');
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toContain('/support/tickets/t1/resolve');
      expect((init as RequestInit).method).toBe('POST');
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        resolutionMessage: 'Fixed in build 42.',
      });
    });

    it('addComment forwards isInternal', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          id: 'c1',
          ticket_id: 't1',
          user_id: 'u1',
          message: 'internal note',
          is_internal: true,
          created_at: '',
          updated_at: '',
        }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      await client.addComment('t1', 'internal note', true);
      const [, init] = fetchMock.mock.calls[0]!;
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        message: 'internal note',
        isInternal: true,
      });
    });

    it('listAssignees normalizes the data array', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [{ user_id: 'u1', name: 'Ada', email: 'ada@x.io' }] }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      const assignees = await client.listAssignees();
      const url = fetchMock.mock.calls[0]![0] as string;
      expect(url).toContain('/support/assignees');
      expect(assignees).toEqual([{ userId: 'u1', name: 'Ada', email: 'ada@x.io' }]);
    });

    it('normalizeTicket maps assignee + automation fields', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          id: 't1',
          user_id: 'u1',
          user_email: 'a@b.c',
          subject: 's',
          message: 'm',
          category: 'bug',
          status: 'open',
          priority: 'normal',
          source: 'web',
          tags: [],
          created_at: '',
          updated_at: '',
          assignee_user_id: 'u1',
          assignee_name: 'Ada',
          automation_status: 'pr_created',
          automation_pr_url: 'https://gh/pr/1',
        }),
      );
      const client = createSupportClient({ baseUrl: BASE });
      const ticket = await client.getTicket('t1');
      expect(ticket.assigneeUserId).toBe('u1');
      expect(ticket.assigneeName).toBe('Ada');
      expect(ticket.automationStatus).toBe('pr_created');
      expect(ticket.automationPrUrl).toBe('https://gh/pr/1');
    });
  });
});
