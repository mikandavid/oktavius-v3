// AutomationDetail.test.tsx
// Project-standard pattern: createRoot + act (no @testing-library/react).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { AutomationDetail } from './AutomationDetail';

let container: HTMLDivElement;
let root: Root;

/** Build a minimal ScheduledTask fixture */
function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    name: 'Daily Digest',
    description: null,
    scope: 'org',
    ownerUserId: null,
    enabled: true,
    scheduleType: 'cron',
    scheduleExpression: '0 8 * * *',
    timezone: 'UTC',
    nextRunAt: '2026-07-01T08:00:00Z',
    lastRunAt: '2026-06-18T08:00:00Z',
    targetType: 'orchestration_event',
    targetPayload: { eventType: 'agent_activation', prompt: 'Summarize daily reports' },
    triggerConfig: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-18T00:00:00Z',
    ...overrides,
  };
}

/** Build a minimal ScheduledTaskRun fixture */
function makeRun(overrides: Record<string, unknown> = {}) {
  return {
    id: 'run-1',
    taskId: 'task-1',
    scheduledFor: '2026-06-18T08:00:00Z',
    startedAt: '2026-06-18T08:00:01Z',
    finishedAt: '2026-06-18T08:01:00Z',
    status: 'completed',
    attemptCount: 1,
    targetRef: null,
    conversationId: null,
    userError: null,
    metadata: {},
    createdAt: '2026-06-18T08:00:00Z',
    ...overrides,
  };
}

describe('AutomationDetail', () => {
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

  function makeMockResponse(jsonValue: unknown) {
    return {
      ok: true,
      status: 200,
      json: (): Promise<unknown> => Promise.resolve(jsonValue),
      text: (): Promise<string> => Promise.resolve(''),
    };
  }

  function stubFetch(task: Record<string, unknown>, runs: Record<string, unknown>[]) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const urlStr = String(url);
        // Runs endpoint
        if (urlStr.includes('/runs')) {
          return makeMockResponse({
            data: runs,
            total: runs.length,
            page: 1,
            pageSize: 50,
            totalPages: 1,
          });
        }
        // Single task endpoint
        if (urlStr.includes('/scheduler/')) {
          return makeMockResponse(task);
        }
        // Tasks list fallback
        return makeMockResponse({ data: [task], total: 1, page: 1, pageSize: 100, totalPages: 1 });
      }) as unknown as typeof fetch,
    );
  }

  it('renders the task name in the detail card', async () => {
    const task = makeTask();
    stubFetch(task, []);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <AutomationDetail taskId="task-1" onBack={() => {}} onEdit={() => {}} />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    expect(container.textContent).toContain('Daily Digest');
  });

  it('renders run-history-header and a run timestamp for a recurring task', async () => {
    const task = makeTask({ scheduleType: 'cron' });
    const run = makeRun({ finishedAt: '2026-06-18T08:01:00Z' });
    stubFetch(task, [run]);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <AutomationDetail taskId="task-1" onBack={() => {}} onEdit={() => {}} />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    // Run history header present
    const header = container.querySelector('[data-testid="run-history-header"]');
    expect(header).not.toBeNull();

    // At least one run timestamp row present
    const timestamps = container.querySelectorAll('[data-testid="run-timestamp"]');
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('does NOT render run-history-header for a once task', async () => {
    const task = makeTask({
      scheduleType: 'once',
      nextRunAt: null,
      lastRunAt: '2026-06-18T08:00:00Z',
    });
    stubFetch(task, []);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <AutomationDetail taskId="task-1" onBack={() => {}} onEdit={() => {}} />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    const header = container.querySelector('[data-testid="run-history-header"]');
    expect(header).toBeNull();
  });
});
