// apps/web/src/components/settings/members/MembersPeopleSection.test.tsx
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

import { TestI18nProvider } from '@/core/i18n';
import {
  OsirisRuntimeContext,
  type OsirisRuntimeContextValue,
} from '@/runtime/osiris/useOsirisRuntime';

import { membersKeys } from './data/membersKeys';
import { MembersPeopleSection } from './MembersPeopleSection';

type MemberRowData = { fullName: string };

const runtime = {
  activeOrgId: 'org_1',
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.members.manage'] },
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

async function render(rt: OsirisRuntimeContextValue) {
  await act(async () => {
    root.render(
      <TestI18nProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <NuqsAdapter>
              <OsirisRuntimeContext.Provider value={rt}>
                <MembersPeopleSection />
              </OsirisRuntimeContext.Provider>
            </NuqsAdapter>
          </MemoryRouter>
        </QueryClientProvider>
      </TestI18nProvider>,
    );
  });
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

describe('MembersPeopleSection', () => {
  it('loads members and renders invite control + invitation/link subsections', async () => {
    await render(runtime);

    expect(runtime.listOrgMembers).toHaveBeenCalledWith('org_1');
    expect(container.textContent).toContain('Invite member');
    expect(container.textContent).toContain('Pending invitations');
    expect(container.textContent).toContain('Invite links');

    const members = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_1'));
    expect(members?.[0]?.fullName).toBe('Anna');
  });

  it('keeps each org members query under its own cache key after an org switch', async () => {
    await render(runtime);

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

    await render(org2Runtime);

    const org1 = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_1'));
    const org2 = queryClient.getQueryData<MemberRowData[]>(membersKeys.members('org_2'));
    expect(org2?.[0]?.fullName).toBe('Bob');
    expect(org1?.some((m) => m.fullName === 'Bob')).not.toBe(true);
  });
});
