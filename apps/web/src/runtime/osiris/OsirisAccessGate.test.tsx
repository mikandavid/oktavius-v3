import { StrictMode } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { OsirisRuntimeContext, type OsirisRuntimeContextValue } from './useOsirisRuntime';
import { OsirisAccessGate } from './OsirisAccessGate';

const baseRuntime: OsirisRuntimeContextValue = {
  currentUser: { id: 'usr_1', email: 'user@example.test', fullName: 'User', isSuperadmin: false },
  organizations: [{ id: 'org_1', name: 'Acme', slug: 'acme' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: [] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderGate(runtime: OsirisRuntimeContextValue, initialPath = '/reports?view=open') {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <StrictMode>
        <MemoryRouter initialEntries={[initialPath]}>
          <TestI18nProvider>
            <OsirisRuntimeContext.Provider value={runtime}>
              <Routes>
                <Route
                  path="/reports"
                  element={
                    <>
                      <LocationProbe />
                      <OsirisAccessGate>
                        <div>Protected workspace</div>
                      </OsirisAccessGate>
                    </>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <>
                      <LocationProbe />
                      <div>Login page</div>
                    </>
                  }
                />
                <Route
                  path="*"
                  element={
                    <>
                      <LocationProbe />
                      <div>Other page</div>
                    </>
                  }
                />
              </Routes>
            </OsirisRuntimeContext.Provider>
          </TestI18nProvider>
        </MemoryRouter>
      </StrictMode>,
    );
  });

  return { container, root };
}

describe('OsirisAccessGate', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
  });

  it('renders children when bootstrap has an organization', () => {
    const rendered = renderGate(baseRuntime);
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Protected workspace');
  });

  it('renders a no-organization state for non-superadmins without organizations', () => {
    const rendered = renderGate({
      ...baseRuntime,
      organizations: [],
      activeOrgId: null,
      permissionSubject: { isSuperadmin: false, role: null, permissions: [] },
    });
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('No workspace assigned');
    expect(rendered.container.textContent).toContain('Ask your workspace administrator');
    expect(
      rendered.container.querySelector('a[href="mailto:hi@oktavius.ai"]')?.textContent,
    ).toContain('Contact Oktavius support');
    expect(rendered.container.textContent).not.toContain('Protected workspace');
  });

  it('renders a retryable bootstrap error when runtime loading fails', () => {
    const reload = vi.fn(async () => {});
    const rendered = renderGate({
      ...baseRuntime,
      organizations: [],
      activeOrgId: null,
      error: new Error('Bootstrap failed with 500'),
      reload,
    });
    roots.push(rendered.root);

    expect(rendered.container.textContent).toContain('Unable to load workspace');
    expect(rendered.container.textContent).toContain('Bootstrap failed with 500');

    const retryButton = rendered.container.querySelector('button');
    act(() => {
      retryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('redirects anonymous sessions to login with the current path preserved', () => {
    const rendered = renderGate({
      ...baseRuntime,
      sessionStatus: 'anonymous',
      organizations: [],
      activeOrgId: null,
    });
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="location"]')?.textContent).toBe(
      '/login?redirect=%2Freports%3Fview%3Dopen',
    );
    expect(rendered.container.textContent).not.toContain('Protected workspace');
  });

  it('redirects expired sessions to login with the current path preserved', () => {
    const rendered = renderGate({
      ...baseRuntime,
      sessionStatus: 'expired',
    });
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="location"]')?.textContent).toBe(
      '/login?redirect=%2Freports%3Fview%3Dopen',
    );
    expect(rendered.container.textContent).not.toContain('Protected workspace');
  });
});
