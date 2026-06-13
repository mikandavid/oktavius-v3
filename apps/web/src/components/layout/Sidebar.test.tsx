import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import { UserPreferencesProvider } from '@/lib/userPreferences';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { createDefaultOsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { AppShellLayoutProvider } from './AppShellLayoutContext';
import { Sidebar } from './Sidebar';

function makeRuntime(): OsirisRuntimeContextValue {
  return {
    isLoading: false,
    error: null,
    reload: async () => {},
    sessionStatus: 'authenticated',
    currentUser: {
      id: 'usr_1',
      email: 'anna@example.test',
      fullName: 'Anna Beispiel',
      isSuperadmin: false,
    },
    organizations: [{ id: 'org_1', name: 'Acme Funeral', slug: 'acme-funeral' }],
    memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
    activeOrgId: 'org_1',
    activeSiteId: null,
    permissions: [],
    permissionSubject: { isSuperadmin: false, role: 'admin', permissions: [] },
    locationAccess: null,
    config: {
      org: {
        id: 'org_1',
        name: 'Acme Funeral',
        slug: 'acme-funeral',
        industryKey: 'general',
        industryName: 'General',
        enabledModules: [],
        theme: {},
        settings: createDefaultOsirisWorkspaceSettings(),
        logoUrl: 'data:image/png;base64,org-logo',
      },
      terminology: {},
      permissions: [],
      preferences: {},
      agentAccess: true,
    },
  };
}

function renderSidebar(runtime?: OsirisRuntimeContextValue) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  const content = (
    <MemoryRouter initialEntries={['/dashboard']}>
      <TestI18nProvider>
        <UserPreferencesProvider>
          <AppShellLayoutProvider>
            <Sidebar />
          </AppShellLayoutProvider>
        </UserPreferencesProvider>
      </TestI18nProvider>
    </MemoryRouter>
  );

  act(() => {
    root.render(
      runtime ? (
        <OsirisRuntimeContext.Provider value={runtime}>{content}</OsirisRuntimeContext.Provider>
      ) : (
        content
      ),
    );
  });

  return { container, root };
}

describe('Sidebar', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    window.localStorage.clear();
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('expands the compact sidebar on hover without changing the reserved rail width', () => {
    window.localStorage.setItem('sidebar-collapsed', 'true');

    const rendered = renderSidebar();
    roots.push(rendered.root);

    const sidebar = rendered.container.querySelector('aside');
    const hoverPanel = rendered.container.querySelector('[data-sidebar-hover-panel]');

    expect(sidebar?.className).toContain('w-12');
    expect(hoverPanel).not.toBeNull();
    if (!hoverPanel) return;
    expect(hoverPanel.className).not.toContain('w-52');

    act(() => {
      hoverPanel?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });

    expect(sidebar?.className).toContain('w-12');
    expect(hoverPanel?.className).toContain('w-52');
  });

  it('renders the active organization logo when the runtime config provides one', () => {
    const runtime = makeRuntime();
    const rendered = renderSidebar(runtime);
    roots.push(rendered.root);

    const logo = rendered.container.querySelector('img');

    expect(logo?.getAttribute('src')).toBe(runtime.config?.org.logoUrl);
    expect(logo?.getAttribute('alt')).toBe('');
  });
});
