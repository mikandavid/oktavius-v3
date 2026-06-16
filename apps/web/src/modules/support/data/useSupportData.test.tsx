// useSupportData.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SupportAssignee, TicketListResult } from './types';
import { useSupportAssignees, useSupportMutations, useSupportTickets } from './useSupportData';

let container: HTMLDivElement;
let root: Root;

interface CaptureProps {
  onResult: (r: { isSuccess: boolean; data: TicketListResult | undefined }) => void;
}

function Capture({ onResult }: CaptureProps) {
  const result = useSupportTickets({ page: 1, pageSize: 12 });
  onResult({ isSuccess: result.isSuccess, data: result.data });
  return null;
}

function makeFakeTicket() {
  return {
    id: 't1',
    org_id: null,
    org_name: null,
    user_id: 'u1',
    user_email: 'a@b.com',
    user_name: null,
    subject: 'Test',
    message: 'msg',
    category: 'bug',
    status: 'resolved',
    priority: 'normal',
    tags: [],
    source: 'web',
    resolution_message: null,
    resolved_at: null,
    resolved_by: null,
    assignee_user_id: null,
    assignee_name: null,
    automation_status: null,
    automation_pr_url: null,
    automation_branch_name: null,
    automation_workflow_run_url: null,
    automation_error: null,
    current_page_url: null,
    agent_conversation_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

describe('useSupportTickets', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0, page: 1, page_size: 12 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('fetches the ticket list', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let captured: { isSuccess: boolean; data: TicketListResult | undefined } = {
      isSuccess: false,
      data: undefined,
    };

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Capture
            onResult={(r) => {
              captured = r;
            }}
          />
        </QueryClientProvider>,
      );
    });

    // Wait for the async query to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(captured.isSuccess).toBe(true);
    expect(captured.data?.total).toBe(0);
  });
});

describe('useSupportMutations — updateStatus', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('calls client.updateStatus with the correct arguments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeFakeTicket()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    let mutations: ReturnType<typeof useSupportMutations> | undefined;

    function Harness() {
      mutations = useSupportMutations();
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutations!.updateStatus.mutateAsync({ ticketId: 't1', status: 'resolved' });
    });

    const calls = fetchMock.mock.calls;
    const patchCall = calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        new URL(c[0], 'http://localhost').pathname.endsWith('/support/tickets/t1') &&
        c[1]?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall![1].body as string)).toEqual({ status: 'resolved' });
  });
});

describe('useSupportMutations — resolve', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('calls client.resolve with the correct arguments', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeFakeTicket()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    let mutations: ReturnType<typeof useSupportMutations> | undefined;

    function Harness() {
      mutations = useSupportMutations();
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutations!.resolve.mutateAsync({ ticketId: 't1', resolutionMessage: 'done' });
    });

    const calls = fetchMock.mock.calls;
    const postCall = calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        c[0].includes('/support/tickets/t1/resolve') &&
        c[1]?.method === 'POST',
    );
    expect(postCall).toBeDefined();
    expect(JSON.parse(postCall![1].body as string)).toEqual({ resolutionMessage: 'done' });
  });
});

describe('useSupportMutations — assign (null/unassign)', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('issues PATCH to /support/tickets/t1 with body { assigneeUserId: null }', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeFakeTicket()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    let mutations: ReturnType<typeof useSupportMutations> | undefined;

    function Harness() {
      mutations = useSupportMutations();
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutations!.assign.mutateAsync({ ticketId: 't1', assigneeUserId: null });
    });

    const calls = fetchMock.mock.calls;
    const patchCall = calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        new URL(c[0], 'http://localhost').pathname.endsWith('/support/tickets/t1') &&
        c[1]?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall![1].body as string)).toEqual({ assigneeUserId: null });
  });
});

describe('useSupportMutations — updatePriority', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('issues PATCH to /support/tickets/t1 with body { priority: "high" }', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(makeFakeTicket()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    let mutations: ReturnType<typeof useSupportMutations> | undefined;

    function Harness() {
      mutations = useSupportMutations();
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await mutations!.updatePriority.mutateAsync({ ticketId: 't1', priority: 'high' });
    });

    const calls = fetchMock.mock.calls;
    const patchCall = calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        new URL(c[0], 'http://localhost').pathname.endsWith('/support/tickets/t1') &&
        c[1]?.method === 'PATCH',
    );
    expect(patchCall).toBeDefined();
    expect(JSON.parse(patchCall![1].body as string)).toEqual({ priority: 'high' });
  });
});

describe('useSupportAssignees — enabled', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('fetches GET /support/assignees and returns parsed data', async () => {
    const fakeAssignees: SupportAssignee[] = [
      { userId: 'u1', name: 'Alice', email: 'alice@example.com' },
    ];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: fakeAssignees }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let captured: { isSuccess: boolean; data: SupportAssignee[] | undefined } = {
      isSuccess: false,
      data: undefined,
    };

    function Harness() {
      const result = useSupportAssignees(true);
      captured = { isSuccess: result.isSuccess, data: result.data };
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const assigneesCalls = fetchMock.mock.calls.filter(
      (c) =>
        typeof c[0] === 'string' &&
        new URL(c[0], 'http://localhost').pathname.endsWith('/support/assignees'),
    );
    expect(assigneesCalls).toHaveLength(1);
    expect(captured.isSuccess).toBe(true);
    expect(captured.data).toEqual(fakeAssignees);
  });
});

describe('useSupportAssignees — disabled', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('does not call listAssignees when disabled', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    function Harness() {
      useSupportAssignees(false);
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const assigneesCalls = fetchMock.mock.calls.filter(
      (c) => typeof c[0] === 'string' && c[0].includes('/support/assignees'),
    );
    expect(assigneesCalls).toHaveLength(0);
  });
});
