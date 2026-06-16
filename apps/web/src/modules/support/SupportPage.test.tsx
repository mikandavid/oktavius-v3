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

import { SupportPage } from './SupportPage';

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

// Default: non-superadmin runtime (no toggle shown).
vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('SupportPage — non-superadmin', () => {
  it('renders the report problem button and the issue list (no toggle)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SupportPage />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    // TestI18nProvider renders keys as [namespace.key]; the report button must be present.
    expect(container.textContent).toContain('support.reportProblem');
    // Old toggle keys must be gone.
    expect(container.textContent).not.toContain('support.viewMine');
    expect(container.textContent).not.toContain('support.viewInbox');
    // CRUD list rendered (FilterToolbar search input present); old counts gone.
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.textContent).not.toContain('support.countOpen');
  });
});

describe('SupportPage — superadmin', () => {
  it('renders the issues board with no toggle and no report button', async () => {
    // Override the runtime mock for this describe block to return a superadmin.
    vi.doMock('@/runtime/osiris/useOsirisRuntime', () => ({
      useOptionalOsirisRuntime: () => ({
        activeOrgId: 'o1',
        permissionSubject: { isSuperadmin: true, role: 'admin', permissions: [] },
      }),
    }));

    // Dynamically import SupportPage after the override is in place.
    const { SupportPage: SuperSupportPage } = await import('./SupportPage');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SuperSupportPage />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    // Superadmin board title present, no report button, no old toggle.
    expect(container.textContent).toContain('support.issuesTitle');
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.textContent).not.toContain('support.countOpen');
    expect(container.textContent).not.toContain('support.reportProblem');
    expect(container.textContent).not.toContain('support.viewInbox');
  });
});
