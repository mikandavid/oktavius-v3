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

import { SupportInboxPage } from './SupportInboxPage';

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useAppShellLayout: () => ({ isSidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
  useRegisterFillHeightPage: vi.fn(),
  useRegisterSecondaryNav: vi.fn(),
}));

// The 'support' namespace is lazy-loaded; make it immediately ready in tests
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
    vi.fn().mockImplementation((url: string) => {
      if (url.includes('/stats')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ data: [], total: 0, page: 1, page_size: 50 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }),
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

describe('SupportInboxPage', () => {
  it('renders the inbox title', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support/inbox']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SupportInboxPage />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    // TestI18nProvider renders keys as [namespace.key] when the i18n mock
    // replaces usePreloadNamespaces; the inbox title key must be present.
    expect(container.textContent).toContain('support.inboxTitle');
  });
});
