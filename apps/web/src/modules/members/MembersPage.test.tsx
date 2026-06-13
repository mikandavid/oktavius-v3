// apps/web/src/modules/members/MembersPage.test.tsx

// jsdom does not ship ResizeObserver; CrudTable needs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { MembersPage } from './MembersPage';

const runtime = {
  sessionStatus: 'authenticated',
  currentUser: { id: 'u0', email: 'me@x.test', fullName: 'Me', isSuperadmin: false },
  organizations: [],
  memberships: [],
  activeOrgId: 'org_1',
  activeSiteId: null,
  permissions: ['org.members.manage'],
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.members.manage'] },
  locationAccess: null,
  config: null,
  isLoading: false,
  error: null,
  reload: vi.fn(async () => {}),
  listOrgMembers: vi.fn(async () => [
    {
      userId: 'u1',
      membershipId: 'm1',
      role: 'member' as const,
      customRoleId: null,
      email: 'a@x.test',
      fullName: 'Anna',
    },
  ]),
  listInvitations: vi.fn(async () => []),
  listInviteLinks: vi.fn(async () => []),
  listCustomRoles: vi.fn(async () => []),
} as unknown as OsirisRuntimeContextValue;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('MembersPage', () => {
  it('loads members from the runtime and renders the page shell', async () => {
    await act(async () => {
      root.render(
        <TestI18nProvider>
          <MemoryRouter initialEntries={['/members']}>
            <NuqsAdapter>
              <OsirisRuntimeContext.Provider value={runtime}>
                <MembersPage />
              </OsirisRuntimeContext.Provider>
            </NuqsAdapter>
          </MemoryRouter>
        </TestI18nProvider>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(runtime.listOrgMembers).toHaveBeenCalledWith('org_1');
    expect(container.textContent).toContain('Invite member');
    expect(container.textContent).toContain('Invitations');
  });
});
