import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { ActiveLocationProvider, useActiveLocation } from './ActiveLocationContext';

function Probe() {
  const { activeLocationId, locations, viewAllLocations } = useActiveLocation();

  return (
    <div>
      <div data-testid="active-location">{activeLocationId}</div>
      <div data-testid="view-all">{String(viewAllLocations)}</div>
      <ul>
        {locations.map((location) => (
          <li key={location.id}>{location.name}</li>
        ))}
      </ul>
    </div>
  );
}

const osirisRuntime = {
  currentUser: { id: 'usr_1', email: 'anna@example.test', fullName: 'Anna', isSuperadmin: false },
  organizations: [{ id: 'org_1', name: 'Osiris Demo', slug: 'osiris-demo' }],
  memberships: [{ org_id: 'org_1', role: 'admin', is_active: true }],
  activeOrgId: 'org_1',
  activeSiteId: 'site_1',
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: [] },
  locationAccess: {
    activeSiteId: 'site_1',
    accessibleSiteIds: ['site_1'],
    canViewAllSites: false,
    canEditAllSites: false,
    orgSiteCount: 1,
    sites: [{ id: 'site_1', name: 'Vienna', isActive: true }],
  },
  config: null,
  isLoading: false,
  error: null,
  reload: async () => {},
} satisfies OsirisRuntimeContextValue;

function renderProbe() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <OsirisRuntimeContext.Provider value={osirisRuntime}>
          <ActiveLocationProvider>
            <Probe />
          </ActiveLocationProvider>
        </OsirisRuntimeContext.Provider>
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe('ActiveLocationProvider', () => {
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

  it('uses Osiris location access when demo data is absent', () => {
    const rendered = renderProbe();
    roots.push(rendered.root);

    expect(rendered.container.querySelector('[data-testid="active-location"]')?.textContent).toBe(
      'site_1',
    );
    expect(rendered.container.querySelector('[data-testid="view-all"]')?.textContent).toBe('false');
    expect(rendered.container.textContent).toContain('Vienna');
  });
});
