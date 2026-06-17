(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChangelogResult } from './types';
import { useChangelog } from './useChangelog';

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({ activeOrgId: 'o1' }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe('useChangelog', () => {
  it('fetches GET /changelog and returns parsed releases', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ releases: [{ version: '3.4.0', date: '2026-06-17', items: [] }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let captured: { isSuccess: boolean; data: ChangelogResult | undefined } = {
      isSuccess: false,
      data: undefined,
    };

    function Harness() {
      const result = useChangelog();
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

    const changelogCalls = fetchMock.mock.calls.filter(
      (c) =>
        typeof c[0] === 'string' &&
        new URL(c[0], 'http://localhost').pathname.endsWith('/changelog'),
    );
    expect(changelogCalls).toHaveLength(1);
    expect(captured.isSuccess).toBe(true);
    expect(captured.data?.releases[0]!.version).toBe('3.4.0');
  });
});
