import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { IssueList } from './IssueList';
import type { TicketRow } from './shared';

function makeRow(id: string): TicketRow {
  return {
    id,
    orgId: 'o1',
    orgName: 'Org',
    userId: 'u1',
    userEmail: 'a@b.c',
    userName: 'Anna',
    subject: `Subject ${id}`,
    message: 'msg',
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
    requester: 'Anna',
    statusLabel: 'Open',
    priorityLabel: 'Urgent',
    categoryLabel: 'Bug',
    statusGroup: 'open',
  };
}

const baseProps = {
  isLoading: false,
  emptyText: 'No tickets',
  onOpenTicket: () => {},
  page: 1,
  pageSize: 20,
  total: 2,
  totalPages: 1,
  onPageChange: () => {},
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('IssueList', () => {
  it('passes unread through to rows for which isUnread returns true', () => {
    const rows = [makeRow('aaaaaa1'), makeRow('bbbbbb2')];
    act(() => {
      root.render(
        <IssueList {...baseProps} rows={rows} isUnread={(row) => row.id === 'aaaaaa1'} />,
      );
    });
    const dots = container.querySelectorAll('[aria-label="Unread activity"]');
    expect(dots.length).toBe(1);
  });

  it('marks no rows unread when isUnread is omitted', () => {
    const rows = [makeRow('aaaaaa1'), makeRow('bbbbbb2')];
    act(() => {
      root.render(<IssueList {...baseProps} rows={rows} />);
    });
    const dots = container.querySelectorAll('[aria-label="Unread activity"]');
    expect(dots.length).toBe(0);
  });
});
