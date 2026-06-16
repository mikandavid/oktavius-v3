import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import type * as ReferenceDataModule from '@/lib/reference-data';

import { ContactFormView } from './ContactFormView';

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

vi.mock('@/lib/userPreferences', () => ({
  useUserPreferences: () => ({ locale: 'en' }),
}));

vi.mock('@/components/forms/useFormLeaveBlocker', () => ({
  useFormLeaveBlocker: () => ({
    isDirty: false,
    blockerState: 'unblocked',
    isBlocked: false,
    proceed: vi.fn(),
    reset: vi.fn(),
    message: '',
  }),
}));

vi.mock('@/lib/reference-data', async (importOriginal) => {
  const actual = await importOriginal<typeof ReferenceDataModule>();
  return {
    ...actual,
    useCountryOptions: () => [],
    useCurrencyOptions: () => [],
    usePhoneCountries: () => [],
    useVocabularyOptionsMap: () => ({}),
  };
});

vi.mock('@/runtime/osiris/useOsirisRuntime', () => ({
  useOptionalOsirisRuntime: () => ({
    activeOrgId: 'o1',
    permissionSubject: { isSuperadmin: false, role: 'member', permissions: [] },
  }),
}));

vi.mock('./data/useContactsData', () => ({
  useContact: () => ({ data: undefined, isLoading: false }),
  useContactCategories: () => ({ data: [] }),
  useContactMutations: () => ({
    createContact: { mutateAsync: vi.fn().mockResolvedValue({ id: 'new1' }) },
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

describe('ContactFormView', () => {
  it('renders the create form with a name field', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/contacts?mode=new']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <ContactFormView mode="create" />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    expect(container.querySelector('input')).not.toBeNull();
    expect(container.textContent?.toLowerCase()).toContain('name');
  });
});
