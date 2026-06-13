import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { StoragePage } from './StoragePage';

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useAppShellLayout: () => ({ isSidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
  useRegisterFillHeightPage: vi.fn(),
  useRegisterSecondaryNav: vi.fn(),
}));

// The 'storage' namespace is lazy-loaded; make it immediately ready in tests
// by forwarding everything from the real module except usePreloadNamespaces.
vi.mock('@/core/i18n', async (importOriginal) => {
  const real = await importOriginal();
  return { ...(real as object), usePreloadNamespaces: () => ({ ready: true }) };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
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
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('StoragePage', () => {
  it('renders the rail and main pane', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/storage']}>
          <QueryClientProvider client={queryClient}>
            <TestI18nProvider>
              <StoragePage />
            </TestI18nProvider>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });
    expect(container.querySelector('[data-testid="storage-rail"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="storage-main"]')).not.toBeNull();
  });
});
