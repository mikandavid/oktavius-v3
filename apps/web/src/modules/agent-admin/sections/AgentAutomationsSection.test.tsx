// AgentAutomationsSection.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { AgentAutomationsSection } from './AgentAutomationsSection';

let container: HTMLDivElement;
let root: Root;

describe('AgentAutomationsSection', () => {
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

  it('switches from list to detail when a task row is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        const url = String(input);
        let body: unknown;
        if (url.includes('/runs')) {
          body = { data: [], total: 0, page: 1, pageSize: 50, totalPages: 1 };
        } else if (/\/scheduler\/t1$/.test(url)) {
          body = {
            id: 't1',
            name: 'Daily digest',
            scheduleType: 'cron',
            scheduleExpression: '0 8 * * *',
            enabled: true,
            scope: 'org',
            ownerUserId: null,
            description: null,
            timezone: 'UTC',
            nextRunAt: null,
            lastRunAt: null,
            targetType: 'orchestration_event',
            targetPayload: {},
            triggerConfig: null,
            createdAt: '',
            updatedAt: '',
          };
        } else {
          body = {
            data: [
              {
                id: 't1',
                name: 'Daily digest',
                scheduleType: 'cron',
                scheduleExpression: '0 8 * * *',
                enabled: true,
                nextRunAt: null,
                lastRunAt: null,
              },
            ],
            total: 1,
            page: 1,
            pageSize: 100,
            totalPages: 1,
          };
        }
        return { ok: true, status: 200, json: async () => body, text: async () => '' };
      }) as unknown as typeof fetch,
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <AgentAutomationsSection />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    // Wait for async queries to settle and the task list to render
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Verify the task name is visible in the list
    expect(container.textContent).toContain('Daily digest');

    // Find the table row (role="link") and click it to trigger navigation
    const row = container.querySelector('tr[role="link"]');
    expect(row).not.toBeNull();

    await act(async () => {
      row!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Wait for the detail view to render
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Assert the detail view is present
    const detailEl = container.querySelector('[data-testid="automation-detail"]');
    expect(detailEl).not.toBeNull();
  });
});
