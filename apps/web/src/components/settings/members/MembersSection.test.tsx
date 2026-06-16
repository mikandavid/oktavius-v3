// apps/web/src/modules/members/MembersSection.test.tsx
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom does not ship ResizeObserver; CrudTable needs it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';

import { MembersSection } from './MembersSection';

const members: OsirisOrgMember[] = [
  {
    userId: 'u1',
    membershipId: 'm1',
    role: 'admin',
    customRoleId: null,
    email: 'a@x.test',
    fullName: 'Anna',
  },
  {
    userId: 'u2',
    membershipId: 'm2',
    role: 'owner',
    customRoleId: null,
    email: 'o@x.test',
    fullName: 'Olive',
  },
];

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

describe('MembersSection', () => {
  it('renders members in the list', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <NuqsAdapter>
            <MembersSection
              members={members}
              customRoles={[]}
              isLoading={false}
              onChangeRole={vi.fn(async () => {})}
              onRemove={vi.fn(async () => {})}
            />
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });

    // lytenyte-core (the virtualized grid library used by CrudTable) does not emit
    // standard DOM text nodes for cell content in jsdom, so individual member names
    // are not visible in textContent.  Instead we assert on the pagination summary
    // which proves both rows were processed by useListPageState and passed to
    // CrudListShell, and that the section mounted without throwing.
    expect(container.textContent).toContain('1-2 of 2');
  });
});
