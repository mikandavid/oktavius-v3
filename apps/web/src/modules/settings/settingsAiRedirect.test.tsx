import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { SettingsPage } from './SettingsPage';

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useAppShellLayout: () => ({ isSidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
  useRegisterFillHeightPage: vi.fn(),
  useRegisterSecondaryNav: vi.fn(),
}));

vi.mock('@/lib/locations/ActiveLocationContext', () => ({
  useActiveLocation: () => ({
    activeLocationId: null,
    viewAllLocations: true,
    setActiveLocationId: vi.fn(),
    setAllLocationsMode: vi.fn(),
    locations: [],
    activeLocation: null,
  }),
}));

vi.mock('@/components/common/LanguageSelector', () => ({
  LanguageSelector: () => <div data-testid="language-selector" />,
}));

vi.mock('@/lib/reference-data', () => ({
  useCountryOptions: () => [
    { value: 'AT', label: 'Austria' },
    { value: 'DE', label: 'Germany' },
  ],
  normalizeCountryCode: (value: string) => value || undefined,
}));

const workspaceSettings = createDefaultOsirisWorkspaceSettings();

const runtime = {
  currentUser: { id: 'usr_1', email: 'anna@example.test', fullName: 'Anna', isSuperadmin: false },
  organizations: [{ id: 'org_1', name: 'Oktavius Demo', slug: 'demo' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: ['org.manage', 'locations.manage'],
  permissionSubject: {
    isSuperadmin: false,
    role: 'admin',
    permissions: ['org.manage', 'locations.manage'],
  },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  loadWorkspaceSettings: vi.fn(async () => workspaceSettings),
  updateWorkspaceSettings: vi.fn(async (_settings) => workspaceSettings),
  listOrgLocations: vi.fn(async () => []),
  updateOrgLocation: vi.fn(async (_orgId, _locationId, patch) => ({
    id: 'site_1',
    orgId: 'org_1',
    name: 'Vienna',
    address: {},
    branchCode: '21',
    designation: null,
    locality: 'Vienna',
    category: 'Branch',
    phone: null,
    mobilePhone: null,
    fax: null,
    companyName: 'Oktavius Vienna',
    email: null,
    street: 'Ring 1',
    postalCode: '1010',
    isActive: patch.isActive ?? true,
  })),
} satisfies OsirisRuntimeContextValue;

describe('settings ai redirect', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('redirects /settings?section=ai to the agent module', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    roots.push(root);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/settings?section=ai']}>
          <TestI18nProvider>
            <QueryClientProvider client={queryClient}>
              <OsirisRuntimeContext.Provider value={runtime}>
                <Routes>
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/agent" element={<div>Agent Module Loaded</div>} />
                </Routes>
              </OsirisRuntimeContext.Provider>
            </QueryClientProvider>
          </TestI18nProvider>
        </MemoryRouter>,
      );
    });

    expect(container.textContent).toContain('Agent Module Loaded');
  });
});
