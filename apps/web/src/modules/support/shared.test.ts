import { describe, expect, it } from 'vitest';

import type { SupportTicket } from './data/types';
import { toTicketRow } from './shared';

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
