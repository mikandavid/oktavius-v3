import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { UserPreferencesProvider, useUserPreferences } from '@/lib/userPreferences';

import { AppShellLayoutProvider, useAppShellLayout } from './AppShellLayoutContext';

function Probe() {
  const { hydratePreferences } = useUserPreferences();
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppShellLayout();

  return (
    <div>
      <div data-testid="collapsed">{String(isSidebarCollapsed)}</div>
      <button
        type="button"
        onClick={() => hydratePreferences({ sidebarCollapsed: true }, 'runtime:org_1')}
      >
        Hydrate
      </button>
      <button type="button" onClick={() => setSidebarCollapsed(false)}>
        Expand
      </button>
    </div>
  );
}

function renderProbe() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <UserPreferencesProvider>
        <AppShellLayoutProvider>
          <Probe />
        </AppShellLayoutProvider>
      </UserPreferencesProvider>,
    );
  });

  return { container, root };
}

describe('AppShellLayoutProvider preferences integration', () => {
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

  it('hydrates collapsed sidebar state from shared user preferences', () => {
    const rendered = renderProbe();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="collapsed"]')?.textContent).toBe(
      'false',
    );

    act(() => {
      rendered.container
        .querySelectorAll('button')[0]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="collapsed"]')?.textContent).toBe('true');
    expect(window.localStorage.getItem('sidebar-collapsed')).toBe('true');

    act(() => {
      rendered.container
        .querySelectorAll('button')[1]
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(rendered.container.querySelector('[data-testid="collapsed"]')?.textContent).toBe(
      'false',
    );
    expect(window.localStorage.getItem('sidebar-collapsed')).toBe('false');
  });
});
