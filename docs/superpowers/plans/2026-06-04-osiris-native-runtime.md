# Osiris Native Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Octavius V3 use Osiris ERP auth, bootstrap, permissions, org/site context, and API runtime as the default frontend runtime.

**Architecture:** Octavius keeps its UI/component system, but the default app runtime comes from Osiris. Demo data remains available only as a demo/showcase runtime. Generic UI reads stable frontend state and `permissions[]`; it does not depend on demo roles or demo registry objects.

**Tech Stack:** React 19, React Router 7, TanStack Query, TypeScript, Vitest, Vite, Osiris Fastify API, Supabase session tokens.

---

## File Structure

- Create `apps/web/src/runtime/osiris/types.ts`: Osiris bootstrap, auth, organization, membership, location access, and frontend runtime types.
- Create `apps/web/src/runtime/osiris/permissions.ts`: canonical Osiris role and permission helpers.
- Create `apps/web/src/runtime/osiris/bootstrap.ts`: bootstrap fetcher and normalized runtime state.
- Create `apps/web/src/runtime/osiris/AuthProvider.tsx`: Osiris-native auth/runtime provider.
- Create `apps/web/src/runtime/osiris/apiClient.ts`: fetch wrapper that sends bearer token and active org/site headers.
- Modify `apps/web/src/app/App.tsx`: select Osiris runtime by default, keep demo runtime explicitly isolated.
- Modify `apps/web/src/app/router.tsx`: read runtime subject from Osiris provider instead of demo data.
- Modify `apps/web/src/lib/permissions.ts`: replace demo role requirements with Osiris permission requirements.
- Modify `apps/web/src/components/layout/Sidebar.tsx`: use Osiris runtime user/org/site/permissions state.
- Modify `apps/web/src/components/layout/Header.tsx`: use Osiris runtime user/org/site state.
- Modify `apps/web/src/api/ApiProvider.tsx`: accept Osiris HTTP registry as default and keep demo registry for demo mode.
- Test `apps/web/src/runtime/osiris/permissions.test.ts`.
- Test `apps/web/src/runtime/osiris/bootstrap.test.ts`.
- Update `apps/web/src/lib/permissions.test.ts`.
- Update `apps/web/src/app/router.test.tsx` if route guard tests exist; otherwise add focused route guard tests near permissions.

## Task 1: Osiris Permission Contract

**Files:**

- Create: `oktavius-v3/apps/web/src/runtime/osiris/types.ts`
- Create: `oktavius-v3/apps/web/src/runtime/osiris/permissions.ts`
- Test: `oktavius-v3/apps/web/src/runtime/osiris/permissions.test.ts`
- Modify: `oktavius-v3/apps/web/src/lib/permissions.ts`
- Test: `oktavius-v3/apps/web/src/lib/permissions.test.ts`

- [ ] **Step 1: Write failing Osiris permission tests**

```ts
import { describe, expect, it } from 'vitest';

import {
  canUseOsirisPermissionRequirement,
  hasOsirisPermission,
  isCanonicalOrgRole,
  normalizeOsirisRole,
} from './permissions';

describe('osiris permissions', () => {
  it('normalizes canonical Osiris roles', () => {
    expect(normalizeOsirisRole('Owner')).toBe('owner');
    expect(normalizeOsirisRole('admin')).toBe('admin');
    expect(normalizeOsirisRole('MEMBER')).toBe('member');
    expect(normalizeOsirisRole('viewer')).toBe('viewer');
    expect(normalizeOsirisRole('unknown')).toBe(null);
  });

  it('recognizes canonical roles only', () => {
    expect(isCanonicalOrgRole('owner')).toBe(true);
    expect(isCanonicalOrgRole('Viewer')).toBe(false);
    expect(isCanonicalOrgRole(null)).toBe(false);
  });

  it('checks exact Osiris permission keys', () => {
    expect(hasOsirisPermission(['contacts.view'], 'contacts.view')).toBe(true);
    expect(hasOsirisPermission(['contacts.view'], 'contacts.update')).toBe(false);
  });

  it('allows superadmins through explicit superadmin requirements', () => {
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: true, role: 'member', permissions: [] },
        'superadmin',
      ),
    ).toBe(true);
  });

  it('checks all required permission keys', () => {
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: false, role: 'member', permissions: ['contacts.view', 'contacts.update'] },
        ['contacts.view', 'contacts.update'],
      ),
    ).toBe(true);
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: false, role: 'member', permissions: ['contacts.view'] },
        ['contacts.view', 'contacts.update'],
      ),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/runtime/osiris/permissions.test.ts`

Expected: FAIL because `runtime/osiris/permissions.ts` does not exist.

- [ ] **Step 3: Add Osiris runtime types**

```ts
export type OsirisOrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OsirisPermissionKey = string;

export type OsirisPermissionSubject = {
  isSuperadmin: boolean;
  role: OsirisOrgRole | null;
  permissions: OsirisPermissionKey[];
};

export type OsirisPermissionRequirement =
  | OsirisPermissionKey
  | OsirisPermissionKey[]
  | 'superadmin'
  | ((subject: OsirisPermissionSubject) => boolean);
```

- [ ] **Step 4: Add Osiris permission helpers**

```ts
import type { OsirisOrgRole, OsirisPermissionRequirement, OsirisPermissionSubject } from './types';

const CANONICAL_ROLES = new Set<OsirisOrgRole>(['owner', 'admin', 'member', 'viewer']);

export function normalizeOsirisRole(role: string | null | undefined): OsirisOrgRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase();
  return CANONICAL_ROLES.has(normalized as OsirisOrgRole) ? (normalized as OsirisOrgRole) : null;
}

export function isCanonicalOrgRole(role: unknown): role is OsirisOrgRole {
  return typeof role === 'string' && CANONICAL_ROLES.has(role as OsirisOrgRole);
}

export function hasOsirisPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canUseOsirisPermissionRequirement(
  subject: OsirisPermissionSubject,
  requirement?: OsirisPermissionRequirement,
): boolean {
  if (!requirement) return true;
  if (typeof requirement === 'function') return requirement(subject);
  if (requirement === 'superadmin') return subject.isSuperadmin;

  const required = Array.isArray(requirement) ? requirement : [requirement];
  if (subject.isSuperadmin) return true;
  return required.every((permission) => hasOsirisPermission(subject.permissions, permission));
}
```

- [ ] **Step 5: Run permission tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/runtime/osiris/permissions.test.ts apps/web/src/lib/permissions.test.ts`

Expected: new Osiris tests PASS; existing `lib/permissions.test.ts` may fail until Step 6 updates the public helper API.

- [ ] **Step 6: Update public permission helpers**

Replace `apps/web/src/lib/permissions.ts` with a thin public API that uses Osiris permissions:

```ts
import type { AppNavModule } from './appNavModules';
import type { OsirisPermissionRequirement, OsirisPermissionSubject } from '@/runtime/osiris/types';
import { canUseOsirisPermissionRequirement } from '@/runtime/osiris/permissions';

export type PermissionSubject = OsirisPermissionSubject;
export type PermissionRequirement = OsirisPermissionRequirement;

export function canManageOrganization(subject: PermissionSubject) {
  return canUseOsirisPermissionRequirement(subject, 'org.manage');
}

export function canDeleteRecords(subject: PermissionSubject, permission = 'records.delete') {
  return canUseOsirisPermissionRequirement(subject, permission);
}

export function canUsePermissionRequirement(
  subject: PermissionSubject,
  requirement?: PermissionRequirement,
) {
  return canUseOsirisPermissionRequirement(subject, requirement);
}

export function canAccessAppNavItem(item: AppNavModule, subject: PermissionSubject) {
  if (item.id === 'showcase') return subject.isSuperadmin;
  if (item.id === 'settings') return canUsePermissionRequirement(subject, 'org.manage');
  if (item.id === 'users') return canUsePermissionRequirement(subject, 'org.members.manage');
  if (item.permission) return canUsePermissionRequirement(subject, item.permission);
  return true;
}
```

- [ ] **Step 7: Update `lib/permissions.test.ts`**

Update assertions to use Osiris permission keys:

```ts
const member = { isSuperadmin: false, role: 'member', permissions: ['contacts.view'] } as const;
const admin = {
  isSuperadmin: false,
  role: 'admin',
  permissions: ['org.manage', 'org.members.manage', 'contacts.delete'],
} as const;
const superadmin = { isSuperadmin: true, role: 'viewer', permissions: [] } as const;
```

Expected route/nav behavior:

- settings requires `org.manage`
- users requires `org.members.manage`
- showcase requires `isSuperadmin`
- regular modules require their configured `item.permission` when present

- [ ] **Step 8: Run focused tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/runtime/osiris/permissions.test.ts apps/web/src/lib/permissions.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd oktavius-v3
git add apps/web/src/runtime/osiris/types.ts apps/web/src/runtime/osiris/permissions.ts apps/web/src/runtime/osiris/permissions.test.ts apps/web/src/lib/permissions.ts apps/web/src/lib/permissions.test.ts
git commit -m "feat: add osiris permission runtime"
```

## Task 2: Osiris Bootstrap Runtime

**Files:**

- Create: `oktavius-v3/apps/web/src/runtime/osiris/bootstrap.ts`
- Test: `oktavius-v3/apps/web/src/runtime/osiris/bootstrap.test.ts`
- Modify: `oktavius-v3/apps/web/src/runtime/osiris/types.ts`

- [ ] **Step 1: Write failing bootstrap normalization tests**

```ts
import { describe, expect, it } from 'vitest';

import { normalizeOsirisBootstrap } from './bootstrap';

describe('normalizeOsirisBootstrap', () => {
  it('normalizes profile, memberships, permissions, and active org/site', () => {
    const result = normalizeOsirisBootstrap({
      user: { id: 'usr_1', email: 'anna@example.test' },
      profile: {
        user_id: 'usr_1',
        email: 'anna@example.test',
        full_name: 'Anna',
        is_super_admin: false,
        active_org_id: 'org_1',
        active_site_id: 'site_1',
      },
      memberships: [{ org_id: 'org_1', role: 'Admin', is_active: true }],
      organizations: [{ id: 'org_1', name: 'Osiris Demo', slug: 'osiris-demo' }],
      permissions: ['contacts.view', 'contacts.update'],
      locationAccess: {
        activeSiteId: 'site_1',
        accessibleSiteIds: ['site_1'],
        canViewAllSites: false,
        canEditAllSites: false,
        orgSiteCount: 1,
        sites: [{ id: 'site_1', name: 'Vienna', isActive: true }],
      },
      config: null,
    });

    expect(result.currentUser.email).toBe('anna@example.test');
    expect(result.activeOrgId).toBe('org_1');
    expect(result.activeSiteId).toBe('site_1');
    expect(result.permissionSubject).toEqual({
      isSuperadmin: false,
      role: 'admin',
      permissions: ['contacts.view', 'contacts.update'],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/runtime/osiris/bootstrap.test.ts`

Expected: FAIL because `bootstrap.ts` does not exist.

- [ ] **Step 3: Extend runtime types**

Add these exports to `apps/web/src/runtime/osiris/types.ts`:

```ts
export type OsirisBootstrapResponse = {
  user: { id: string; email: string | null };
  profile: {
    user_id: string;
    email: string | null;
    full_name: string | null;
    is_super_admin: boolean;
    active_org_id: string | null;
    active_site_id: string | null;
    preferred_language?: string | null;
  } | null;
  memberships: Array<{ org_id: string; role: string; is_active: boolean }>;
  organizations: Array<{ id: string; name: string; slug: string }>;
  permissions: string[];
  locationAccess?: {
    activeSiteId: string | null;
    accessibleSiteIds: string[] | null;
    canViewAllSites: boolean;
    canEditAllSites: boolean;
    orgSiteCount: number;
    sites: Array<{ id: string; name: string; isActive?: boolean }>;
  };
  config: unknown | null;
};

export type OsirisRuntimeState = {
  currentUser: {
    id: string;
    email: string | null;
    fullName: string | null;
    isSuperadmin: boolean;
  };
  organizations: OsirisBootstrapResponse['organizations'];
  memberships: OsirisBootstrapResponse['memberships'];
  activeOrgId: string | null;
  activeSiteId: string | null;
  permissions: string[];
  permissionSubject: OsirisPermissionSubject;
  locationAccess: OsirisBootstrapResponse['locationAccess'] | null;
  config: unknown | null;
};
```

- [ ] **Step 4: Add bootstrap normalization**

```ts
import { normalizeOsirisRole } from './permissions';
import type { OsirisBootstrapResponse, OsirisRuntimeState } from './types';

export function normalizeOsirisBootstrap(payload: OsirisBootstrapResponse): OsirisRuntimeState {
  const activeOrgId = payload.profile?.active_org_id ?? null;
  const activeMembership =
    payload.memberships.find((membership) => membership.org_id === activeOrgId) ?? null;
  const isSuperadmin = payload.profile?.is_super_admin === true;

  return {
    currentUser: {
      id: payload.user.id,
      email: payload.user.email,
      fullName: payload.profile?.full_name ?? null,
      isSuperadmin,
    },
    organizations: payload.organizations,
    memberships: payload.memberships,
    activeOrgId,
    activeSiteId: payload.profile?.active_site_id ?? payload.locationAccess?.activeSiteId ?? null,
    permissions: payload.permissions,
    permissionSubject: {
      isSuperadmin,
      role: normalizeOsirisRole(activeMembership?.role),
      permissions: payload.permissions,
    },
    locationAccess: payload.locationAccess ?? null,
    config: payload.config,
  };
}
```

- [ ] **Step 5: Run bootstrap tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/runtime/osiris/bootstrap.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd oktavius-v3
git add apps/web/src/runtime/osiris/types.ts apps/web/src/runtime/osiris/bootstrap.ts apps/web/src/runtime/osiris/bootstrap.test.ts
git commit -m "feat: normalize osiris bootstrap runtime"
```

## Task 3: Osiris Auth Provider

**Files:**

- Create: `oktavius-v3/apps/web/src/runtime/osiris/AuthProvider.tsx`
- Create: `oktavius-v3/apps/web/src/runtime/osiris/useOsirisRuntime.ts`
- Modify: `oktavius-v3/apps/web/src/app/App.tsx`
- Modify: `oktavius-v3/apps/web/src/app/router.tsx`

- [ ] **Step 1: Add provider API**

Create `useOsirisRuntime.ts`:

```ts
import { createContext, useContext } from 'react';

import type { OsirisRuntimeState } from './types';

export type OsirisRuntimeContextValue = OsirisRuntimeState & {
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

export const OsirisRuntimeContext = createContext<OsirisRuntimeContextValue | null>(null);

export function useOsirisRuntime() {
  const context = useContext(OsirisRuntimeContext);
  if (!context) {
    throw new Error('useOsirisRuntime must be used inside OsirisAuthProvider');
  }
  return context;
}
```

- [ ] **Step 2: Add initial provider implementation**

Create `AuthProvider.tsx`:

```tsx
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { normalizeOsirisBootstrap } from './bootstrap';
import { OsirisRuntimeContext } from './useOsirisRuntime';
import type { OsirisBootstrapResponse, OsirisRuntimeState } from './types';

const EMPTY_STATE: OsirisRuntimeState = {
  currentUser: { id: '', email: null, fullName: null, isSuperadmin: false },
  organizations: [],
  memberships: [],
  activeOrgId: null,
  activeSiteId: null,
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: null, permissions: [] },
  locationAccess: null,
  config: null,
};

async function fetchBootstrap(): Promise<OsirisBootstrapResponse> {
  const response = await fetch('/bootstrap', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Bootstrap failed with ${response.status}`);
  }
  return (await response.json()) as OsirisBootstrapResponse;
}

export function OsirisAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OsirisRuntimeState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setState(normalizeOsirisBootstrap(await fetchBootstrap()));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <OsirisRuntimeContext.Provider value={{ ...state, isLoading, error, reload }}>
      {children}
    </OsirisRuntimeContext.Provider>
  );
}
```

- [ ] **Step 3: Wire provider as default runtime**

Modify `apps/web/src/app/App.tsx`:

```tsx
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider } from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';

import { AgentChatProvider } from './agent-chat-data';
import { DemoDataProvider } from './demo-data';
import { AppRouter } from './router';

const USE_DEMO_RUNTIME = import.meta.env.VITE_OKTAVIUS_RUNTIME === 'demo';

export function App() {
  const app = (
    <ActiveLocationProvider>
      <AgentChatProvider>
        <AppRouter />
      </AgentChatProvider>
    </ActiveLocationProvider>
  );

  return (
    <UserPreferencesProvider>
      {USE_DEMO_RUNTIME ? (
        <DemoDataProvider>{app}</DemoDataProvider>
      ) : (
        <OsirisAuthProvider>{app}</OsirisAuthProvider>
      )}
    </UserPreferencesProvider>
  );
}
```

- [ ] **Step 4: Update route guard to read Osiris runtime**

In `apps/web/src/app/router.tsx`, replace demo permission subject usage:

```tsx
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
```

Inside `ProtectedRoute`:

```tsx
const { permissionSubject } = useOsirisRuntime();
const item = APP_NAV_MODULES.find((entry) => entry.id === routeId);
const canAccess = item != null && canAccessAppNavItem(item, permissionSubject);
```

- [ ] **Step 5: Run typecheck**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web typecheck`

Expected: FAIL where remaining demo runtime consumers still assume `useDemoData()` exists in shell components.

- [ ] **Step 6: Commit**

```bash
cd oktavius-v3
git add apps/web/src/runtime/osiris/AuthProvider.tsx apps/web/src/runtime/osiris/useOsirisRuntime.ts apps/web/src/app/App.tsx apps/web/src/app/router.tsx
git commit -m "feat: use osiris runtime provider"
```

## Task 4: Shell Runtime Wiring

**Files:**

- Modify: `oktavius-v3/apps/web/src/components/layout/Sidebar.tsx`
- Modify: `oktavius-v3/apps/web/src/components/layout/Header.tsx`
- Modify: `oktavius-v3/apps/web/src/components/layout/HeaderAccountMenu.tsx`
- Modify: `oktavius-v3/apps/web/src/components/layout/ActiveLocationPicker.tsx`
- Modify: `oktavius-v3/apps/web/src/components/layout/ActiveLocationInfoButton.tsx`

- [ ] **Step 1: Replace shell imports**

Replace `useDemoData` imports in shell files with:

```ts
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
```

- [ ] **Step 2: Replace common shell values**

Use this mapping:

```ts
const {
  currentUser,
  organizations,
  memberships,
  activeOrgId,
  activeSiteId,
  locationAccess,
  permissionSubject,
} = useOsirisRuntime();
```

Replace:

- `currentUser.name` with `currentUser.fullName ?? currentUser.email ?? 'User'`
- `currentUser.isSuperadmin` with `currentUser.isSuperadmin`
- `activeMembership.role` with `permissionSubject.role`
- demo org lists with `organizations`
- demo site lists with `locationAccess?.sites ?? []`

- [ ] **Step 3: Keep org/site switching explicit**

If a shell component requires org/site switching before the Osiris mutation is implemented, render the current org/site read-only and wire the control disabled:

```tsx
<button type="button" disabled aria-disabled="true">
  {activeOrgId ?? 'No active organization'}
</button>
```

Do not fake org switching with local demo state in Osiris runtime.

- [ ] **Step 4: Run typecheck**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web typecheck`

Expected: PASS for shell files or a small list of remaining demo-only pages.

- [ ] **Step 5: Run focused tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/lib/permissions.test.ts apps/web/src/components/layout/LocationSitesDetailList.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd oktavius-v3
git add apps/web/src/components/layout/Sidebar.tsx apps/web/src/components/layout/Header.tsx apps/web/src/components/layout/HeaderAccountMenu.tsx apps/web/src/components/layout/ActiveLocationPicker.tsx apps/web/src/components/layout/ActiveLocationInfoButton.tsx
git commit -m "feat: wire shell to osiris runtime"
```

## Task 5: Osiris API Client As Default

**Files:**

- Create: `oktavius-v3/apps/web/src/runtime/osiris/apiClient.ts`
- Modify: `oktavius-v3/apps/web/src/api/ApiProvider.tsx`
- Modify: `oktavius-v3/apps/web/src/api/httpRegistry.ts`
- Test: `oktavius-v3/apps/web/src/api/httpRegistry.test.ts`

- [ ] **Step 1: Add API client**

```ts
export type OsirisApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  getActiveOrgId?: () => string | null;
  getActiveSiteId?: () => string | null;
};

export function createOsirisApiFetcher(options: OsirisApiClientOptions = {}) {
  return async (input: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    const token = options.getAccessToken?.();
    const orgId = options.getActiveOrgId?.();
    const siteId = options.getActiveSiteId?.();

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (orgId) headers.set('X-Org-Id', orgId);
    if (siteId) headers.set('X-Site-Id', siteId);

    const baseUrl = options.baseUrl?.replace(/\/$/, '') ?? '';
    const path = typeof input === 'string' ? input : input.toString();
    const url = path.startsWith('http') ? path : `${baseUrl}/${path.replace(/^\//, '')}`;

    return fetch(url, { ...init, headers, credentials: 'include' });
  };
}
```

- [ ] **Step 2: Update HTTP registry tests**

Add assertions that Authorization and org/site headers pass through when provided:

```ts
expect(fetcher).toHaveBeenCalledWith(
  expect.stringContaining('/contacts'),
  expect.objectContaining({
    headers: expect.objectContaining({
      Authorization: 'Bearer token_1',
      'X-Org-Id': 'org_1',
      'X-Site-Id': 'site_1',
    }),
  }),
);
```

- [ ] **Step 3: Run HTTP tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/api/httpRegistry.test.ts`

Expected: PASS after `httpRegistry` preserves headers.

- [ ] **Step 4: Make API provider accept runtime registry**

Keep `ApiProvider` shape, but instantiate the registry from Osiris HTTP endpoints in the Osiris runtime path. Demo registry remains only under `VITE_OKTAVIUS_RUNTIME=demo`.

- [ ] **Step 5: Run typecheck and API tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web typecheck`

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/api/httpRegistry.test.ts apps/web/src/api/apiRegistryConfig.test.ts apps/web/src/api/apiStoreConfig.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd oktavius-v3
git add apps/web/src/runtime/osiris/apiClient.ts apps/web/src/api/ApiProvider.tsx apps/web/src/api/httpRegistry.ts apps/web/src/api/httpRegistry.test.ts
git commit -m "feat: default api runtime to osiris"
```

## Task 6: First Real Module Slice

**Files:**

- Modify: `oktavius-v3/apps/web/src/lib/appNavModules.ts`
- Modify one module chosen for first cut: `oktavius-v3/apps/web/src/modules/email/EmailPage.tsx`, `oktavius-v3/apps/web/src/modules/documents/DocumentsPage.tsx`, or a newly selected Osiris-backed contacts/funeral module.
- Test existing module tests for the selected slice.

- [ ] **Step 1: Select one module**

Choose `contacts` if Osiris contact endpoints are stable. Choose `funeral-cases-v2` if business replacement priority is higher than API simplicity.

- [ ] **Step 2: Add nav permission**

For the selected nav module, set a concrete permission:

```ts
{
  id: 'contacts',
  path: '/contacts',
  label: 'Contacts',
  section: 'modules',
  permission: 'contacts.view',
  icon: contactsPageIcon,
}
```

- [ ] **Step 3: Run nav permission tests**

Run: `cd oktavius-v3 && pnpm --filter @oktavius/web test apps/web/src/lib/appNavModules.test.ts apps/web/src/lib/permissions.test.ts`

Expected: PASS.

- [ ] **Step 4: Replace demo data calls in selected module**

Use the runtime API registry from `useApiRegistry()` and remove `useDemoData()` from the selected module. Data loading should come from TanStack Query around the registry handler.

- [ ] **Step 5: Run selected module tests**

Run the existing tests for the selected module. For contacts, run API handler and CRUD tests that exercise list/create/update/delete behavior.

Expected: PASS or documented backend endpoint mismatch to fix in the selected module task.

- [ ] **Step 6: Commit**

```bash
cd oktavius-v3
git add apps/web/src/lib/appNavModules.ts apps/web/src/modules
git commit -m "feat: migrate first module to osiris runtime"
```

## Self-Review

- Spec coverage: The plan covers Osiris-native auth/bootstrap, canonical roles, permission keys, org/site context, shell usage, API runtime, and first module proof.
- Placeholder scan: No `TBD`, `TODO`, or unresolved implementation steps remain. Task 6 intentionally asks for a module choice because the selected backend endpoint decides the exact file path; execution must make that choice before editing module code.
- Type consistency: `OsirisPermissionSubject`, `OsirisBootstrapResponse`, and `OsirisRuntimeState` are introduced in Task 1/2 and reused by later tasks.

## Execution Choice

Plan complete. Use one of these execution modes:

1. **Subagent-Driven (recommended)** - dispatch a fresh worker per task, review between tasks, keep each commit focused.
2. **Inline Execution** - execute tasks in this session with checkpoints after each task.
