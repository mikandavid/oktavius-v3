// AutomationsList.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { AutomationsList } from './AutomationsList';

let container: HTMLDivElement;
let root: Root;

describe('AutomationsList', () => {
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

  it('shows a scheduled task name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
        text: async () => '',
      })) as unknown as typeof fetch,
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <TestI18nProvider>
          <QueryClientProvider client={qc}>
            <AutomationsList onOpen={() => {}} onCreate={() => {}} />
          </QueryClientProvider>
        </TestI18nProvider>,
      );
    });

    // Wait for async queries to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.textContent).toContain('Daily digest');
  });
});
