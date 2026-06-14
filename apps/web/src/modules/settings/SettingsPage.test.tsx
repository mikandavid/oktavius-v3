import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { SettingsPage } from './SettingsPage';

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

// useCountryOptions reads the locale via UserPreferencesProvider, which this
// unit test does not mount (the real app shell provides it).
vi.mock('@/lib/reference-data', () => ({
  useCountryOptions: () => [
    { value: 'AT', label: 'Austria' },
    { value: 'DE', label: 'Germany' },
  ],
  normalizeCountryCode: (value: string) => value || undefined,
}));

const workspaceSettings = createDefaultOsirisWorkspaceSettings({
  company: {
    legalName: 'Oktavius Demo GmbH',
    address: {
      line1: 'Ring 1',
      line2: '',
      city: 'Vienna',
      postalCode: '1010',
      country: 'AT',
    },
    taxId: '123/4567',
    vatId: 'ATU12345678',
    registrationNumber: 'FN 123456a',
    phone: '+43 1 234',
    email: 'office@example.test',
    website: 'https://example.test',
  },
  banking: {
    bankName: 'Erste Bank',
    iban: 'AT611904300234573201',
    bic: 'GIBAATWWXXX',
    accountHolder: 'Oktavius Demo GmbH',
  },
  invoicing: {
    defaultPaymentTermsDays: 14,
    footerText: 'Danke fuer Ihren Auftrag.',
    dunningEnabled: true,
  },
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
      <MemoryRouter>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={value}>
            <SettingsPage />
          </OsirisRuntimeContext.Provider>
        </TestI18nProvider>
      </MemoryRouter>,
    );
  });

  return { container, root };
}

function changeInput(input: HTMLInputElement, value: string) {
  act(() => {
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    valueSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

describe('SettingsPage', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('shows the WhatsApp settings tab for org managers', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('WhatsApp');
  });

  it('loads workspace settings without autosaving on load', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    expect(runtime.loadWorkspaceSettings).toHaveBeenCalledWith('org_1');
    expect(rendered.container.textContent).toContain('YYYY-MM-DD');

    // Loading (or switching orgs) must not trigger a write-back; autosave only
    // arms after a user edit.
    expect(runtime.updateWorkspaceSettings).not.toHaveBeenCalled();
  });

  it('loads real locations and can deactivate a location', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    await act(async () => {
      [...rendered.container.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Locations'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

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

  it('keeps organization settings focused on company, banking, and invoicing details', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    await act(async () => {
      [...rendered.container.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Organization Settings'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.textContent).toContain('Company Information');
    expect(rendered.container.textContent).toContain('Bank Details');
    expect(rendered.container.textContent).toContain('Invoice Settings');
    expect(rendered.container.textContent).not.toContain('Date & Time');
    expect(rendered.container.textContent).not.toContain('AI Usage Budget');
    expect(rendered.container.textContent).not.toContain('Agent Instructions');
    expect(rendered.container.textContent).not.toContain('Location enforcement');
    expect(rendered.container.textContent).not.toContain('14 days');

    const legalNameInput = rendered.container.querySelector<HTMLInputElement>(
      'input[name="company.legalName"]',
    );
    if (!legalNameInput) throw new Error('Expected legal name input to render.');

    expect(legalNameInput.value).toBe('Oktavius Demo GmbH');
    expect(
      rendered.container.querySelector<HTMLInputElement>('input[name="banking.bankName"]')?.value,
    ).toBe('Erste Bank');

    // Editing arms the debounced autosave; the save fires once the timer settles.
    vi.useFakeTimers();
    changeInput(legalNameInput, 'Oktavius V3 GmbH');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(runtime.updateWorkspaceSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        company: expect.objectContaining({ legalName: 'Oktavius V3 GmbH' }),
      }),
      'org_1',
    );
  });

  it('shows AI-owned organization controls in the AI settings tab', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    await act(async () => {
      [...rendered.container.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Agent'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.textContent).toContain('AI Usage Budget');
    expect(rendered.container.textContent).toContain('Agent Instructions');
    expect(rendered.container.textContent).not.toContain('Company Information');
    expect(rendered.container.textContent).not.toContain('Bank Details');
  });

  it('shows location policy controls in the locations settings tab', async () => {
    const rendered = await renderSettingsPage();
    roots.push(rendered.root);

    await act(async () => {
      [...rendered.container.querySelectorAll('button')]
        .find((button) => button.textContent?.includes('Locations'))
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.textContent).toContain('Location enforcement');
    expect(rendered.container.textContent).toContain('Org-shared modules');
    expect(rendered.container.textContent).not.toContain('AI Usage Budget');
    expect(rendered.container.textContent).not.toContain('Invoice Settings');
  });
});
