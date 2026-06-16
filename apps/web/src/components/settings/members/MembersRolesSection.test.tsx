// apps/web/src/components/settings/members/MembersRolesSection.test.tsx
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
import { MembersRolesSection } from './MembersRolesSection';

const runtime = {
  activeOrgId: 'org_1',
  permissionSubject: { isSuperadmin: false, role: 'admin', permissions: ['org.members.manage'] },
  listCustomRoles: vi.fn(async () => [
    {
      id: 'cr1',
      name: 'Auditor',
      description: 'Read-only finance',
      baseRole: 'viewer' as const,
      agentAccess: false,
      permissions: [],
      allowedModules: [],
      memberCount: 2,
    },
  ]),
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
                <MembersRolesSection />
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

describe('MembersRolesSection', () => {
  it('loads custom roles from the runtime and renders the add-role control', async () => {
    await render(runtime);

    expect(runtime.listCustomRoles).toHaveBeenCalledWith('org_1');
    expect(container.textContent).toContain('Add custom role');
    const roles = queryClient.getQueryData<{ name: string }[]>(membersKeys.roles('org_1'));
    expect(roles?.[0]?.name).toBe('Auditor');
  });
});
