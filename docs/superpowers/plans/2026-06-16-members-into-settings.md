# Members → Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the standalone `/members` module (a nested section-nav with 4 tabs) with two sections — **People** and **Roles** — inside the existing `/settings` page, redirecting `/members` to the People section.

**Architecture:** Relocate the reusable members UI + data layer out of `modules/members/` into `@/components/settings/members/` (so `modules/settings/SettingsPage.tsx` can import them without violating the no-cross-module-imports rule). Two new stateful container components (`MembersPeopleSection`, `MembersRolesSection`) hold the logic currently in `MembersPage`, and register as two `Workspace`-group entries in `SettingsPage`. The old `MembersPage`, its nav entry, and route are removed; `/members` becomes a redirect mirroring the existing `/profile` → `/settings?section=account` pattern.

**Tech Stack:** React 19, TypeScript, react-router v7, @tanstack/react-query, `@oktavius/base-ui`, vitest + react-dom/client test harness.

**Spec:** `docs/superpowers/specs/2026-06-16-members-into-settings-design.md`

**Ordering note:** Each task leaves the tree compiling/green. Task 1 relocates files and repoints the still-present `MembersPage` at the new paths; the old page is only deleted in Task 5 after the new sections are wired in.

---

## File Structure

**New files:**

- `apps/web/src/components/settings/members/MembersPeopleSection.tsx` — People container (members table + invitations + invite links + their dialogs)
- `apps/web/src/components/settings/members/MembersPeopleSection.test.tsx`
- `apps/web/src/components/settings/members/MembersRolesSection.tsx` — Roles container (custom roles + role dialog)
- `apps/web/src/components/settings/members/MembersRolesSection.test.tsx`

**Moved (Task 1, `git mv`, bodies unchanged except the leading path comment):**

- `modules/members/shared.tsx` → `components/settings/members/shared.tsx`
- `modules/members/data/membersKeys.ts` → `components/settings/members/data/membersKeys.ts`
- `modules/members/data/useMembersData.ts` → `components/settings/members/data/useMembersData.ts`
- `modules/members/MembersSection.tsx` → `components/settings/members/MembersSection.tsx`
- `modules/members/MembersSection.test.tsx` → `components/settings/members/MembersSection.test.tsx`
- `modules/members/InvitationsSection.tsx` → `components/settings/members/InvitationsSection.tsx`
- `modules/members/InviteLinksSection.tsx` → `components/settings/members/InviteLinksSection.tsx`
- `modules/members/CustomRolesSection.tsx` → `components/settings/members/CustomRolesSection.tsx`

**Modified:**

- `apps/web/src/modules/members/MembersPage.tsx` — imports repointed (Task 1), then **deleted** (Task 5)
- `apps/web/src/modules/members/MembersPage.test.tsx` — import repointed (Task 1), then **deleted** (Task 5)
- `apps/web/src/modules/settings/SettingsPage.tsx` — add People + Roles sections (Task 4)
- `apps/web/src/lib/appNavModules.ts` — remove the `members` entry (Task 5)
- `apps/web/src/app/router.tsx` — extract `PROTECTED_ROUTE_CHILDREN`, add `/members` redirect (Task 5)
- `apps/web/src/app/router.test.tsx` — **new** redirect test (Task 5)
- i18n locale files — remove now-unused `navigation.members` (Task 5)

**Unchanged:** `runtime/osiris/*` admin clients (shared infrastructure).

---

### Task 1: Relocate the reusable members UI + data layer

Pure move. The moved files import each other only via relative paths (`./shared`, `./membersKeys`) that stay valid because they move together; all other imports are absolute (`@/...`). `MembersPage` (still present) is repointed at the new absolute paths so the tree keeps compiling.

**Files:**

- Move: the 8 files listed under "Moved" above
- Modify: `apps/web/src/modules/members/MembersPage.tsx`
- Modify: `apps/web/src/modules/members/MembersPage.test.tsx`

- [ ] **Step 1: Create the target directory and move the files**

```bash
cd apps/web/src
mkdir -p components/settings/members/data
git mv modules/members/shared.tsx components/settings/members/shared.tsx
git mv modules/members/data/membersKeys.ts components/settings/members/data/membersKeys.ts
git mv modules/members/data/useMembersData.ts components/settings/members/data/useMembersData.ts
git mv modules/members/MembersSection.tsx components/settings/members/MembersSection.tsx
git mv modules/members/MembersSection.test.tsx components/settings/members/MembersSection.test.tsx
git mv modules/members/InvitationsSection.tsx components/settings/members/InvitationsSection.tsx
git mv modules/members/InviteLinksSection.tsx components/settings/members/InviteLinksSection.tsx
git mv modules/members/CustomRolesSection.tsx components/settings/members/CustomRolesSection.tsx
```

- [ ] **Step 2: Update the stale leading path comment in each moved file**

Each moved `.tsx`/`.ts` starts with a comment like `// apps/web/src/modules/members/<name>`. Update each to its new path, e.g. in `components/settings/members/MembersSection.tsx`:

```tsx
// apps/web/src/components/settings/members/MembersSection.tsx
```

Do the same for `shared.tsx`, `InvitationsSection.tsx`, `InviteLinksSection.tsx`, `CustomRolesSection.tsx`, and `MembersSection.test.tsx`. (`membersKeys.ts` and `useMembersData.ts` have no leading path comment — skip them.)

- [ ] **Step 3: Repoint `MembersPage.tsx` imports at the new location**

In `apps/web/src/modules/members/MembersPage.tsx`, replace the six relative members imports with absolute paths. Change these lines:

```tsx
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

import { CustomRolesSection } from './CustomRolesSection';
import {
  useCustomRoles,
  useInvitations,
  useInviteLinks,
  useMembers,
  useMembersMutations,
} from './data/useMembersData';
import { InvitationsSection } from './InvitationsSection';
import { InviteLinksSection } from './InviteLinksSection';
import { MembersSection } from './MembersSection';
import {
  buildRoleOptions,
  CUSTOM_ROLE_FORM_FIELDS,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from './shared';
```

to:

```tsx
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

import { CustomRolesSection } from '@/components/settings/members/CustomRolesSection';
import {
  useCustomRoles,
  useInvitations,
  useInviteLinks,
  useMembers,
  useMembersMutations,
} from '@/components/settings/members/data/useMembersData';
import { InvitationsSection } from '@/components/settings/members/InvitationsSection';
import { InviteLinksSection } from '@/components/settings/members/InviteLinksSection';
import { MembersSection } from '@/components/settings/members/MembersSection';
import {
  buildRoleOptions,
  CUSTOM_ROLE_FORM_FIELDS,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from '@/components/settings/members/shared';
```

- [ ] **Step 4: Repoint `MembersPage.test.tsx` membersKeys import**

In `apps/web/src/modules/members/MembersPage.test.tsx`, change:

```tsx
import { membersKeys } from './data/membersKeys';
```

to:

```tsx
import { membersKeys } from '@/components/settings/members/data/membersKeys';
```

(`import { MembersPage } from './MembersPage'` stays — that file has not moved.)

- [ ] **Step 5: Verify typecheck + the moved tests pass**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no errors).

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members/MembersSection.test.tsx src/modules/members/MembersPage.test.tsx`
Expected: PASS — both tests green from their new/updated import paths.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/settings/members apps/web/src/modules/members
git commit -m "refactor: relocate members UI + data layer into components/settings/members

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Roles container — `MembersRolesSection`

A stateful container that owns the custom-roles query, role mutations, and role dialog. Logic lifted verbatim from `MembersPage` (the role-related handlers and dialog). `CustomRolesSection` already renders its own "Add custom role" button via `onCreate`.

**Files:**

- Create: `apps/web/src/components/settings/members/MembersRolesSection.tsx`
- Test: `apps/web/src/components/settings/members/MembersRolesSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members/MembersRolesSection.test.tsx`
Expected: FAIL — `Failed to resolve import "./MembersRolesSection"` (file does not exist yet).

- [ ] **Step 3: Write the implementation**

```tsx
// apps/web/src/components/settings/members/MembersRolesSection.tsx
import { useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

import { CustomRolesSection } from './CustomRolesSection';
import { useCustomRoles, useMembersMutations } from './data/useMembersData';
import { CUSTOM_ROLE_FORM_FIELDS } from './shared';

export function MembersRolesSection() {
  const rolesQuery = useCustomRoles();
  const mutations = useMembersMutations();
  const customRoles = rolesQuery.data ?? [];

  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OsirisCustomRole | null>(null);

  const handleSaveRole = async (values: Record<string, FormFieldValue>) => {
    // TODO(members): permission + module multiselect editors (sent empty for now).
    await mutations.saveCustomRole.mutateAsync({
      roleId: editingRole?.id ?? null,
      input: {
        name: String(values.name ?? '').trim(),
        description: String(values.description ?? '').trim(),
        baseRole: String(values.baseRole ?? 'member') as 'member' | 'viewer',
        agentAccess: Boolean(values.agentAccess),
        permissions: [],
        allowedModules: [],
      },
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await mutations.deleteCustomRole.mutateAsync(roleId);
    } catch {
      /* surfaced by onError toast */
    }
  };

  return (
    <>
      <CustomRolesSection
        roles={customRoles}
        onCreate={() => {
          setEditingRole(null);
          setRoleOpen(true);
        }}
        onEdit={(role) => {
          setEditingRole(role);
          setRoleOpen(true);
        }}
        onDelete={handleDeleteRole}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={roleOpen}
        onOpenChange={(open) => {
          setRoleOpen(open);
          if (!open) setEditingRole(null);
        }}
        title={editingRole ? 'Edit custom role' : 'Add custom role'}
        fields={CUSTOM_ROLE_FORM_FIELDS}
        defaultValues={{
          name: editingRole?.name ?? '',
          description: editingRole?.description ?? '',
          baseRole: editingRole?.baseRole ?? 'member',
          agentAccess: editingRole?.agentAccess ?? false,
        }}
        submitLabel={editingRole ? 'Save' : 'Create'}
        isSubmitting={mutations.saveCustomRole.isPending}
        onSubmit={handleSaveRole}
      />
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members/MembersRolesSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/settings/members/MembersRolesSection.tsx apps/web/src/components/settings/members/MembersRolesSection.test.tsx
git commit -m "feat: add MembersRolesSection settings container

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: People container — `MembersPeopleSection`

A stateful container that owns the members/invitations/links queries + mutations, the invite and create-link dialogs, and the inline member action handlers. Logic lifted verbatim from `MembersPage`. The "Invite member" button lives inside the section body (base-ui `Button`, matching the in-section action pattern used by `InviteLinksSection`/`CustomRolesSection`), since settings sections have no page-header CTA slot. Invitations and Invite links get lightweight subheadings.

**Files:**

- Create: `apps/web/src/components/settings/members/MembersPeopleSection.tsx`
- Test: `apps/web/src/components/settings/members/MembersPeopleSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members/MembersPeopleSection.test.tsx`
Expected: FAIL — `Failed to resolve import "./MembersPeopleSection"`.

- [ ] **Step 3: Write the implementation**

```tsx
// apps/web/src/components/settings/members/MembersPeopleSection.tsx
import { Button } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import { UserAddIcon } from '@/lib/icons';

import {
  useCustomRoles,
  useInvitations,
  useInviteLinks,
  useMembers,
  useMembersMutations,
} from './data/useMembersData';
import { InvitationsSection } from './InvitationsSection';
import { InviteLinksSection } from './InviteLinksSection';
import { MembersSection } from './MembersSection';
import {
  buildRoleOptions,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from './shared';

export function MembersPeopleSection() {
  const membersQuery = useMembers();
  const invitationsQuery = useInvitations();
  const linksQuery = useInviteLinks();
  const rolesQuery = useCustomRoles();
  const mutations = useMembersMutations();

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const invitations = useMemo(() => invitationsQuery.data ?? [], [invitationsQuery.data]);
  const links = useMemo(() => linksQuery.data ?? [], [linksQuery.data]);
  const customRoles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Inline actions resolve once the request settles (so each section's confirm
  // dialog closes on completion) and never reject — failures surface via the
  // mutation's own onError toast.
  const handleChangeRole = async (userId: string, value: string) => {
    try {
      await mutations.updateMemberRole.mutateAsync({ userId, input: roleValueToInput(value) });
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await mutations.removeMember.mutateAsync(userId);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await mutations.revokeInvitation.mutateAsync(id);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRevokeLink = async (id: string) => {
    try {
      await mutations.revokeInviteLink.mutateAsync(id);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleInvite = async (values: Record<string, FormFieldValue>) => {
    const { role, customRoleId } = roleValueToInput(String(values.role ?? 'member'));
    await mutations.createInvitation.mutateAsync({
      email: String(values.email ?? '').trim(),
      // roleValueToInput never yields 'owner' here (not an invitable option); narrow to the invite role union.
      role: role === 'owner' ? 'member' : role,
      customRoleId,
      expiresInDays: Number(values.expiresInDays ?? 7),
    });
  };

  const handleCreateLink = async (values: Record<string, FormFieldValue>) => {
    await mutations.createInviteLink.mutateAsync({
      role: String(values.role ?? 'member') as 'member' | 'viewer',
      maxUses: Number(values.maxUses ?? 10),
      expiresInDays: Number(values.expiresInDays ?? 7),
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            {/* eslint-disable-next-line oktavius/no-bare-jsx-strings -- members module pending i18n */}
            <UserAddIcon size={14} className="mr-1.5" aria-hidden="true" />
            Invite member
          </Button>
        </div>
        <MembersSection
          members={members}
          customRoles={customRoles}
          isLoading={membersQuery.isLoading}
          onChangeRole={handleChangeRole}
          onRemove={handleRemoveMember}
        />
      </section>

      <section className="space-y-3">
        {/* eslint-disable-next-line oktavius/no-bare-jsx-strings -- members module pending i18n */}
        <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
        <InvitationsSection invitations={invitations} onRevoke={handleRevokeInvitation} />
      </section>

      <section className="space-y-3">
        {/* eslint-disable-next-line oktavius/no-bare-jsx-strings -- members module pending i18n */}
        <h3 className="text-sm font-semibold text-foreground">Invite links</h3>
        <InviteLinksSection
          links={links}
          onCreate={() => setLinkOpen(true)}
          onRevoke={handleRevokeLink}
        />
      </section>

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite member"
        description="Send an email invitation to join this workspace."
        fields={inviteFormFields(roleOptions)}
        defaultValues={{ email: '', role: 'member', expiresInDays: 7 }}
        submitLabel="Send invite"
        isSubmitting={mutations.createInvitation.isPending}
        onSubmit={handleInvite}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Create invite link"
        description="Generate a shareable link with a fixed role and usage cap."
        fields={INVITE_LINK_FORM_FIELDS}
        defaultValues={{ role: 'member', maxUses: 10, expiresInDays: 7 }}
        submitLabel="Create link"
        isSubmitting={mutations.createInviteLink.isPending}
        onSubmit={handleCreateLink}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members/MembersPeopleSection.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/settings/members/MembersPeopleSection.tsx apps/web/src/components/settings/members/MembersPeopleSection.test.tsx
git commit -m "feat: add MembersPeopleSection settings container

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Register People + Roles as Workspace settings sections

Add two entries to `SettingsPage`'s `settingsSections` array, both `group: 'Workspace'` and gated by `permission: 'org.members.manage'`. `SettingsPageFactory` already filters by `permission` via `canUsePermissionRequirement`, so no factory change is needed.

**Files:**

- Modify: `apps/web/src/modules/settings/SettingsPage.tsx`

- [ ] **Step 1: Add imports**

In `apps/web/src/modules/settings/SettingsPage.tsx`, add the two section imports. Place them with the other `@/components/settings/*` imports (alphabetical) near the top:

```tsx
import { MembersPeopleSection } from '@/components/settings/members/MembersPeopleSection';
import { MembersRolesSection } from '@/components/settings/members/MembersRolesSection';
```

Add `LockIcon` and `TeamIcon` to the existing `@/lib/icons` import block (it currently imports `BrainIcon, DocumentIcon, EmailIcon, GlobeIcon, LocationIcon, NotificationsIcon, OrganizationIcon, PlusIcon, SlidersHorizontalIcon, UserCircleIcon, WhatsAppIcon`):

```tsx
import {
  BrainIcon,
  DocumentIcon,
  EmailIcon,
  GlobeIcon,
  LocationIcon,
  LockIcon,
  NotificationsIcon,
  OrganizationIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  TeamIcon,
  UserCircleIcon,
  WhatsAppIcon,
} from '@/lib/icons';
```

- [ ] **Step 2: Add the two section objects**

In the `settingsSections` array, immediately after the `organization` section object (the one with `id: 'organization'`, closing at `},` before `id: 'ai'`), insert:

```tsx
    {
      id: 'people',
      group: 'Workspace',
      label: 'People',
      icon: <TeamIcon size={16} weight="duotone" />,
      title: 'People',
      sectionDescription: 'Members, pending invitations, and invite links for this workspace.',
      permission: 'org.members.manage',
      render: () => <MembersPeopleSection />,
    },
    {
      id: 'roles',
      group: 'Workspace',
      label: 'Roles',
      icon: <LockIcon size={16} weight="duotone" />,
      title: 'Custom roles',
      sectionDescription: 'Organization-specific permission roles.',
      permission: 'org.members.manage',
      render: () => <MembersRolesSection />,
    },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Verify the sections appear under the right gate (manual smoke via build)**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/settings/members`
Expected: PASS (the two container tests still green).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/settings/SettingsPage.tsx
git commit -m "feat: add People and Roles sections to Settings (Workspace group)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Remove the standalone module, redirect `/members`, delete old page

Remove the `members` nav entry, delete `MembersPage` + its test, add a `/members` → `/settings?section=people` redirect mirroring the existing `/profile` redirect, and add a redirect test. Extract the protected route children into an exported `PROTECTED_ROUTE_CHILDREN` constant so the redirect target is unit-testable without rendering the app.

**Files:**

- Modify: `apps/web/src/lib/appNavModules.ts`
- Modify: `apps/web/src/app/router.tsx`
- Delete: `apps/web/src/modules/members/MembersPage.tsx`, `apps/web/src/modules/members/MembersPage.test.tsx`
- Create: `apps/web/src/app/router.test.tsx`
- Modify: i18n locale files (remove `navigation.members`)

- [ ] **Step 1: Remove the `members` nav entry**

In `apps/web/src/lib/appNavModules.ts`, delete the entire `members` entry object:

```tsx
  {
    id: 'members',
    path: '/members',
    label: 'Members',
    labelKey: 'navigation.members',
    icon: TeamIcon,
    section: 'admin',
    permission: 'org.members.manage',
    loadPage: () => import('@/modules/members/MembersPage'),
    pageExport: 'MembersPage',
  },
```

If `TeamIcon` is now unused in this file, remove it from the icon import. (Check: `grep -n "TeamIcon" apps/web/src/lib/appNavModules.ts` — if only the import line remains, drop it.)

- [ ] **Step 2: Delete the old page and its test**

```bash
git rm apps/web/src/modules/members/MembersPage.tsx apps/web/src/modules/members/MembersPage.test.tsx
```

After this, `apps/web/src/modules/members/` should be empty. Remove the now-empty directory if git left it:

```bash
rmdir apps/web/src/modules/members 2>/dev/null || true
```

- [ ] **Step 3: Extract `PROTECTED_ROUTE_CHILDREN` and add the redirect in `router.tsx`**

In `apps/web/src/app/router.tsx`, add `type RouteObject` to the `react-router-dom` import:

```tsx
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
  RouterProvider,
  useLocation,
} from 'react-router-dom';
```

Replace the inline children array of the gate route. Currently:

```tsx
      {
        element: (
          <OsirisAccessGate>
            <AppLayout />
          </OsirisAccessGate>
        ),
        errorElement: <RouteErrorPage />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          ...APP_NAV_MODULES.map((module) => ({
            path: module.path,
            element: moduleRouteElement(module),
          })),
          { path: '/profile', element: <Navigate to="/settings?section=account" replace /> },
          { path: '/access-denied', element: modulePageElement('access-denied', AccessDeniedPage) },
          { path: '*', element: modulePageElement('not-found', AppNotFoundPage) },
        ],
      },
```

Extract the children into a named export above `appRouter`, and add the `/members` redirect next to `/profile`:

```tsx
export const PROTECTED_ROUTE_CHILDREN: RouteObject[] = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  ...APP_NAV_MODULES.map((module) => ({
    path: module.path,
    element: moduleRouteElement(module),
  })),
  { path: '/members', element: <Navigate to="/settings?section=people" replace /> },
  { path: '/profile', element: <Navigate to="/settings?section=account" replace /> },
  { path: '/access-denied', element: modulePageElement('access-denied', AccessDeniedPage) },
  { path: '*', element: modulePageElement('not-found', AppNotFoundPage) },
];

const appRouter = sentryCreateBrowserRouter([
  {
    element: <AppRootProviders />,
    children: [
      { path: '/login', element: pageElement(LoginPage) },
      { path: '/forgot-password', element: pageElement(ForgotPasswordPage) },
      { path: '/reset-password', element: pageElement(ResetPasswordPage) },
      { path: '/signup', element: pageElement(SignUpPage) },
      { path: '/auth/callback', element: pageElement(AuthCallbackPage) },
      { path: '/invite/:token', element: pageElement(InvitePage) },
      {
        element: (
          <OsirisAccessGate>
            <AppLayout />
          </OsirisAccessGate>
        ),
        errorElement: <RouteErrorPage />,
        children: PROTECTED_ROUTE_CHILDREN,
      },
    ],
  },
]);
```

- [ ] **Step 4: Write the redirect test**

```tsx
// apps/web/src/app/router.test.tsx
import { isValidElement } from 'react';
import { describe, expect, it } from 'vitest';

import { PROTECTED_ROUTE_CHILDREN } from './router';

describe('app routing', () => {
  it('redirects /members to the People settings section', () => {
    const route = PROTECTED_ROUTE_CHILDREN.find((entry) => entry.path === '/members');
    expect(route).toBeDefined();
    expect(isValidElement(route?.element)).toBe(true);
    expect((route?.element as { props: { to: string } }).props.to).toBe('/settings?section=people');
  });

  it('still redirects /profile to the Account settings section', () => {
    const route = PROTECTED_ROUTE_CHILDREN.find((entry) => entry.path === '/profile');
    expect((route?.element as { props: { to: string } }).props.to).toBe(
      '/settings?section=account',
    );
  });
});
```

- [ ] **Step 5: Run the redirect test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/app/router.test.tsx`
Expected: PASS — both redirect assertions green.

- [ ] **Step 6: Remove the now-unused `navigation.members` i18n key**

Find and remove the key from every locale file that defines it:

Run: `grep -rln "navigation.members\|\"members\"" apps/web/src packages/i18n 2>/dev/null | grep -iE "locale|messages|\.json|navigation"`

For each locale file (expected: an `en` and a `de` translation source), remove the `members` entry under the `navigation` namespace. If the repo has an i18n key scanner (per the codegen/scanner tooling), run it to confirm no dangling references:

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no missing-key type errors).

> If `navigation.members` is still referenced anywhere after Step 1 (it should not be — the only consumer was the deleted nav entry), leave the key in place and note it; do not break a live reference.

- [ ] **Step 7: Typecheck + full apps/web test suite**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS.

Run: `pnpm --filter @oktavius/web exec vitest run`
Expected: PASS — full suite green, including the moved members tests, the two new containers, and the redirect test.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/appNavModules.ts apps/web/src/app/router.tsx apps/web/src/app/router.test.tsx apps/web/src
git commit -m "feat: redirect /members to Settings People section; remove standalone module

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole repo**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Lint (catches bare-jsx-strings, import-order, cross-module rules)**

Run: `pnpm --filter @oktavius/web exec eslint src/components/settings/members src/modules/settings/SettingsPage.tsx src/app/router.tsx src/lib/appNavModules.ts`
Expected: PASS (no errors).

- [ ] **Step 3: Full test suite**

Run: `pnpm --filter @oktavius/web exec vitest run`
Expected: PASS.

- [ ] **Step 4: Production build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 5: Manual smoke (dev server)**

Run the app, sign in as an `org.members.manage` holder, and confirm:

- Settings → Workspace group shows **People** and **Roles**.
- People: members table loads, "Invite member" opens the invite dialog, role change + remove work, invitations and invite links render with their create/revoke actions.
- Roles: custom roles load, add/edit/delete work.
- Visiting `/members` redirects to `/settings?section=people`.
- A non-admin (no `org.members.manage`) sees neither section.

---

## Self-Review

**Spec coverage:**

- Two Workspace sections (People, Roles), `org.members.manage`-gated → Task 4. ✓
- People = members + invitations + invite links combined → Task 3. ✓
- Roles = custom roles + dialog → Task 2. ✓
- `/members` redirect to `/settings?section=people`; standalone module + nested section-nav removed → Task 5. ✓
- File relocation into `@/components/settings/members/` for the cross-module constraint → Task 1. ✓
- Capabilities unchanged; no per-member location dialog; custom-role permissions/modules still `[]` → handlers lifted verbatim (Tasks 2-3). ✓
- Tests: moved `MembersSection` test (Task 1), new container tests (Tasks 2-3), redirect test (Task 5), permission-gating verified manually (Task 6). ✓

**Type consistency:** `MembersPeopleSection`/`MembersRolesSection` are named exports used identically in `SettingsPage` and tests. `useMembersData` hook names (`useMembers`, `useInvitations`, `useInviteLinks`, `useCustomRoles`, `useMembersMutations`) and mutation field names (`updateMemberRole`, `removeMember`, `createInvitation`, `revokeInvitation`, `createInviteLink`, `revokeInviteLink`, `saveCustomRole`, `deleteCustomRole`) match the source file read during planning. `membersKeys.members/roles(org)` signatures match. `PROTECTED_ROUTE_CHILDREN` is `RouteObject[]`, consumed by both `appRouter` and the test.

**Placeholders:** none — every code step contains full content. The only `TODO` is the pre-existing, intentional `TODO(members)` for deferred multiselect editors (carried over verbatim per spec).
