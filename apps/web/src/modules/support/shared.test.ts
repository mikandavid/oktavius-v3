import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { SupportTicket } from './data/types';
import { ticketColumns, ticketFilters, toTicketRow } from './shared';

const t = (k: string) => k;

const base: SupportTicket = {
  id: 'abc123def456',
  orgId: 'o1',
  orgName: 'Org',
  userId: 'u1',
  userEmail: 'a@b.c',
  userName: 'Anna',
  subject: 'Login broken',
  message: 'It fails',
  category: 'bug',
  status: 'open',
  priority: 'urgent',
  tags: [],
  source: 'web',
  resolutionMessage: null,
  resolvedAt: null,
  resolvedBy: null,
  assigneeUserId: null,
  assigneeName: null,
  automationStatus: null,
  automationPrUrl: null,
  automationBranchName: null,
  automationWorkflowRunUrl: null,
  automationError: null,
  currentPageUrl: null,
  agentConversationId: null,
  createdAt: '2026-06-16T00:00:00Z',
  updatedAt: '2026-06-16T00:00:00Z',
};

describe('toTicketRow statusGroup', () => {
  it('maps open and in_progress to "open"', () => {
    expect(toTicketRow({ ...base, status: 'open' }, t).statusGroup).toBe('open');
    expect(toTicketRow({ ...base, status: 'in_progress' }, t).statusGroup).toBe('open');
  });
  it('maps resolved and closed to "closed"', () => {
    expect(toTicketRow({ ...base, status: 'resolved' }, t).statusGroup).toBe('closed');
    expect(toTicketRow({ ...base, status: 'closed' }, t).statusGroup).toBe('closed');
  });
  it('uses requester name fallback to email', () => {
    expect(toTicketRow({ ...base, userName: null }, t).requester).toBe('a@b.c');
  });
});

function html(node: unknown): string {
  return renderToStaticMarkup(node as ReactElement);
}

describe('ticketFilters', () => {
  it('admin has status/priority/category', () => {
    expect(ticketFilters({ t, admin: true }).map((f) => f.key)).toEqual([
      'status',
      'priority',
      'category',
    ]);
  });
  it('requester has status only', () => {
    expect(ticketFilters({ t, admin: false }).map((f) => f.key)).toEqual(['status']);
  });
});

describe('ticketColumns', () => {
  const isUnread = (r: { id: string }) => r.id === 'unread';
  it('admin includes a priority column', () => {
    expect(ticketColumns({ t, admin: true, isUnread }).map((c) => c.key)).toEqual([
      'subject',
      'status',
      'priority',
      'categoryLabel',
      'updatedAt',
    ]);
  });
  it('requester omits the priority column', () => {
    expect(ticketColumns({ t, admin: false, isUnread }).map((c) => c.key)).toEqual([
      'subject',
      'status',
      'categoryLabel',
      'updatedAt',
    ]);
  });
  it('subject cell shows the unread dot only when unread', () => {
    const subject = ticketColumns({ t, admin: true, isUnread }).find((c) => c.key === 'subject')!;
    expect(html(subject.render!(toTicketRow({ ...base, id: 'unread' }, t)))).toContain(
      'support.unreadIndicator',
    );
    expect(html(subject.render!(toTicketRow({ ...base, id: 'read' }, t)))).not.toContain(
      'support.unreadIndicator',
    );
  });
  it('status cell renders the localized status label key', () => {
    const status = ticketColumns({ t, admin: true, isUnread }).find((c) => c.key === 'status')!;
    expect(html(status.render!(toTicketRow({ ...base, status: 'open' }, t)))).toContain(
      'support.statusLabel_open',
    );
  });
  it('priority cell renders the localized priority label key', () => {
    const priority = ticketColumns({ t, admin: true, isUnread }).find((c) => c.key === 'priority')!;
    expect(html(priority.render!(toTicketRow({ ...base, priority: 'urgent' }, t)))).toContain(
      'support.priorityLabel_urgent',
    );
  });
});
