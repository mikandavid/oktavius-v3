// useSupportData.test.tsx
// Note: @testing-library/react is not installed in this repo.
// We use the project-standard pattern: createRoot + act from react-dom/client.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TicketListResult } from './types';
import { useSupportTickets } from './useSupportData';

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
