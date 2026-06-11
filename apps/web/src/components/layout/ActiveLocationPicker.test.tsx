import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';

import { ActiveLocationPicker, shouldShowActiveLocationPicker } from './ActiveLocationPicker';

const baseRuntime: OsirisRuntimeContextValue = {
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
};

function renderPicker(runtime: OsirisRuntimeContextValue) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <OsirisRuntimeContext.Provider value={runtime}>
          <ActiveLocationProvider>
            <ActiveLocationPicker />
          </ActiveLocationProvider>
        </OsirisRuntimeContext.Provider>
      </QueryClientProvider>,
    );
  });

  return { container, root };
}

describe('ActiveLocationPicker', () => {
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

  it('hides when there is only one site and no all-locations access', () => {
    const rendered = renderPicker(baseRuntime);
    roots.push(rendered.root);

    expect(rendered.container.textContent).toBe('');
  });

  it('uses the old Osiris visibility rule for location switching', () => {
    expect(
      shouldShowActiveLocationPicker({
        activeOrgId: 'org_1',
        locationAccess: baseRuntime.locationAccess,
      }),
    ).toBe(false);
    expect(
      shouldShowActiveLocationPicker({
        activeOrgId: 'org_1',
        locationAccess: {
          ...baseRuntime.locationAccess!,
          canViewAllSites: true,
          orgSiteCount: 2,
        },
      }),
    ).toBe(true);
  });
});
