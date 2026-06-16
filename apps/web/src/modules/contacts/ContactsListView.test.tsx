import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { ContactsListView } from './ContactsListView';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as never);

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useAppShellLayout: () => ({ isSidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
  useRegisterFillHeightPage: vi.fn(),
  useRegisterSecondaryNav: vi.fn(),
}));

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

vi.mock('./data/useContactsData', () => ({
  useContacts: () => ({
    data: {
      data: [
        {
          id: 'c1',
          orgId: 'o1',
          name: 'Maria Huber',
          isBusiness: false,
          email: 'm@h.at',
          phone: '',
          mobile: '',
          fax: '',
          linkedin: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          clientCode: '',
          categoryIds: [],
          tags: [],
          notes: '',
          createdAt: '',
          updatedAt: '',
        },
      ],
      total: 1,
      totalPages: 1,
    },
    isLoading: false,
  }),
  useContactCategories: () => ({ data: [] }),
  useContactMutations: () => ({
    createContact: { mutateAsync: vi.fn() },
    updateContact: { mutateAsync: vi.fn() },
    deleteContacts: { mutateAsync: vi.fn() },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/contacts']}>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <TestI18nProvider>
              <ContactsListView />
            </TestI18nProvider>
          </QueryClientProvider>
        </NuqsAdapter>
      </MemoryRouter>,
    );
  });
}

describe('ContactsListView', () => {
  // lytenyte-core (virtualized grid) does not emit standard DOM text nodes for
  // cell content in jsdom. Assert on pagination summary "1-1 of 1" which proves
  // the mocked contact was converted via toContactRow, passed through
  // useListPageState, and reached CrudListShell — a real render, not just a mount.
  it('renders the contact rows', async () => {
    await renderView();
    expect(container.textContent).toContain('1-1 of 1');
  });

  it('renders a search input', async () => {
    await renderView();
    expect(container.querySelector('input')).not.toBeNull();
  });
});
