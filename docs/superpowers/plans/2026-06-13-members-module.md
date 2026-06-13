# Members Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone **Members** admin module to the V3 frontend for managing org users — list members, change roles, remove, invite by email, create shareable invite links, and manage custom roles — following the V3 UI rules and Osiris runtime-adapter pattern.

**Architecture:** Three typed fetch clients (mirroring `locationAdminClient`) wired as optional methods on `OsirisRuntimeState` in `AuthProvider`. A `members` admin manifest entry routes to `MembersPage` — a `ModulePage` + `SettingsPageFactory` with four section components (Members, Invitations, Invite links, Roles), each in its own focused file for easy adjustment. The Members list uses `CrudListShell` (the embeddable toolbar+grid+pagination, since `CrudMainView` is itself a `ModulePage`). The single page-header `cta` is "Invite member".

**Tech Stack:** React 19, TypeScript, Tailwind v3, base-ui (`@oktavius/base-ui`), vitest, `fetch`-based Osiris clients, `nuqs` (`useListPageState`).

---

## Component reuse & gaps (read before starting)

**Reused as-is (do not reinvent):** `CrudListShell`, `statusColumn`, `CrudColumn`/`CrudRowAction`/`BulkAction` (`@/components/data`), `SettingsPageFactory`, `SettingsSection`/`SettingsTable` (base-ui), `SubEntityFormDialog`, `ConfirmActionDialog`, `StatusBadge`, `RoleSelector`, `Combobox`/`MultiSelect`/`Switch`/`Button`/`Badge` (base-ui), `useListPageState`, `appToast`, `formatDisplayDate`, `modulePageIcon`, `requireOrgId` pattern in `AuthProvider`.

**Already done — NO work needed (verified):** The invitee acceptance flow at `/invite/:token` (`InvitePage` in `modules/auth/AuthPlaceholderPage.tsx`) is fully implemented and tested (`AuthInvitePages.test.tsx`): token resolve, auto-accept, signed-in accept CTA, anonymous login/signup redirect with `?invitedEmail=&inviteToken=`, and all error states. The `acceptUrl` we return from `createInvitation` (`/invite/:token`) lands directly in this existing flow. **This plan adds the admin side only.**

**Missing components (flagged):**

- There is **no `EntityAvatar`** in `apps/web` (the component-registry references it aspirationally). The Members list renders an initials avatar via the base-ui `Avatar` primitive (`@oktavius/base-ui`, exported from `components/avatar`). If a richer shared avatar is wanted later, that's a separate component to build — call it out, don't inline a bespoke one elsewhere.
- **i18n:** the V3 i18n namespaces are codegen-driven. Following the existing `SettingsPage` precedent (which hardcodes English section labels like "General"/"Locations"), this module uses inline English strings + the manifest `label` fallback. The nav entry sets `labelKey: 'navigation.members'` which gracefully falls back to `label: 'Members'` until the key is generated. Do **not** hand-edit generated i18n files.

**API contract (Osiris, `/v1`), all gated by `org.members.manage`:**

- `GET /orgs/:orgId/users` → `{ users }`; `PUT /orgs/:orgId/users/:userId/role` `{ role, customRoleId? }` → `{ membership }`; `DELETE /orgs/:orgId/users/:userId` → `{ success, message }`.
- `GET|POST /invitations/orgs/:orgId/invitations`; `DELETE /invitations/orgs/:orgId/invitations/:id`.
- `GET|POST /invitations/orgs/:orgId/links`; `DELETE /invitations/orgs/:orgId/links/:id`.
- `GET|POST /orgs/:orgId/custom-roles`; `PUT|DELETE /orgs/:orgId/custom-roles/:roleId`.

## File structure

Create:

- `apps/web/src/runtime/osiris/membersAdminClient.ts` (+ `.test.ts`)
- `apps/web/src/runtime/osiris/invitationsAdminClient.ts` (+ `.test.ts`)
- `apps/web/src/runtime/osiris/customRolesAdminClient.ts` (+ `.test.ts`)
- `apps/web/src/modules/members/shared.tsx`
- `apps/web/src/modules/members/MembersPage.tsx`
- `apps/web/src/modules/members/MembersSection.tsx`
- `apps/web/src/modules/members/InvitationsSection.tsx`
- `apps/web/src/modules/members/InviteLinksSection.tsx`
- `apps/web/src/modules/members/CustomRolesSection.tsx`
- `apps/web/src/modules/members/MembersPage.test.tsx`

Modify:

- `apps/web/src/runtime/osiris/types.ts` (runtime method types)
- `apps/web/src/runtime/osiris/AuthProvider.tsx` (instantiate clients + wire methods)
- `apps/web/src/lib/appNavModules.ts` (manifest entry)
- `apps/web/src/lib/org-profiles/types.ts` (`OrgModuleId`)
- `apps/web/src/lib/org-profiles/profiles.ts` (`DEFAULT_ORG_MODULES`)
- `apps/web/src/lib/modulePageIcons.tsx` (`membersPageIcon`)

Commands (run from `apps/web` unless noted): test `pnpm vitest run <path>`; lint `pnpm lint`; types `pnpm typecheck`; build `pnpm build`. Repo root has `pnpm test`/`pnpm typecheck` across the workspace.

---

### Task 1: membersAdminClient

**Files:**

- Create: `apps/web/src/runtime/osiris/membersAdminClient.ts`
- Test: `apps/web/src/runtime/osiris/membersAdminClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/membersAdminClient.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisMembersAdminClient } from './membersAdminClient';

describe('createOsirisMembersAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists and normalizes org members (snake or camel)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          users: [
            {
              user_id: 'usr_1',
              membership_id: 'mem_1',
              org_role: 'admin',
              custom_role_id: null,
              email: 'anna@example.test',
              full_name: 'Anna Admin',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisMembersAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const members = await client.listOrgMembers('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/users', {
      credentials: 'include',
    });
    expect(members).toEqual([
      {
        userId: 'usr_1',
        membershipId: 'mem_1',
        role: 'admin',
        customRoleId: null,
        email: 'anna@example.test',
        fullName: 'Anna Admin',
      },
    ]);
  });

  it('updates a member role and removes a member', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ membership: { id: 'mem_1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const client = createOsirisMembersAdminClient();
    await client.updateMemberRole('org_1', 'usr_1', { role: 'member', customRoleId: null });
    await client.removeMember('org_1', 'usr_1');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/orgs/org_1/users/usr_1/role', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'member', customRoleId: null }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/orgs/org_1/users/usr_1', {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('throws a readable error when the list request fails', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }),
    );
    const client = createOsirisMembersAdminClient();
    await expect(client.listOrgMembers('org_1')).rejects.toThrow('Forbidden');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/runtime/osiris/membersAdminClient.test.ts`
Expected: FAIL — `Cannot find module './membersAdminClient'`.

- [ ] **Step 3: Write the client**

```ts
// apps/web/src/runtime/osiris/membersAdminClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import type { OsirisOrgRole } from './types';

export type OsirisOrgMember = {
  userId: string;
  membershipId: string | null;
  role: OsirisOrgRole;
  customRoleId: string | null;
  email: string | null;
  fullName: string;
};

export type OsirisUpdateMemberRoleInput = {
  role: OsirisOrgRole;
  customRoleId?: string | null;
};

export type OsirisMembersAdminClientOptions = {
  baseUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function readStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

const ORG_ROLES: readonly OsirisOrgRole[] = ['owner', 'admin', 'member', 'viewer'];

function readRole(value: unknown): OsirisOrgRole {
  return ORG_ROLES.includes(value as OsirisOrgRole) ? (value as OsirisOrgRole) : 'member';
}

function normalizeMember(row: unknown): OsirisOrgMember {
  const value = readRecord(row);
  return {
    userId: readString(value.user_id ?? value.userId),
    membershipId: readStringOrNull(value.membership_id ?? value.membershipId),
    role: readRole(value.org_role ?? value.orgRole ?? value.role),
    customRoleId: readStringOrNull(value.custom_role_id ?? value.customRoleId),
    email: readStringOrNull(value.email),
    fullName: readString(value.full_name ?? value.fullName),
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  if (!text) return fallback;
  try {
    const payload: unknown = JSON.parse(text);
    if (isRecord(payload) && typeof payload.message === 'string') return payload.message;
    if (isRecord(payload) && typeof payload.error === 'string') return payload.error;
    if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === 'string') {
      return payload.error.message;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function createOsirisMembersAdminClient(options: OsirisMembersAdminClientOptions = {}) {
  return {
    async listOrgMembers(orgId: string): Promise<OsirisOrgMember[]> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/users`),
        { credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Members could not be loaded.'));
      }
      const payload: unknown = await response.json();
      const users = readRecord(payload).users;
      return Array.isArray(users) ? users.map(normalizeMember) : [];
    },

    async updateMemberRole(
      orgId: string,
      userId: string,
      input: OsirisUpdateMemberRoleInput,
    ): Promise<void> {
      const response = await fetch(
        joinOsirisApiBaseUrl(
          options.baseUrl,
          `/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/role`,
        ),
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: input.role, customRoleId: input.customRoleId ?? null }),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Role could not be updated.'));
      }
    },

    async removeMember(orgId: string, userId: string): Promise<void> {
      const response = await fetch(
        joinOsirisApiBaseUrl(
          options.baseUrl,
          `/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`,
        ),
        { method: 'DELETE', credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Member could not be removed.'));
      }
    },
  };
}
```

> Note: `OsirisOrgRole` is already exported from `runtime/osiris/types.ts` (`'owner' | 'admin' | 'member' | 'viewer'`).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/runtime/osiris/membersAdminClient.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/membersAdminClient.ts apps/web/src/runtime/osiris/membersAdminClient.test.ts
git commit -m "feat(members): osiris members admin client"
```

---

### Task 2: invitationsAdminClient

**Files:**

- Create: `apps/web/src/runtime/osiris/invitationsAdminClient.ts`
- Test: `apps/web/src/runtime/osiris/invitationsAdminClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/invitationsAdminClient.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisInvitationsAdminClient } from './invitationsAdminClient';

describe('createOsirisInvitationsAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists email invitations and creates one (returning acceptUrl)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitations: [
              {
                id: 'inv_1',
                org_id: 'org_1',
                email: 'bob@example.test',
                role: 'member',
                token: 'tok_1',
                invited_by: 'usr_a',
                expires_at: '2026-07-01T00:00:00.000Z',
                accepted_at: null,
                created_at: '2026-06-13T00:00:00.000Z',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitation: { id: 'inv_2', email: 'cara@example.test', role: 'viewer' },
            acceptUrl: '/invite/tok_2',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const client = createOsirisInvitationsAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const invitations = await client.listInvitations('org_1');
    const created = await client.createInvitation('org_1', {
      email: 'cara@example.test',
      role: 'viewer',
      expiresInDays: 7,
    });

    expect(invitations[0]).toEqual({
      id: 'inv_1',
      orgId: 'org_1',
      email: 'bob@example.test',
      role: 'member',
      customRoleId: null,
      token: 'tok_1',
      invitedBy: 'usr_a',
      expiresAt: '2026-07-01T00:00:00.000Z',
      acceptedAt: null,
      createdAt: '2026-06-13T00:00:00.000Z',
    });
    expect(created.acceptUrl).toBe('/invite/tok_2');
    expect(created.invitation.email).toBe('cara@example.test');
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/v1/invitations/orgs/org_1/invitations',
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'cara@example.test',
          role: 'viewer',
          customRoleId: null,
          expiresInDays: 7,
        }),
      },
    );
  });

  it('revokes invitations, lists/creates/revokes links', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // revokeInvitation
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            links: [
              {
                id: 'lnk_1',
                org_id: 'org_1',
                token: 't',
                role: 'member',
                max_uses: 10,
                use_count: 2,
                created_by: 'usr_a',
                expires_at: 'x',
                created_at: 'y',
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ link: { id: 'lnk_2', role: 'viewer' }, inviteUrl: '/invite/tok_link' }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 })); // revokeInviteLink

    const client = createOsirisInvitationsAdminClient();
    await client.revokeInvitation('org_1', 'inv_1');
    const links = await client.listInviteLinks('org_1');
    const created = await client.createInviteLink('org_1', {
      role: 'viewer',
      maxUses: 5,
      expiresInDays: 14,
    });
    await client.revokeInviteLink('org_1', 'lnk_1');

    expect(links[0]).toEqual({
      id: 'lnk_1',
      orgId: 'org_1',
      token: 't',
      role: 'member',
      customRoleId: null,
      maxUses: 10,
      useCount: 2,
      createdBy: 'usr_a',
      expiresAt: 'x',
      createdAt: 'y',
    });
    expect(created.inviteUrl).toBe('/invite/tok_link');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/invitations/orgs/org_1/invitations/inv_1', {
      method: 'DELETE',
      credentials: 'include',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/invitations/orgs/org_1/links', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'viewer', customRoleId: null, maxUses: 5, expiresInDays: 14 }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/runtime/osiris/invitationsAdminClient.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the client**

```ts
// apps/web/src/runtime/osiris/invitationsAdminClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from './osirisClientUtils';

export type OsirisInvitationRole = 'admin' | 'member' | 'viewer';
export type OsirisInviteLinkRole = 'member' | 'viewer';

export type OsirisInvitation = {
  id: string;
  orgId: string | null;
  email: string | null;
  role: OsirisInvitationRole;
  customRoleId: string | null;
  token: string;
  invitedBy: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string | null;
};

export type OsirisInviteLink = {
  id: string;
  orgId: string | null;
  token: string;
  role: OsirisInviteLinkRole;
  customRoleId: string | null;
  maxUses: number;
  useCount: number;
  createdBy: string | null;
  expiresAt: string | null;
  createdAt: string | null;
};

export type OsirisCreateInvitationInput = {
  email: string;
  role: OsirisInvitationRole;
  customRoleId?: string | null;
  expiresInDays: number;
};

export type OsirisCreateInviteLinkInput = {
  role: OsirisInviteLinkRole;
  customRoleId?: string | null;
  maxUses: number;
  expiresInDays: number;
};

export type OsirisCreatedInvitation = { invitation: OsirisInvitation; acceptUrl: string };
export type OsirisCreatedInviteLink = { link: OsirisInviteLink; inviteUrl: string };

export type OsirisInvitationsAdminClientOptions = { baseUrl?: string };

function normalizeInvitation(row: unknown): OsirisInvitation {
  const v = readRecord(row);
  const role = v.role;
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    email: readStringOrNull(v.email),
    role: role === 'admin' || role === 'viewer' ? role : 'member',
    customRoleId: readStringOrNull(v.custom_role_id ?? v.customRoleId),
    token: readString(v.token),
    invitedBy: readStringOrNull(v.invited_by ?? v.invitedBy),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    acceptedAt: readStringOrNull(v.accepted_at ?? v.acceptedAt),
    createdAt: readStringOrNull(v.created_at ?? v.createdAt),
  };
}

function normalizeInviteLink(row: unknown): OsirisInviteLink {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    token: readString(v.token),
    role: v.role === 'viewer' ? 'viewer' : 'member',
    customRoleId: readStringOrNull(v.custom_role_id ?? v.customRoleId),
    maxUses: readNumber(v.max_uses ?? v.maxUses),
    useCount: readNumber(v.use_count ?? v.useCount),
    createdBy: readStringOrNull(v.created_by ?? v.createdBy),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    createdAt: readStringOrNull(v.created_at ?? v.createdAt),
  };
}

export function createOsirisInvitationsAdminClient(
  options: OsirisInvitationsAdminClientOptions = {},
) {
  const base = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  const org = (orgId: string) => `/invitations/orgs/${encodeURIComponent(orgId)}`;

  return {
    async listInvitations(orgId: string): Promise<OsirisInvitation[]> {
      const response = await fetch(base(`${org(orgId)}/invitations`), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitations could not be loaded.'));
      const invitations = readRecord(await response.json()).invitations;
      return Array.isArray(invitations) ? invitations.map(normalizeInvitation) : [];
    },

    async createInvitation(
      orgId: string,
      input: OsirisCreateInvitationInput,
    ): Promise<OsirisCreatedInvitation> {
      const response = await fetch(base(`${org(orgId)}/invitations`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          role: input.role,
          customRoleId: input.customRoleId ?? null,
          expiresInDays: input.expiresInDays,
        }),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitation could not be created.'));
      const payload = readRecord(await response.json());
      return {
        invitation: normalizeInvitation(payload.invitation),
        acceptUrl: readString(payload.acceptUrl),
      };
    },

    async revokeInvitation(orgId: string, invitationId: string): Promise<void> {
      const response = await fetch(
        base(`${org(orgId)}/invitations/${encodeURIComponent(invitationId)}`),
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitation could not be revoked.'));
    },

    async listInviteLinks(orgId: string): Promise<OsirisInviteLink[]> {
      const response = await fetch(base(`${org(orgId)}/links`), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite links could not be loaded.'));
      const links = readRecord(await response.json()).links;
      return Array.isArray(links) ? links.map(normalizeInviteLink) : [];
    },

    async createInviteLink(
      orgId: string,
      input: OsirisCreateInviteLinkInput,
    ): Promise<OsirisCreatedInviteLink> {
      const response = await fetch(base(`${org(orgId)}/links`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: input.role,
          customRoleId: input.customRoleId ?? null,
          maxUses: input.maxUses,
          expiresInDays: input.expiresInDays,
        }),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite link could not be created.'));
      const payload = readRecord(await response.json());
      return { link: normalizeInviteLink(payload.link), inviteUrl: readString(payload.inviteUrl) };
    },

    async revokeInviteLink(orgId: string, linkId: string): Promise<void> {
      const response = await fetch(base(`${org(orgId)}/links/${encodeURIComponent(linkId)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite link could not be revoked.'));
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/runtime/osiris/invitationsAdminClient.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/invitationsAdminClient.ts apps/web/src/runtime/osiris/invitationsAdminClient.test.ts
git commit -m "feat(members): osiris invitations admin client"
```

---

### Task 3: customRolesAdminClient

**Files:**

- Create: `apps/web/src/runtime/osiris/customRolesAdminClient.ts`
- Test: `apps/web/src/runtime/osiris/customRolesAdminClient.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/runtime/osiris/customRolesAdminClient.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisCustomRolesAdminClient } from './customRolesAdminClient';

describe('createOsirisCustomRolesAdminClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lists and normalizes custom roles', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          customRoles: [
            {
              id: 'role_1',
              name: 'Dispatcher',
              description: 'Handles routing',
              base_role: 'member',
              agent_access: true,
              permissions: ['calendar.view'],
              allowed_modules: ['calendar'],
              member_count: 3,
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const client = createOsirisCustomRolesAdminClient({ baseUrl: 'https://api.example.test/v1' });
    const roles = await client.listCustomRoles('org_1');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/orgs/org_1/custom-roles', {
      credentials: 'include',
    });
    expect(roles).toEqual([
      {
        id: 'role_1',
        name: 'Dispatcher',
        description: 'Handles routing',
        baseRole: 'member',
        agentAccess: true,
        permissions: ['calendar.view'],
        allowedModules: ['calendar'],
        memberCount: 3,
      },
    ]);
  });

  it('creates, updates, and deletes a custom role', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ customRole: { id: 'role_2', name: 'Auditor' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ customRole: { id: 'role_2', name: 'Senior Auditor' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    const client = createOsirisCustomRolesAdminClient();
    await client.createCustomRole('org_1', {
      name: 'Auditor',
      description: 'Read-only audit',
      baseRole: 'viewer',
      agentAccess: false,
      permissions: ['reports.view'],
      allowedModules: ['reports'],
    });
    await client.updateCustomRole('org_1', 'role_2', { name: 'Senior Auditor' });
    await client.deleteCustomRole('org_1', 'role_2');

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/orgs/org_1/custom-roles', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Auditor',
        description: 'Read-only audit',
        baseRole: 'viewer',
        agentAccess: false,
        permissions: ['reports.view'],
        allowedModules: ['reports'],
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/orgs/org_1/custom-roles/role_2', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Senior Auditor' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/orgs/org_1/custom-roles/role_2', {
      method: 'DELETE',
      credentials: 'include',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/runtime/osiris/customRolesAdminClient.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the client**

```ts
// apps/web/src/runtime/osiris/customRolesAdminClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringArray,
} from './osirisClientUtils';

export type OsirisCustomRoleBase = 'member' | 'viewer';

export type OsirisCustomRole = {
  id: string;
  name: string;
  description: string;
  baseRole: OsirisCustomRoleBase;
  agentAccess: boolean;
  permissions: string[];
  allowedModules: string[];
  memberCount: number;
};

export type OsirisCreateCustomRoleInput = {
  name: string;
  description?: string;
  baseRole: OsirisCustomRoleBase;
  agentAccess: boolean;
  permissions: string[];
  allowedModules: string[];
};

export type OsirisUpdateCustomRoleInput = Partial<OsirisCreateCustomRoleInput>;

export type OsirisCustomRolesAdminClientOptions = { baseUrl?: string };

function normalizeCustomRole(row: unknown): OsirisCustomRole {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    name: readString(v.name),
    description: readString(v.description),
    baseRole: (v.base_role ?? v.baseRole) === 'viewer' ? 'viewer' : 'member',
    agentAccess: Boolean(v.agent_access ?? v.agentAccess),
    permissions: readStringArray(v.permissions),
    allowedModules: readStringArray(v.allowed_modules ?? v.allowedModules),
    memberCount: readNumber(v.member_count ?? v.memberCount),
  };
}

async function readRoleResponse(response: Response): Promise<OsirisCustomRole> {
  return normalizeCustomRole(readRecord(await response.json()).customRole);
}

export function createOsirisCustomRolesAdminClient(
  options: OsirisCustomRolesAdminClientOptions = {},
) {
  const base = (orgId: string, suffix = '') =>
    joinOsirisApiBaseUrl(
      options.baseUrl,
      `/orgs/${encodeURIComponent(orgId)}/custom-roles${suffix}`,
    );

  return {
    async listCustomRoles(orgId: string): Promise<OsirisCustomRole[]> {
      const response = await fetch(base(orgId), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Roles could not be loaded.'));
      const roles = readRecord(await response.json()).customRoles;
      return Array.isArray(roles) ? roles.map(normalizeCustomRole) : [];
    },

    async createCustomRole(
      orgId: string,
      input: OsirisCreateCustomRoleInput,
    ): Promise<OsirisCustomRole> {
      const response = await fetch(base(orgId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be created.'));
      return readRoleResponse(response);
    },

    async updateCustomRole(
      orgId: string,
      roleId: string,
      input: OsirisUpdateCustomRoleInput,
    ): Promise<OsirisCustomRole> {
      const response = await fetch(base(orgId, `/${encodeURIComponent(roleId)}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be saved.'));
      return readRoleResponse(response);
    },

    async deleteCustomRole(orgId: string, roleId: string): Promise<void> {
      const response = await fetch(base(orgId, `/${encodeURIComponent(roleId)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be deleted.'));
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/runtime/osiris/customRolesAdminClient.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/runtime/osiris/customRolesAdminClient.ts apps/web/src/runtime/osiris/customRolesAdminClient.test.ts
git commit -m "feat(members): osiris custom roles admin client"
```

---

### Task 4: Wire clients onto the runtime

**Files:**

- Modify: `apps/web/src/runtime/osiris/types.ts`
- Modify: `apps/web/src/runtime/osiris/AuthProvider.tsx`

- [ ] **Step 1: Add imports + optional method types to `OsirisRuntimeState`**

In `runtime/osiris/types.ts`, add these imports near the other client-type imports at the top:

```ts
import type {
  OsirisCustomRole,
  OsirisCreateCustomRoleInput,
  OsirisUpdateCustomRoleInput,
} from './customRolesAdminClient';
import type {
  OsirisCreateInvitationInput,
  OsirisCreateInviteLinkInput,
  OsirisCreatedInvitation,
  OsirisCreatedInviteLink,
  OsirisInvitation,
  OsirisInviteLink,
} from './invitationsAdminClient';
import type { OsirisOrgMember, OsirisUpdateMemberRoleInput } from './membersAdminClient';
```

Then inside `export type OsirisRuntimeState = { ... }`, add these optional methods just after `deactivateOrgLocation?` (keep them grouped):

```ts
  listOrgMembers?: (orgId?: string | null) => Promise<OsirisOrgMember[]>;
  updateMemberRole?: (
    orgId: string | null | undefined,
    userId: string,
    input: OsirisUpdateMemberRoleInput,
  ) => Promise<void>;
  removeMember?: (orgId: string | null | undefined, userId: string) => Promise<void>;
  listInvitations?: (orgId?: string | null) => Promise<OsirisInvitation[]>;
  createInvitation?: (
    orgId: string | null | undefined,
    input: OsirisCreateInvitationInput,
  ) => Promise<OsirisCreatedInvitation>;
  revokeInvitation?: (orgId: string | null | undefined, invitationId: string) => Promise<void>;
  listInviteLinks?: (orgId?: string | null) => Promise<OsirisInviteLink[]>;
  createInviteLink?: (
    orgId: string | null | undefined,
    input: OsirisCreateInviteLinkInput,
  ) => Promise<OsirisCreatedInviteLink>;
  revokeInviteLink?: (orgId: string | null | undefined, linkId: string) => Promise<void>;
  listCustomRoles?: (orgId?: string | null) => Promise<OsirisCustomRole[]>;
  createCustomRole?: (
    orgId: string | null | undefined,
    input: OsirisCreateCustomRoleInput,
  ) => Promise<OsirisCustomRole>;
  updateCustomRole?: (
    orgId: string | null | undefined,
    roleId: string,
    input: OsirisUpdateCustomRoleInput,
  ) => Promise<OsirisCustomRole>;
  deleteCustomRole?: (orgId: string | null | undefined, roleId: string) => Promise<void>;
```

- [ ] **Step 2: Instantiate the clients in `AuthProvider.tsx`**

Add imports next to the other client imports (top of file):

```ts
import { createOsirisCustomRolesAdminClient } from './customRolesAdminClient';
import { createOsirisInvitationsAdminClient } from './invitationsAdminClient';
import { createOsirisMembersAdminClient } from './membersAdminClient';
```

Add module-scope client instances next to `osirisLocationAdminClient`:

```ts
const osirisMembersAdminClient = createOsirisMembersAdminClient({ baseUrl: OSIRIS_API_BASE_URL });
const osirisInvitationsAdminClient = createOsirisInvitationsAdminClient({
  baseUrl: OSIRIS_API_BASE_URL,
});
const osirisCustomRolesAdminClient = createOsirisCustomRolesAdminClient({
  baseUrl: OSIRIS_API_BASE_URL,
});
```

- [ ] **Step 3: Add the `useCallback` methods**

Place these immediately after the `deactivateOrgLocation` `useCallback` (before `resolveInvitationToken`). These delegate to the clients using the existing `requireOrgId(orgId ?? state.activeOrgId)` pattern. Member/invitation/role data is page-local (not part of bootstrap), so — unlike locations — these do **not** re-fetch the bootstrap.

```ts
const listOrgMembers = useCallback(
  async (orgId?: string | null) =>
    osirisMembersAdminClient.listOrgMembers(requireOrgId(orgId ?? state.activeOrgId)),
  [state.activeOrgId],
);

const updateMemberRole = useCallback(
  async (
    orgId: string | null | undefined,
    userId: string,
    input: Parameters<typeof osirisMembersAdminClient.updateMemberRole>[2],
  ) =>
    osirisMembersAdminClient.updateMemberRole(
      requireOrgId(orgId ?? state.activeOrgId),
      userId,
      input,
    ),
  [state.activeOrgId],
);

const removeMember = useCallback(
  async (orgId: string | null | undefined, userId: string) =>
    osirisMembersAdminClient.removeMember(requireOrgId(orgId ?? state.activeOrgId), userId),
  [state.activeOrgId],
);

const listInvitations = useCallback(
  async (orgId?: string | null) =>
    osirisInvitationsAdminClient.listInvitations(requireOrgId(orgId ?? state.activeOrgId)),
  [state.activeOrgId],
);

const createInvitation = useCallback(
  async (
    orgId: string | null | undefined,
    input: Parameters<typeof osirisInvitationsAdminClient.createInvitation>[1],
  ) =>
    osirisInvitationsAdminClient.createInvitation(requireOrgId(orgId ?? state.activeOrgId), input),
  [state.activeOrgId],
);

const revokeInvitation = useCallback(
  async (orgId: string | null | undefined, invitationId: string) =>
    osirisInvitationsAdminClient.revokeInvitation(
      requireOrgId(orgId ?? state.activeOrgId),
      invitationId,
    ),
  [state.activeOrgId],
);

const listInviteLinks = useCallback(
  async (orgId?: string | null) =>
    osirisInvitationsAdminClient.listInviteLinks(requireOrgId(orgId ?? state.activeOrgId)),
  [state.activeOrgId],
);

const createInviteLink = useCallback(
  async (
    orgId: string | null | undefined,
    input: Parameters<typeof osirisInvitationsAdminClient.createInviteLink>[1],
  ) =>
    osirisInvitationsAdminClient.createInviteLink(requireOrgId(orgId ?? state.activeOrgId), input),
  [state.activeOrgId],
);

const revokeInviteLink = useCallback(
  async (orgId: string | null | undefined, linkId: string) =>
    osirisInvitationsAdminClient.revokeInviteLink(requireOrgId(orgId ?? state.activeOrgId), linkId),
  [state.activeOrgId],
);

const listCustomRoles = useCallback(
  async (orgId?: string | null) =>
    osirisCustomRolesAdminClient.listCustomRoles(requireOrgId(orgId ?? state.activeOrgId)),
  [state.activeOrgId],
);

const createCustomRole = useCallback(
  async (
    orgId: string | null | undefined,
    input: Parameters<typeof osirisCustomRolesAdminClient.createCustomRole>[1],
  ) =>
    osirisCustomRolesAdminClient.createCustomRole(requireOrgId(orgId ?? state.activeOrgId), input),
  [state.activeOrgId],
);

const updateCustomRole = useCallback(
  async (
    orgId: string | null | undefined,
    roleId: string,
    input: Parameters<typeof osirisCustomRolesAdminClient.updateCustomRole>[2],
  ) =>
    osirisCustomRolesAdminClient.updateCustomRole(
      requireOrgId(orgId ?? state.activeOrgId),
      roleId,
      input,
    ),
  [state.activeOrgId],
);

const deleteCustomRole = useCallback(
  async (orgId: string | null | undefined, roleId: string) =>
    osirisCustomRolesAdminClient.deleteCustomRole(requireOrgId(orgId ?? state.activeOrgId), roleId),
  [state.activeOrgId],
);
```

- [ ] **Step 4: Add the methods to the context value**

In the `<OsirisRuntimeContext.Provider value={{ ... }}>` object, add after `deactivateOrgLocation,`:

```ts
        listOrgMembers,
        updateMemberRole,
        removeMember,
        listInvitations,
        createInvitation,
        revokeInvitation,
        listInviteLinks,
        createInviteLink,
        revokeInviteLink,
        listCustomRoles,
        createCustomRole,
        updateCustomRole,
        deleteCustomRole,
```

- [ ] **Step 5: Verify typecheck + existing tests pass**

Run: `pnpm typecheck` then `pnpm vitest run src/runtime/osiris`
Expected: PASS (no type errors; existing AuthProvider/runtime tests still green).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/runtime/osiris/types.ts apps/web/src/runtime/osiris/AuthProvider.tsx
git commit -m "feat(members): wire members/invitations/roles onto osiris runtime"
```

---

### Task 5: Manifest, nav, icon, enabled modules + page scaffold

**Files:**

- Modify: `apps/web/src/lib/org-profiles/types.ts`
- Modify: `apps/web/src/lib/org-profiles/profiles.ts`
- Modify: `apps/web/src/lib/modulePageIcons.tsx`
- Modify: `apps/web/src/lib/appNavModules.ts`
- Create: `apps/web/src/modules/members/MembersPage.tsx` (temporary scaffold; fleshed out in later tasks)

- [ ] **Step 1: Add `'members'` to `OrgModuleId`**

In `lib/org-profiles/types.ts`, extend the union:

```ts
export type OrgModuleId =
  | 'dashboard'
  | 'ai-chat'
  | 'email'
  | 'calendar'
  | 'reports'
  | 'members'
  | 'settings'
  | 'showcase';
```

- [ ] **Step 2: Enable the module for orgs**

In `lib/org-profiles/profiles.ts`, add `'members'` to `DEFAULT_ORG_MODULES` (before `'settings'`):

```ts
const DEFAULT_ORG_MODULES: OrgModuleId[] = [
  'dashboard',
  'ai-chat',
  'email',
  'calendar',
  'reports',
  'members',
  'settings',
];
```

- [ ] **Step 3: Add `membersPageIcon`**

In `lib/modulePageIcons.tsx`, `TeamIcon` is already imported. Add the factory next to `settingsPageIcon`:

```ts
export const membersPageIcon = () => modulePageIcon(TeamIcon);
```

- [ ] **Step 4: Add the temporary page scaffold**

```tsx
// apps/web/src/modules/members/MembersPage.tsx
import { ModulePage } from '@/components/common/PageLayout';
import { membersPageIcon } from '@/lib/modulePageIcons';

export function MembersPage() {
  return (
    <ModulePage
      title="Members"
      subtitle="Manage who can access this workspace"
      icon={membersPageIcon()}
    />
  );
}
```

- [ ] **Step 5: Add the manifest entry**

In `lib/appNavModules.ts`, add `TeamIcon` to the icon import block, then add this entry to `APP_NAV_MODULES` immediately before the `settings` entry:

```ts
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

- [ ] **Step 6: Write a test for the manifest entry**

Append to `apps/web/src/lib/appNavModules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { APP_NAV_MODULES } from './appNavModules';

describe('members manifest entry', () => {
  it('is an admin module gated by org.members.manage', () => {
    const entry = APP_NAV_MODULES.find((module) => module.id === 'members');
    expect(entry).toBeDefined();
    expect(entry?.section).toBe('admin');
    expect(entry?.path).toBe('/members');
    expect(entry?.permission).toBe('org.members.manage');
  });
});
```

(If `appNavModules.test.ts` already imports `describe/expect/it` and `APP_NAV_MODULES`, append only the `describe(...)` block.)

- [ ] **Step 7: Verify**

Run: `pnpm vitest run src/lib/appNavModules.test.ts && pnpm typecheck`
Expected: PASS. Manually: `pnpm --filter web dev`, sign in as an admin → "Members" appears in the Admin nav section and `/members` renders the scaffold.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/org-profiles/types.ts apps/web/src/lib/org-profiles/profiles.ts apps/web/src/lib/modulePageIcons.tsx apps/web/src/lib/appNavModules.ts apps/web/src/lib/appNavModules.test.ts apps/web/src/modules/members/MembersPage.tsx
git commit -m "feat(members): register members admin module + nav entry"
```

---

### Task 6: Module shared config (`shared.tsx`)

**Files:**

- Create: `apps/web/src/modules/members/shared.tsx`

This file holds all config so the section components stay thin and adjustable: role/status variant maps, role option builders, the member list columns, and the invite/role form fields.

- [ ] **Step 1: Write `shared.tsx`**

```tsx
// apps/web/src/modules/members/shared.tsx
import type { BadgeProps, ComboboxOption } from '@oktavius/base-ui';

import { statusColumn } from '@/components/data/columns';
import type { CrudColumn } from '@/components/data/CrudTable';
import type { FormField } from '@/components/forms/EntityForm';
import { formatDisplayDate } from '@/lib/formatDate';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisInvitation, OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';
import type { OsirisOrgRole } from '@/runtime/osiris/types';

/** Standard org role labels (owner is shown but never assignable through the UI). */
export const STANDARD_ROLE_OPTIONS: ComboboxOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

export const ROLE_VARIANT: Record<string, BadgeProps['variant']> = {
  owner: 'success',
  admin: 'info',
  member: 'secondary',
  viewer: 'outline',
};

export const INVITE_STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  pending: 'warning',
  accepted: 'success',
  expired: 'outline',
};

/** Build role options for the change-role dialog: standard roles + this org's custom roles. */
export function buildRoleOptions(customRoles: OsirisCustomRole[]): ComboboxOption[] {
  return [
    ...STANDARD_ROLE_OPTIONS,
    ...customRoles.map((role) => ({ value: `custom:${role.id}`, label: role.name })),
  ];
}

/** Map a member to the current role-selector value (`custom:<id>` when a custom role is set). */
export function memberRoleValue(member: OsirisOrgMember): string {
  return member.customRoleId ? `custom:${member.customRoleId}` : member.role;
}

/** Translate a role-selector value back into an updateMemberRole payload. */
export function roleValueToInput(value: string): {
  role: OsirisOrgRole;
  customRoleId: string | null;
} {
  if (value.startsWith('custom:')) {
    return { role: 'member', customRoleId: value.slice('custom:'.length) };
  }
  return { role: value as OsirisOrgRole, customRoleId: null };
}

export function roleLabel(member: OsirisOrgMember, customRoles: OsirisCustomRole[]): string {
  if (member.customRoleId) {
    return customRoles.find((role) => role.id === member.customRoleId)?.name ?? 'Custom';
  }
  return member.role;
}

/** Row shape for the members CrudTable (flat, sortable/searchable). */
export type MemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  roleValue: string;
  roleLabel: string;
  member: OsirisOrgMember;
};

export function toMemberRow(member: OsirisOrgMember, customRoles: OsirisCustomRole[]): MemberRow {
  return {
    id: member.userId,
    userId: member.userId,
    name: member.fullName || member.email || member.userId,
    email: member.email ?? '',
    roleValue: memberRoleValue(member),
    roleLabel: roleLabel(member, customRoles),
    member,
  };
}

export const MEMBER_COLUMNS: CrudColumn<MemberRow>[] = [
  { key: 'name', header: 'Member', sortable: true },
  { key: 'email', header: 'Email', sortable: true, hideBelow: 'sm' },
  statusColumn<MemberRow>('roleLabel', 'Role', ROLE_VARIANT, { sortable: true }),
];

/** Email-invite dialog fields. Role options injected at call site to include custom roles. */
export function inviteFormFields(roleOptions: ComboboxOption[]): FormField[] {
  return [
    { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'off' },
    {
      name: 'role',
      label: 'Role',
      type: 'combobox',
      required: true,
      options: STANDARD_ROLE_OPTIONS,
    },
    {
      name: 'expiresInDays',
      label: 'Expires in (days)',
      type: 'number',
      required: true,
      min: '1',
      max: '30',
    },
  ].map((field) => (field.name === 'role' ? { ...field, options: roleOptions } : field));
}

/** Invite-link dialog fields (links only allow member/viewer). */
export const INVITE_LINK_FORM_FIELDS: FormField[] = [
  {
    name: 'role',
    label: 'Role',
    type: 'combobox',
    required: true,
    options: [
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { name: 'maxUses', label: 'Max uses', type: 'number', required: true, min: '1', max: '100' },
  {
    name: 'expiresInDays',
    label: 'Expires in (days)',
    type: 'number',
    required: true,
    min: '1',
    max: '30',
  },
];

/** Custom-role create/edit dialog fields. */
export const CUSTOM_ROLE_FORM_FIELDS: FormField[] = [
  { name: 'name', label: 'Role name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  {
    name: 'baseRole',
    label: 'Base role',
    type: 'combobox',
    required: true,
    options: [
      { value: 'member', label: 'Member' },
      { value: 'viewer', label: 'Viewer' },
    ],
  },
  { name: 'agentAccess', label: 'AI agent access', type: 'switch' },
];

export function formatInviteExpiry(value: string | null): string {
  return value ? formatDisplayDate(value) : '—';
}

export function inviteStatus(invitation: OsirisInvitation): string {
  if (invitation.acceptedAt) return 'accepted';
  if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now())
    return 'expired';
  return 'pending';
}

export function inviteLinkUsage(link: OsirisInviteLink): string {
  return `${link.useCount}/${link.maxUses}`;
}
```

> Before writing, confirm `formatDisplayDate` is exported from `@/lib/formatDate` (grep: `rg "export function formatDisplayDate" apps/web/src/lib`). If it lives elsewhere, fix the import path — do not add a new date formatter (hard ban).
> Also confirm the base-ui `BadgeProps['variant']` union includes `'info'`/`'success'`/`'warning'`/`'outline'`/`'secondary'` (grep `apps/web/src/components/feedback/StatusBadge.tsx` DEFAULT_STATUS_VARIANTS for the names actually in use); adjust the variant maps to existing names if any differ.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS. (No test yet — config is exercised by Task 7's component test.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/members/shared.tsx
git commit -m "feat(members): module shared config (columns, role maps, form fields)"
```

---

### Task 7: Members section (list + change role + remove)

**Files:**

- Create: `apps/web/src/modules/members/MembersSection.tsx`

This section owns the member list and its mutations. It receives data + callbacks as props so it is trivially testable and adjustable; data loading lives in `MembersPage` (Task 11) and is passed down.

- [ ] **Step 1: Write `MembersSection.tsx`**

```tsx
// apps/web/src/modules/members/MembersSection.tsx
import { Combobox, type ComboboxOption } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { CrudListShell } from '@/components/data/CrudListShell';
import type { CrudRowAction } from '@/components/data/CrudTable';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import { useListPageState } from '@/lib/useListPageState';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';

import {
  buildRoleOptions,
  MEMBER_COLUMNS,
  type MemberRow,
  memberRoleValue,
  roleValueToInput,
  toMemberRow,
} from './shared';

type MembersSectionProps = {
  members: OsirisOrgMember[];
  customRoles: OsirisCustomRole[];
  isLoading: boolean;
  onChangeRole: (userId: string, value: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};

export function MembersSection({
  members,
  customRoles,
  isLoading,
  onChangeRole,
  onRemove,
}: MembersSectionProps) {
  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);
  const rows = useMemo(
    () => members.map((member) => toMemberRow(member, customRoles)),
    [members, customRoles],
  );

  const list = useListPageState<MemberRow>({
    rows,
    defaultSort: 'name',
    filterKeys: [],
    searchKeys: ['name', 'email'],
    queryNamespace: 'members',
  });

  const [roleDialogMember, setRoleDialogMember] = useState<OsirisOrgMember | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [pendingRoleValue, setPendingRoleValue] = useState<string>('member');

  const openRoleDialog = (member: OsirisOrgMember) => {
    setPendingRoleValue(memberRoleValue(member));
    setRoleDialogMember(member);
  };

  const handleSaveRole = async () => {
    if (!roleDialogMember) return;
    setIsSavingRole(true);
    try {
      await onChangeRole(roleDialogMember.userId, pendingRoleValue);
      setRoleDialogMember(null);
    } finally {
      setIsSavingRole(false);
    }
  };

  const rowActions: CrudRowAction<MemberRow>[] = [
    {
      key: 'change-role',
      label: 'Change role',
      // Owners are managed elsewhere; never reassign an owner from this list.
      hidden: (row) => row.member.role === 'owner',
      onClick: (row) => openRoleDialog(row.member),
    },
    {
      key: 'remove',
      label: 'Remove from workspace',
      destructive: true,
      hidden: (row) => row.member.role === 'owner',
      confirm: {
        title: 'Remove member?',
        description: 'They lose access to this workspace immediately. This cannot be undone.',
        actionLabel: 'Remove',
      },
      onClick: (row) => onRemove(row.member.userId),
    },
  ];

  return (
    <>
      <CrudListShell<MemberRow>
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Search members"
        rows={list.paged}
        columns={MEMBER_COLUMNS}
        rowActions={rowActions}
        sort={list.sort}
        onSortChange={list.onSortChange}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.onPageChange}
        isLoading={isLoading}
        emptyTitle="No members yet"
        emptyDescription="Invite teammates to give them access to this workspace."
        entityLabel="member"
        enableListCrud={false}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={roleDialogMember !== null}
        onOpenChange={(open) => {
          if (!open) setRoleDialogMember(null);
        }}
        title="Change role"
        description={roleDialogMember?.email ?? undefined}
        fields={[]}
        defaultValues={{}}
        submitLabel="Save"
        isSubmitting={isSavingRole}
        onSubmit={() => handleSaveRole()}
      >
        {/* SubEntityFormDialog renders EntityForm; for a single control we render the selector inline above the footer via the dialog's children slot is not supported, so use a dedicated combobox section instead. */}
      </SubEntityFormDialog>
    </>
  );
}
```

> **Adjustment note (do this in Step 1):** `SubEntityFormDialog` does not accept children — it renders an `EntityForm` from `fields`. For the single-control "change role" dialog, the cleanest reuse is a one-field `EntityForm` of type `combobox`. Replace the `fields={[]}`/`defaultValues={{}}`/`onSubmit` above with:
>
> ```tsx
> fields={[{ name: 'role', label: 'Role', type: 'combobox', required: true, options: roleOptions }]}
> defaultValues={{ role: memberRoleValue(roleDialogMember ?? ({} as OsirisOrgMember)) }}
> onSubmit={async (values) => {
>   if (!roleDialogMember) return;
>   await onChangeRole(roleDialogMember.userId, String(values.role ?? 'member'));
>   setRoleDialogMember(null);
> }}
> ```
>
> and delete the `pendingRoleValue`/`handleSaveRole`/`Combobox` scaffolding plus the unused `Combobox`/`ComboboxOption` import. This keeps the dialog fully within the reused `SubEntityFormDialog` + `EntityForm` components (no bespoke modal). `roleOptions` and the `roleValueToInput` mapping (used by the page in Task 11) come from `shared.tsx`.

- [ ] **Step 2: Component test**

```tsx
// apps/web/src/modules/members/MembersSection.test.tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  it('renders members and hides destructive actions for owners', async () => {
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

    expect(container.textContent).toContain('Anna');
    expect(container.textContent).toContain('Olive');
  });
});
```

> If the suite already has a shared render helper (see `AuthInvitePages.test.tsx`), follow that style. The assertion is intentionally light — it proves the section mounts with the reused `CrudListShell`. Deeper row-action behavior is covered by `CrudTable`'s own tests.

- [ ] **Step 3: Run + typecheck**

Run: `pnpm vitest run src/modules/members/MembersSection.test.tsx && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/members/MembersSection.tsx apps/web/src/modules/members/MembersSection.test.tsx
git commit -m "feat(members): members list section with role change + remove"
```

---

### Task 8: Invitations section (email invites)

**Files:**

- Create: `apps/web/src/modules/members/InvitationsSection.tsx`

- [ ] **Step 1: Write `InvitationsSection.tsx`**

```tsx
// apps/web/src/modules/members/InvitationsSection.tsx
import { Badge, Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { TrashIcon } from '@/lib/icons';
import type { OsirisInvitation } from '@/runtime/osiris/invitationsAdminClient';

import { formatInviteExpiry, INVITE_STATUS_VARIANT, inviteStatus } from './shared';
import { useState } from 'react';

type InvitationsSectionProps = {
  invitations: OsirisInvitation[];
  onRevoke: (invitationId: string) => Promise<void>;
};

export function InvitationsSection({ invitations, onRevoke }: InvitationsSectionProps) {
  const [revokeTarget, setRevokeTarget] = useState<OsirisInvitation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const columns: SettingsTableColumn<OsirisInvitation>[] = [
    { key: 'email', header: 'Email', cell: (row) => row.email ?? '—' },
    {
      key: 'role',
      header: 'Role',
      cell: (row) => (
        <Badge variant={INVITE_STATUS_VARIANT[inviteStatus(row)] ?? 'secondary'}>{row.role}</Badge>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => inviteStatus(row) },
    { key: 'expires', header: 'Expires', cell: (row) => formatInviteExpiry(row.expiresAt) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Revoke invitation"
          onClick={() => setRevokeTarget(row)}
        >
          <TrashIcon size={16} aria-hidden="true" />
        </Button>
      ),
    },
  ];

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await onRevoke(revokeTarget.id);
      setRevokeTarget(null);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      <SettingsTable<OsirisInvitation>
        columns={columns}
        rows={invitations}
        getRowId={(row) => row.id}
        emptyMessage="No pending invitations."
      />
      <ConfirmActionDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke invitation?"
        description={`The invite to ${revokeTarget?.email ?? 'this address'} will stop working.`}
        confirmLabel="Revoke"
        variant="destructive"
        isConfirming={isRevoking}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
```

> Confirm `ConfirmActionDialog`'s exact prop names before writing (grep `apps/web/src/components/common/ConfirmActionDialog.tsx` for its props — likely `open`, `onOpenChange`, `title`, `description`, `confirmLabel`/`actionLabel`, `variant`, `onConfirm`, and a busy flag). Match them exactly; do not invent. Likewise confirm `TrashIcon` exists in `@/lib/icons` (else use `DeleteIcon`/the registered delete icon).

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/members/InvitationsSection.tsx
git commit -m "feat(members): pending invitations section"
```

---

### Task 9: Invite links section

**Files:**

- Create: `apps/web/src/modules/members/InviteLinksSection.tsx`

- [ ] **Step 1: Write `InviteLinksSection.tsx`**

```tsx
// apps/web/src/modules/members/InviteLinksSection.tsx
import { Badge, Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { CopyIcon, PlusIcon, TrashIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';
import type { OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';

import { formatInviteExpiry, inviteLinkUsage, ROLE_VARIANT } from './shared';

type InviteLinksSectionProps = {
  links: OsirisInviteLink[];
  onCreate: () => void;
  onRevoke: (linkId: string) => Promise<void>;
};

function inviteUrlFor(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

export function InviteLinksSection({ links, onCreate, onRevoke }: InviteLinksSectionProps) {
  const [revokeTarget, setRevokeTarget] = useState<OsirisInviteLink | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrlFor(token));
      appToast.success('Invite link copied.');
    } catch (error) {
      appToast.fromApiError(error, 'Could not copy the link.');
    }
  };

  const columns: SettingsTableColumn<OsirisInviteLink>[] = [
    {
      key: 'role',
      header: 'Role',
      cell: (row) => <Badge variant={ROLE_VARIANT[row.role] ?? 'secondary'}>{row.role}</Badge>,
    },
    { key: 'uses', header: 'Uses', cell: (row) => inviteLinkUsage(row) },
    { key: 'expires', header: 'Expires', cell: (row) => formatInviteExpiry(row.expiresAt) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy invite link"
            onClick={() => void handleCopy(row.token)}
          >
            <CopyIcon size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Revoke invite link"
            onClick={() => setRevokeTarget(row)}
          >
            <TrashIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await onRevoke(revokeTarget.id);
      setRevokeTarget(null);
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreate}>
          <PlusIcon size={14} className="mr-1.5" aria-hidden="true" />
          Create link
        </Button>
      </div>
      <SettingsTable<OsirisInviteLink>
        columns={columns}
        rows={links}
        getRowId={(row) => row.id}
        emptyMessage="No active invite links."
      />
      <ConfirmActionDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke invite link?"
        description="Anyone who still has this link will no longer be able to join."
        confirmLabel="Revoke"
        variant="destructive"
        isConfirming={isRevoking}
        onConfirm={handleConfirmRevoke}
      />
    </div>
  );
}
```

> Confirm `CopyIcon`/`PlusIcon`/`TrashIcon` names in `@/lib/icons` (grep) and adjust if the registered names differ. Match `ConfirmActionDialog` props as in Task 8.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/members/InviteLinksSection.tsx
git commit -m "feat(members): shareable invite links section"
```

---

### Task 10: Custom roles section

**Files:**

- Create: `apps/web/src/modules/members/CustomRolesSection.tsx`

- [ ] **Step 1: Write `CustomRolesSection.tsx`**

```tsx
// apps/web/src/modules/members/CustomRolesSection.tsx
import { Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { PencilIcon, PlusIcon, TrashIcon } from '@/lib/icons';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

type CustomRolesSectionProps = {
  roles: OsirisCustomRole[];
  onCreate: () => void;
  onEdit: (role: OsirisCustomRole) => void;
  onDelete: (roleId: string) => Promise<void>;
};

export function CustomRolesSection({ roles, onCreate, onEdit, onDelete }: CustomRolesSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<OsirisCustomRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns: SettingsTableColumn<OsirisCustomRole>[] = [
    { key: 'name', header: 'Role', cell: (row) => row.name },
    { key: 'description', header: 'Description', cell: (row) => row.description || '—' },
    { key: 'members', header: 'Members', cell: (row) => String(row.memberCount) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" aria-label="Edit role" onClick={() => onEdit(row)}>
            <PencilIcon size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete role"
            onClick={() => setDeleteTarget(row)}
          >
            <TrashIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreate}>
          <PlusIcon size={14} className="mr-1.5" aria-hidden="true" />
          Add custom role
        </Button>
      </div>
      <SettingsTable<OsirisCustomRole>
        columns={columns}
        rows={roles}
        getRowId={(row) => row.id}
        emptyMessage="No custom roles yet."
      />
      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete custom role?"
        description={`Members assigned "${deleteTarget?.name ?? ''}" fall back to its base role.`}
        confirmLabel="Delete"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
```

> Confirm `PencilIcon` (edit) / `PlusIcon` / `TrashIcon` names in `@/lib/icons` (the registry lists `IconEditButton`/`IconDeleteButton` helpers — you may reuse those instead of raw icon buttons for full design-system consistency; prefer them if present). Match `ConfirmActionDialog` props.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/members/CustomRolesSection.tsx
git commit -m "feat(members): custom roles section"
```

---

### Task 11: Assemble MembersPage (data loading + dialogs + section nav)

**Files:**

- Modify: `apps/web/src/modules/members/MembersPage.tsx` (replace the Task 5 scaffold)
- Create: `apps/web/src/modules/members/MembersPage.test.tsx`

`MembersPage` owns all data loading (load-into-`useState` + re-fetch after mutations, the `SettingsPage` pattern), the page-header "Invite member" CTA, and the create dialogs; it passes data + callbacks into the section components.

- [ ] **Step 1: Write `MembersPage.tsx`**

```tsx
// apps/web/src/modules/members/MembersPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';

import { PageHeaderCtaButton } from '@/components/common/PageHeaderButtons';
import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { NotificationsIcon, OrganizationIcon, TeamIcon, UserAddIcon } from '@/lib/icons';
import { membersPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisInvitation, OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { CustomRolesSection } from './CustomRolesSection';
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

export function MembersPage() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = runtime?.activeOrgId ?? null;

  const [members, setMembers] = useState<OsirisOrgMember[]>([]);
  const [invitations, setInvitations] = useState<OsirisInvitation[]>([]);
  const [links, setLinks] = useState<OsirisInviteLink[]>([]);
  const [customRoles, setCustomRoles] = useState<OsirisCustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('members');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OsirisCustomRole | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const refreshMembers = useCallback(async () => {
    if (!orgId || !runtime?.listOrgMembers) return;
    setMembers(await runtime.listOrgMembers(orgId));
  }, [orgId, runtime]);
  const refreshInvitations = useCallback(async () => {
    if (!orgId || !runtime?.listInvitations) return;
    setInvitations(await runtime.listInvitations(orgId));
  }, [orgId, runtime]);
  const refreshLinks = useCallback(async () => {
    if (!orgId || !runtime?.listInviteLinks) return;
    setLinks(await runtime.listInviteLinks(orgId));
  }, [orgId, runtime]);
  const refreshRoles = useCallback(async () => {
    if (!orgId || !runtime?.listCustomRoles) return;
    setCustomRoles(await runtime.listCustomRoles(orgId));
  }, [orgId, runtime]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void Promise.all([refreshMembers(), refreshInvitations(), refreshLinks(), refreshRoles()])
      .catch((error: unknown) => appToast.fromApiError(error, 'Members could not be loaded.'))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshMembers, refreshInvitations, refreshLinks, refreshRoles]);

  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);

  const handleChangeRole = async (userId: string, value: string) => {
    if (!runtime?.updateMemberRole) return;
    try {
      await runtime.updateMemberRole(orgId, userId, roleValueToInput(value));
      await refreshMembers();
      appToast.success('Role updated.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be updated.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!runtime?.removeMember) return;
    try {
      await runtime.removeMember(orgId, userId);
      await refreshMembers();
      appToast.success('Member removed.');
    } catch (error) {
      appToast.fromApiError(error, 'Member could not be removed.');
    }
  };

  const handleInvite = async (values: Record<string, FormFieldValue>) => {
    if (!runtime?.createInvitation) return;
    setIsInviting(true);
    try {
      await runtime.createInvitation(orgId, {
        email: String(values.email ?? '').trim(),
        role: String(values.role ?? 'member') as 'admin' | 'member' | 'viewer',
        expiresInDays: Number(values.expiresInDays ?? 7),
      });
      await refreshInvitations();
      appToast.success('Invitation sent.');
    } catch (error) {
      appToast.fromApiError(error, 'Invitation could not be sent.');
      throw error;
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateLink = async (values: Record<string, FormFieldValue>) => {
    if (!runtime?.createInviteLink) return;
    setIsCreatingLink(true);
    try {
      await runtime.createInviteLink(orgId, {
        role: String(values.role ?? 'member') as 'member' | 'viewer',
        maxUses: Number(values.maxUses ?? 10),
        expiresInDays: Number(values.expiresInDays ?? 7),
      });
      await refreshLinks();
      appToast.success('Invite link created.');
    } catch (error) {
      appToast.fromApiError(error, 'Invite link could not be created.');
      throw error;
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleSaveRole = async (values: Record<string, FormFieldValue>) => {
    if (!runtime) return;
    setIsSavingRole(true);
    const input = {
      name: String(values.name ?? '').trim(),
      description: String(values.description ?? '').trim(),
      baseRole: String(values.baseRole ?? 'member') as 'member' | 'viewer',
      agentAccess: Boolean(values.agentAccess),
      permissions: [] as string[],
      allowedModules: [] as string[],
    };
    try {
      if (editingRole && runtime.updateCustomRole) {
        await runtime.updateCustomRole(orgId, editingRole.id, input);
      } else if (runtime.createCustomRole) {
        await runtime.createCustomRole(orgId, input);
      }
      await refreshRoles();
      appToast.success(editingRole ? 'Role saved.' : 'Role created.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be saved.');
      throw error;
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!runtime?.deleteCustomRole) return;
    try {
      await runtime.deleteCustomRole(orgId, roleId);
      await refreshRoles();
      appToast.success('Role deleted.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be deleted.');
    }
  };

  const sections: SettingsSectionConfig[] = [
    {
      id: 'members',
      label: 'Members',
      icon: TeamIcon,
      title: 'Members',
      sectionDescription: 'People with access to this workspace.',
      render: () => (
        <MembersSection
          members={members}
          customRoles={customRoles}
          isLoading={isLoading}
          onChangeRole={handleChangeRole}
          onRemove={handleRemoveMember}
        />
      ),
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: UserAddIcon,
      title: 'Invitations',
      sectionDescription: 'Pending email invitations.',
      render: () => (
        <InvitationsSection
          invitations={invitations}
          onRevoke={async (id) => {
            if (!runtime?.revokeInvitation) return;
            try {
              await runtime.revokeInvitation(orgId, id);
              await refreshInvitations();
              appToast.success('Invitation revoked.');
            } catch (error) {
              appToast.fromApiError(error, 'Invitation could not be revoked.');
            }
          }}
        />
      ),
    },
    {
      id: 'links',
      label: 'Invite links',
      icon: OrganizationIcon,
      title: 'Invite links',
      sectionDescription: 'Shareable links anyone can use to join.',
      render: () => (
        <InviteLinksSection
          links={links}
          onCreate={() => setLinkOpen(true)}
          onRevoke={async (id) => {
            if (!runtime?.revokeInviteLink) return;
            try {
              await runtime.revokeInviteLink(orgId, id);
              await refreshLinks();
              appToast.success('Invite link revoked.');
            } catch (error) {
              appToast.fromApiError(error, 'Invite link could not be revoked.');
            }
          }}
        />
      ),
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: NotificationsIcon,
      title: 'Custom roles',
      sectionDescription: 'Organization-specific permission roles.',
      render: () => (
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
      ),
    },
  ];

  return (
    <ModulePage
      title="Members"
      subtitle="Manage who can access this workspace"
      icon={membersPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
      actions={
        <PageHeaderCtaButton onClick={() => setInviteOpen(true)}>
          <UserAddIcon size={16} className="mr-1.5" aria-hidden="true" />
          Invite member
        </PageHeaderCtaButton>
      }
    >
      <SettingsPageFactory
        sections={sections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite member"
        description="Send an email invitation to join this workspace."
        fields={inviteFormFields(roleOptions)}
        defaultValues={{ email: '', role: 'member', expiresInDays: 7 }}
        submitLabel="Send invite"
        isSubmitting={isInviting}
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
        isSubmitting={isCreatingLink}
        onSubmit={handleCreateLink}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={roleOpen}
        onOpenChange={setRoleOpen}
        title={editingRole ? 'Edit custom role' : 'Add custom role'}
        fields={CUSTOM_ROLE_FORM_FIELDS}
        defaultValues={{
          name: editingRole?.name ?? '',
          description: editingRole?.description ?? '',
          baseRole: editingRole?.baseRole ?? 'member',
          agentAccess: editingRole?.agentAccess ?? false,
        }}
        submitLabel={editingRole ? 'Save' : 'Create'}
        isSubmitting={isSavingRole}
        onSubmit={handleSaveRole}
      />
    </ModulePage>
  );
}
```

> **Verify before writing (grep each; fix import/name if different — do not invent):**
>
> - `PageHeaderCtaButton` is exported from `@/components/common/PageHeaderButtons` (the CTA button; if only `PageHeaderCtaLink` exists, add a thin button variant or use the existing button export — keep exactly one `cta` in the header).
> - `MODULE_PAGE_SECTION_NAV_CLASS` is exported from `@/components/common/pageChrome` (confirmed used by `SettingsPage`).
> - `ModulePage` accepts `actions` and `layoutClassName` (confirmed).
> - Icon names `TeamIcon`, `UserAddIcon`, `OrganizationIcon`, `NotificationsIcon` exist in `@/lib/icons` (confirmed for Team/UserAdd/Organization/Notifications). Swap any that differ.
> - `useCallback` import: it comes from `react` — fix the import line to `import { useCallback, useEffect, useMemo, useState } from 'react';` (the snippet shows `useCallback` capitalized correctly; ensure the import statement matches).
>
> **YAGNI note:** custom-role `permissions`/`allowedModules` are sent as empty arrays for now (create/rename/base-role/agent-access are editable). Wiring the permission/module multiselect editors is a deliberate follow-up — leave a `// TODO(members): permission + module multiselect` comment so it's discoverable. This keeps the role dialog within form-field limits and the slice shippable.

- [ ] **Step 2: Write the page test**

```tsx
// apps/web/src/modules/members/MembersPage.test.tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  it('loads members from the runtime and renders them', async () => {
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
    expect(container.textContent).toContain('Anna');
    expect(container.textContent).toContain('Invite member');
  });
});
```

> Mirror the provider/render setup actually used in `AuthInvitePages.test.tsx` (it wraps `OsirisRuntimeContext` + `TestI18nProvider`). If `MODULE_PAGE_SECTION_NAV_CLASS`/`AppSectionNavLayout` need extra context, add the same wrappers that `SettingsPage.test.tsx` uses. Adjust the assertion if section-nav defers non-active sections.

- [ ] **Step 3: Run + full gate**

Run: `pnpm vitest run src/modules/members && pnpm typecheck && pnpm lint`
Expected: PASS, lint clean (no `Select`, no custom `<table>`, icons from `@/lib/icons`, single `cta`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/members/MembersPage.tsx apps/web/src/modules/members/MembersPage.test.tsx
git commit -m "feat(members): assemble members page with sections, dialogs, data loading"
```

---

### Task 12: Final verification & invitee-flow confirmation

**Files:** none (verification only).

- [ ] **Step 1: Confirm the invitee flow needs no changes**

The `acceptUrl` returned by `createInvitation` is `/invite/:token`, which the existing `InvitePage` (`modules/auth/AuthPlaceholderPage.tsx`) already handles end-to-end (resolve → accept / login / signup). No code change. Manually smoke-test: create an email invitation in the Members page, copy the `acceptUrl` path, open `/invite/<token>` in a logged-out window → it should show the login/sign-up choice; in a logged-in matching-email window → it should auto-accept.

- [ ] **Step 2: Full workspace gate**

Run (from `apps/web`): `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all PASS. Then from repo root: `pnpm typecheck && pnpm test` (workspace-wide) PASS.

- [ ] **Step 3: Manual walkthrough (`pnpm --filter web dev`)**

- Sign in as an admin (org with `org.members.manage`). "Members" appears under Admin nav.
- `/members`: four sections (Members, Invitations, Invite links, Roles). Members list loads, search works, "Change role" updates a member, "Remove" confirms then removes.
- "Invite member" (header CTA, purple) sends an invite → appears under Invitations → revoke works.
- "Create link" generates a link → copy + revoke work.
- "Add custom role" creates a role → appears under Roles → edit + delete work.
- Sign in as a non-admin (no `org.members.manage`): "Members" is absent from nav and `/members` shows access-denied (manifest gate).

- [ ] **Step 4: Commit any final lint/format fixes**

```bash
git add -A
git commit -m "chore(members): final lint/typecheck/test pass"
```

---

## Self-review notes (resolved)

- **Spec coverage:** placement (Task 5) ✓; member list+role+remove (Tasks 6–7) ✓; email invitations (Tasks 8, 11) ✓; invite links (Tasks 9, 11) ✓; custom roles (Tasks 10, 11) ✓; data layer + runtime wiring (Tasks 1–4) ✓; invitee flow (Task 12 — already implemented) ✓; error handling via `appToast` throughout ✓; tests per client + page ✓.
- **Type consistency:** client method names (`listOrgMembers`/`updateMemberRole`/`removeMember`/`listInvitations`/`createInvitation`/`revokeInvitation`/`listInviteLinks`/`createInviteLink`/`revokeInviteLink`/`listCustomRoles`/`createCustomRole`/`updateCustomRole`/`deleteCustomRole`) are identical across the client, `types.ts`, `AuthProvider`, and the page. `OsirisOrgRole` is reused from `types.ts`.
- **Deliberate scope cuts (flagged, not placeholders):** per-site access & module grants (out of scope per spec); custom-role permission/module multiselect editors (TODO comment, empty arrays for now); `EntityAvatar` not built (initials via base-ui `Avatar` if added — current columns use name text).
- **Verification gates required before writing** (icon names, `ConfirmActionDialog`/`PageHeaderCtaButton`/`formatDisplayDate` exports, base-ui badge variant names) are called out inline at each task; resolve by grep, never invent a symbol.
