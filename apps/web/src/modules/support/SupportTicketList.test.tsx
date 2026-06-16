// jsdom does not ship ResizeObserver; CrudTable needs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { SupportTicketList } from './SupportTicketList';

// Non-superadmin runtime is sufficient; CrudListShell only reads permissionSubject.
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

vi.mock('./data/useSupportData', () => ({
  useSupportTickets: () => ({
    data: {
      data: [
        {
          id: 't1',
          orgId: null,
          orgName: null,
          userId: 'u1',
          userEmail: 'ada@x.io',
          userName: 'Ada',
          subject: 'Login broken',
          message: 'help',
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
          createdAt: '2026-06-16T09:00:00Z',
          updatedAt: '2026-06-16T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    },
    isLoading: false,
  }),
}));

vi.mock('./data/useSupportUnread', () => ({
  useSupportUnread: () => ({ isUnread: () => false, markSeen: vi.fn() }),
}));

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
  container.remove();
});

describe('SupportTicketList', () => {
  it('mounts and feeds the ticket through the list (toolbar + pagination)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SupportTicketList admin onOpenTicket={vi.fn()} />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });

    // lytenyte-core (the virtualized grid used by CrudTable) does not emit standard
    // DOM text nodes for cell content in jsdom, so the ticket subject is not visible
    // in textContent. Assert instead on (a) the FilterToolbar search input rendering
    // and (b) the pagination summary "1-1 of 1", which proves the mocked ticket was
    // converted via toTicketRow, passed through useListPageState, and reached
    // CrudListShell — i.e. a real render of the component, not just a mount.
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.textContent).toContain('1-1 of 1');
  });
});
