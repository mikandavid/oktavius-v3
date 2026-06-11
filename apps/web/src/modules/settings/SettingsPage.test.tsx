import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { SettingsPage } from './SettingsPage';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

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

const workspaceSettings = createDefaultOsirisWorkspaceSettings({
  dateTime: { dateFormat: 'YYYY-MM-DD', timeFormat: '24h', timezone: 'Europe/Vienna' },
  locations: { enforcementEnabled: false, sharedModules: [] },
});

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
  listOrgLocations: vi.fn(async () => [
    {
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
      isActive: true,
    },
  ]),
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

async function renderSettingsPage(value: OsirisRuntimeContextValue = runtime) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <TestI18nProvider>
        <OsirisRuntimeContext.Provider value={value}>
          <SettingsPage />
        </OsirisRuntimeContext.Provider>
      </TestI18nProvider>,
    );
  });

  return { container, root };
}

describe('SettingsPage', () => {
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

  it('loads and saves backend-backed workspace settings', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    expect(runtime.loadWorkspaceSettings).toHaveBeenCalledWith('org_1');
    expect(rendered.container.textContent).toContain('YYYY-MM-DD');

    await act(async () => {
      rendered.container
        .querySelector('button[aria-label="Save workspace settings"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(runtime.updateWorkspaceSettings).toHaveBeenCalledWith(workspaceSettings, 'org_1');
  });

  it('loads real locations and can deactivate a location', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    expect(runtime.listOrgLocations).toHaveBeenCalledWith('org_1');
    expect(rendered.container.textContent).toContain('Vienna');
    expect(rendered.container.textContent).toContain('Oktavius Vienna');

    await act(async () => {
      rendered.container
        .querySelector('button[aria-label="Deactivate Vienna"]')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(runtime.updateOrgLocation).toHaveBeenCalledWith('org_1', 'site_1', {
      isActive: false,
    });
  });
});
