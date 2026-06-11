import { act, useMemo, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { DemoDataProvider, useDemoData } from './demo-data';
import { ORG_KUNZ_ID } from './demo-data/orgIds';
import { getDemoOrgProfile } from './demo-data/orgProfiles';

function DemoOsirisRuntimeBridge({ children }: { children: ReactNode }) {
  const demoData = useDemoData();
  const profile = getDemoOrgProfile(demoData.activeOrgId);
  const role = demoData.activeMembership?.role.toLowerCase() as
    | OsirisRuntimeContextValue['permissionSubject']['role']
    | undefined;
  const runtime = useMemo<OsirisRuntimeContextValue>(
    () => ({
      currentUser: {
        id: demoData.currentUser.id,
        email: demoData.currentUser.email,
        fullName: demoData.currentUser.name,
        isSuperadmin: Boolean(demoData.currentUser.isSuperadmin),
      },
      organizations: demoData.organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      })),
      memberships: demoData.activeMembership
        ? [
            {
              org_id: demoData.activeOrgId,
              role: demoData.activeMembership.role,
              is_active: true,
            },
          ]
        : [],
      activeOrgId: demoData.activeOrgId,
      activeSiteId: demoData.activeSiteId,
      setActiveSiteId: demoData.setActiveSiteId,
      permissions: demoData.activeMembership?.permissions ?? [],
      permissionSubject: {
        isSuperadmin: Boolean(demoData.currentUser.isSuperadmin),
        role: role ?? null,
        permissions: demoData.activeMembership?.permissions ?? [],
      },
      locationAccess: {
        activeSiteId: demoData.activeSiteId,
        accessibleSiteIds: profile.locations.map((location) => location.id),
        canViewAllSites: true,
        canEditAllSites: true,
        orgSiteCount: profile.locations.length,
        sites: profile.locations.map((location) => ({
          id: location.id,
          name: location.name,
          isActive: location.isActive,
        })),
      },
      config: null,
      isLoading: false,
      error: null,
      reload: async () => {},
    }),
    [demoData, profile.locations, role],
  );

  return <OsirisRuntimeContext.Provider value={runtime}>{children}</OsirisRuntimeContext.Provider>;
}

function ClientLocationProbe() {
  const { clients } = useDemoData();
  const { activeLocationId, locations, setActiveLocationId } = useActiveLocation();
  const secondLocation = locations[1];

  return (
    <div>
      <div data-testid="active-location">{activeLocationId}</div>
      <button
        type="button"
        onClick={() => secondLocation && setActiveLocationId(secondLocation.id)}
      >
        Switch location
      </button>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>{client.name}</li>
        ))}
      </ul>
    </div>
  );
}

function renderProbe() {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <DemoDataProvider>
        <DemoOsirisRuntimeBridge>
          <ActiveLocationProvider>
            <ClientLocationProbe />
          </ActiveLocationProvider>
        </DemoOsirisRuntimeBridge>
      </DemoDataProvider>,
    );
  });

  return { container, root };
}

describe('demo multi-tenant isolation', () => {
  let roots: Root[] = [];

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    roots = [];
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/?org=bestattung-kunz');
  });

  afterEach(() => {
    for (const root of roots) {
      act(() => root.unmount());
    }
    document.body.innerHTML = '';
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('changes visible client rows when the active location changes without leaking prior rows', () => {
    const locations = getDemoOrgProfile(ORG_KUNZ_ID).locations;
    const rendered = renderProbe();
    roots.push(rendered.root);

    const beforeRows = Array.from(rendered.container.querySelectorAll('li')).map(
      (item) => item.textContent ?? '',
    );

    expect(rendered.container.querySelector('[data-testid="active-location"]')?.textContent).toBe(
      locations[0]?.id,
    );
    expect(beforeRows.length).toBeGreaterThan(0);

    act(() => {
      rendered.container
        .querySelector('button')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const afterRows = Array.from(rendered.container.querySelectorAll('li')).map(
      (item) => item.textContent ?? '',
    );

    expect(rendered.container.querySelector('[data-testid="active-location"]')?.textContent).toBe(
      locations[1]?.id,
    );
    expect(afterRows.length).toBeGreaterThan(0);
    expect(afterRows).not.toEqual(beforeRows);
    expect(afterRows.some((row) => beforeRows.includes(row))).toBe(false);
  });
});
