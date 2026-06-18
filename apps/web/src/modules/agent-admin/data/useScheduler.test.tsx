// useScheduler.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScheduledTasks } from './useScheduler';

let container: HTMLDivElement;
let root: Root;

describe('useScheduledTasks', () => {
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

  it('fetches tasks and returns them via the hook', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: 't1', name: 'X' }],
            total: 1,
            page: 1,
            pageSize: 100,
            totalPages: 1,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let captured: {
      isSuccess: boolean;
      data: { data: { id: string; name: string }[] } | undefined;
    } = {
      isSuccess: false,
      data: undefined,
    };

    function Harness() {
      const result = useScheduledTasks();
      captured = {
        isSuccess: result.isSuccess,
        data: result.data as { data: { id: string; name: string }[] } | undefined,
      };
      return null;
    }

    await act(async () => {
      root.render(
        <QueryClientProvider client={qc}>
          <Harness />
        </QueryClientProvider>,
      );
    });

    // Wait for the async query to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(captured.isSuccess).toBe(true);
    expect(captured.data?.data[0]?.id).toBe('t1');
  });
});
