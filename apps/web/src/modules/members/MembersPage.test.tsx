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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

import { membersKeys } from '@/components/settings/members/data/membersKeys';
import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { MembersPage } from './MembersPage';

type MemberRowData = { fullName: string };

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
let queryClient: QueryClient;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function renderMembers(rt: OsirisRuntimeContextValue) {
  await act(async () => {
    root.render(
      <TestI18nProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/members']}>
            <NuqsAdapter>
              <OsirisRuntimeContext.Provider value={rt}>
                <MembersPage />
              </OsirisRuntimeContext.Provider>
            </NuqsAdapter>
          </MemoryRouter>
        </QueryClientProvider>
      </TestI18nProvider>,
    );
  });
  // Flush the react-query fetches (queryFn runs in an effect, then resolves).
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe('MembersPage', () => {
  it('loads members from the runtime and renders the page shell', async () => {
    await renderMembers(runtime);

    expect(runtime.listOrgMembers).toHaveBeenCalledWith('org_1');
    expect(container.textContent).toContain('Invite member');
    expect(container.textContent).toContain('Invitations');

    const org1Members = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_1'));
    expect(org1Members?.[0]?.fullName).toBe('Anna');
  });

  it('does not bleed the previous org members after switching org', async () => {
    await renderMembers(runtime);

    // Switch active org: org-scoped query keys give org_2 its own cache entry
    // instead of serving org_1's stale rows (the manual-fetch race).
    const org2Runtime = {
      ...runtime,
      activeOrgId: 'org_2',
      listOrgMembers: vi.fn(async () => [
        {
          userId: 'u2',
          membershipId: 'm2',
          role: 'member' as const,
          customRoleId: null,
          email: 'b@x.test',
          fullName: 'Bob',
        },
      ]),
    } as unknown as OsirisRuntimeContextValue;

    await renderMembers(org2Runtime);

    expect(org2Runtime.listOrgMembers).toHaveBeenCalledWith('org_2');
    // Each org's data lives under its own key — no cross-contamination.
    const org1Members = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_1'));
    const org2Members = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_2'));
    expect(org2Members?.[0]?.fullName).toBe('Bob');
    expect(org1Members?.some((m) => m.fullName === 'Bob')).not.toBe(true);
  });
});
