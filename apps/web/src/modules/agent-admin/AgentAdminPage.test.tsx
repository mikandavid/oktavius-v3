// apps/web/src/modules/agent-admin/AgentAdminPage.test.tsx
import type * as BaseUi from '@oktavius/base-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

import { AgentAdminPage } from './AgentAdminPage';

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useAppShellLayout: () => ({ isSidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
  useRegisterFillHeightPage: vi.fn(),
  useRegisterSecondaryNav: vi.fn(),
}));

vi.mock('@oktavius/base-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof BaseUi>();
  return {
    ...actual,
    SettingsSection: ({
      title,
      children,
      className,
    }: {
      title: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <section className={className} data-testid="settings-section" data-title={title}>
        <h3>{title}</h3>
        {children}
      </section>
    ),
    SettingsRow: ({
      label,
      children,
      className,
    }: {
      label: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <div className={className} data-testid="settings-row" data-label={label}>
        <span>{label}</span>
        {children}
      </div>
    ),
  };
});

const defaultSettings = createDefaultOsirisWorkspaceSettings();

const baseRuntime: OsirisRuntimeContextValue = {
  sessionStatus: 'authenticated',
  currentUser: {
    id: 'usr_1',
    email: 'test@example.test',
    fullName: 'Test User',
    isSuperadmin: false,
  },
  organizations: [{ id: 'org_1', name: 'Test Org', slug: 'test-org' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: ['org.manage'],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.manage'] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  loadWorkspaceSettings: vi.fn(async () => defaultSettings),
  updateWorkspaceSettings: vi.fn(async (settings) => settings),
};

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderAt(root: Root, path: string, qc: QueryClient) {
  return root.render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={qc}>
        <TestI18nProvider>
          <OsirisRuntimeContext.Provider value={baseRuntime}>
            <AgentAdminPage />
          </OsirisRuntimeContext.Provider>
        </TestI18nProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('AgentAdminPage', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.useFakeTimers();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    document.body.innerHTML = '';
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the Settings section by default', async () => {
    const qc = makeQueryClient();
    await act(async () => {
      renderAt(root, '/agent', qc);
    });

    const sections = [...container.querySelectorAll('[data-testid="settings-section"]')];
    const titles = sections.map((section) => section.getAttribute('data-title'));
    expect(titles).toContain('AI Usage Budget');
  });

  it('renders the integrations section when deep-linked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              connections: [],
              integrations: [],
              apps: [],
              pipedream: { enabled: false, configured: false, environment: null, projectId: null },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        ),
      ),
    );

    const qc = makeQueryClient();
    await act(async () => {
      renderAt(root, '/agent?section=integrations', qc);
    });

    expect(container.querySelector('[data-testid="agent-integrations-section"]')).toBeTruthy();
  });
});
