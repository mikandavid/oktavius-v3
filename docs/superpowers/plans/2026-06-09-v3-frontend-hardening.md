# V3 Frontend Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining architectural friction and performance risks that could slow down replacing the Osiris ERP frontend with Oktavius V3.

**Architecture:** Keep the V3 shared UI/component foundation, but make the replacement app Osiris-runtime first. The app shell, router, shared layout, command palette, and data components must not depend on the legacy `DemoDataProvider`; sample records stay only as test/showcase fixtures. Server-backed lists use TanStack Query, large assets get real budgets, search/i18n/runtime adapters become the default extension points, and generated modules gain the descriptors needed for real ERP workflows.

**Tech Stack:** React 19, React Router 7, TanStack Query 5, Vite 5, TypeScript, Vitest, @oktavius/base-ui, @oktavius/i18n, xlsx, zod.

---

## File Structure

- Create `apps/web/src/app/runtimeProviders.tsx`: mounts the Osiris runtime stack only; no demo runtime branch.
- Create `apps/web/src/api/contracts.ts`: shared API errors, list response, and registry types with no fixture/data imports.
- Modify `apps/web/src/api/apiRegistryConfig.ts`: expose `createOsirisApiRegistry` so production runtime does not need a demo registry placeholder.
- Modify `apps/web/src/api/ApiProvider.tsx` and `apps/web/src/api/httpRegistry.ts`: import shared API contracts from `contracts.ts`, not `demo-client.ts`.
- Modify `apps/web/src/app/App.tsx`: delegate provider branching to `runtimeProviders.tsx`.
- Modify `apps/web/src/app/router.tsx`: remove demo-protected routing and use Osiris permission subjects for protected routes.
- Modify shared runtime consumers under `apps/web/src/app/`, `apps/web/src/components/`, and `apps/web/src/lib/`: remove `useOptionalDemoData()` from app-mounted code.
- Keep fixture data only under test/showcase entry points such as `apps/web/src/app/multiTenantIsolation.test.tsx` and `apps/web/src/modules/showcase/`; no production route imports fixture data.
- Test `apps/web/src/app/runtimeProviders.test.ts`: render-level guard that the app shell boots without `DemoDataProvider`.
- Test `apps/web/src/app/demoRuntimeRemoval.test.ts`: static guard that production app files do not import demo-data or branch on `VITE_OKTAVIUS_RUNTIME`.
- Create `apps/web/src/components/data/standardCrudQuery.ts`: query key builder and server list hook for `StandardCrudListPage`.
- Modify `apps/web/src/components/data/StandardCrudListPage.tsx`: replace manual `useEffect` list loading with TanStack Query.
- Test `apps/web/src/components/data/standardCrudQuery.test.ts`: stable scoped query keys and request params.
- Modify `apps/web/scripts/assert-bundle-budget.mjs`: check entry, route, vendor, and heavy feature chunks.
- Test `apps/web/scripts/assert-bundle-budget.test.mjs`: verifies budget failures for oversized fake chunks.
- Create `apps/web/src/core/i18n/namespaceWarmup.ts`: computes warmable namespaces from enabled modules instead of warming every module namespace.
- Modify `apps/web/src/core/i18n/I18nProvider.tsx`: use targeted namespace warmup.
- Test `apps/web/src/core/i18n/namespaceWarmup.test.ts`: warmup excludes disabled and unrelated module namespaces.
- Modify `apps/web/src/lib/userPreferences.tsx`: remove unsupported `fr` locale until locale files exist.
- Modify `apps/web/src/components/common/LanguageSelector.tsx`: only show supported locales from `@oktavius/i18n`.
- Test `apps/web/src/lib/userPreferences.test.tsx`: stored unsupported locale falls back to `en`.
- Modify `apps/web/src/lib/search/SearchRuntime.ts`: add provider factory for runtime-backed search.
- Modify `apps/web/src/components/command/CommandPalette.tsx`: use runtime search only for entity search; route search remains local.
- Test `apps/web/src/components/command/commandPaletteSearchWiring.test.ts`: verifies runtime-first wiring and no demo entity providers in app-mounted command palette code.
- Modify `apps/web/src/lib/generatedModuleContracts.ts`: extend descriptors for permissions, repeating fields, relation metadata, workflow actions, and related-record panel types.
- Modify `apps/web/src/lib/generatedModuleFiles.ts`: emit richer forms, list actions, and related-record shell config from descriptors.
- Test `apps/web/src/lib/generatedModuleFiles.test.ts`: generated modules include permission metadata, repeating fields, and workflow action wiring.
- Create `apps/web/src/components/data/exportRuntime.ts`: runtime adapter for server export/import jobs with local XLSX fallback.
- Modify `apps/web/src/components/data/CrudMainView.tsx`: use export runtime when available.
- Test `apps/web/src/components/data/exportRuntime.test.ts`: server export path is chosen for configured runtime and local fallback remains lazy.
- Modify lint-warning files: `DashboardPage.tsx`, `EmailPage.tsx`, `ProfilePage.tsx`, `ReportsPage.tsx`, `ReportsPage.test.tsx`, `SettingsPage.tsx`.

## Task 1: Remove Demo Runtime From The App Shell

**Files:**

- Create: `apps/web/src/app/runtimeProviders.tsx`
- Create: `apps/web/src/api/contracts.ts`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/api/apiRegistryConfig.ts`
- Modify: `apps/web/src/api/ApiProvider.tsx`
- Modify: `apps/web/src/api/httpRegistry.ts`
- Modify: `apps/web/src/api/demo-client.ts`
- Modify: `apps/web/src/app/agent-chat-data.tsx`
- Modify: `apps/web/src/lib/locations/ActiveLocationContext.tsx`
- Modify: `apps/web/src/runtime/osiris/types.ts`
- Test: `apps/web/src/app/runtimeProviders.test.ts`
- Test: `apps/web/src/app/demoRuntimeRemoval.test.ts`

- [ ] **Step 1: Write the failing demo-runtime removal guard**

Create `apps/web/src/app/demoRuntimeRemoval.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const productionFiles = [
  'src/app/App.tsx',
  'src/app/router.tsx',
  'src/app/runtimeProviders.tsx',
  'src/app/agent-chat-data.tsx',
  'src/api/ApiProvider.tsx',
  'src/api/apiRegistryConfig.ts',
  'src/api/httpRegistry.ts',
  'src/components/command/CommandPalette.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/HeaderAccountMenu.tsx',
  'src/components/layout/MobileTopBar.tsx',
  'src/components/data/CrudListShell.tsx',
  'src/components/data/CrudTable.tsx',
  'src/components/data/StandardCrudListPage.tsx',
  'src/components/common/DetailView.tsx',
  'src/components/detail/DetailActions.tsx',
  'src/components/detail/DetailPageHeaderActions.tsx',
  'src/components/forms/EntityForm.tsx',
  'src/components/settings/CatalogBlockManager.tsx',
  'src/components/settings/SettingsPageFactory.tsx',
  'src/lib/locations/ActiveLocationContext.tsx',
  'src/lib/org-profiles/useOrgProfile.ts',
  'src/lib/permissions.ts',
  'src/modules/dashboard/DashboardPage.tsx',
  'src/modules/profile/ProfilePage.tsx',
  'src/modules/reports/ReportsPage.tsx',
] as const;

describe('demo runtime removal', () => {
  it.each(productionFiles)('%s does not depend on demo data', (file) => {
    const source = readFileSync(join(process.cwd(), file), 'utf8');

    expect(source).not.toContain('@/app/demo-data');
    expect(source).not.toContain('./demo-data');
    expect(source).not.toContain('@/api/demo-client');
    expect(source).not.toContain('./demo-client');
    expect(source).not.toContain('useDemoData(');
    expect(source).not.toContain('useOptionalDemoData(');
    expect(source).not.toContain('DemoDataProvider');
  });

  it('removes the runtime mode switch from app code', () => {
    const runtimeSource = readFileSync(join(process.cwd(), 'src/app/runtimeProviders.tsx'), 'utf8');
    const routerSource = readFileSync(join(process.cwd(), 'src/app/router.tsx'), 'utf8');

    expect(runtimeSource).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(routerSource).not.toContain('VITE_OKTAVIUS_RUNTIME');
    expect(runtimeSource).not.toContain('DemoRuntimeProviders');
    expect(routerSource).not.toContain('DemoProtectedRoute');
  });
});
```

- [ ] **Step 2: Run the failing guard**

Run: `pnpm --filter @oktavius/web exec vitest run src/app/demoRuntimeRemoval.test.ts`

Expected: FAIL while app-mounted files still import `demo-data`, import `api/demo-client`, call `useOptionalDemoData()`, or branch on `VITE_OKTAVIUS_RUNTIME`.

- [ ] **Step 3: Split shared API contracts out of `demo-client.ts`**

Create `apps/web/src/api/contracts.ts`:

```ts
export class ApiValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'ApiValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class ApiAuthorizationError extends Error {
  readonly requirement: string;

  constructor(message: string, requirement: string) {
    super(message);
    this.name = 'ApiAuthorizationError';
    this.requirement = requirement;
  }
}

export type ListResponse<T> = {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type ApiListParams = Record<string, string | undefined>;

export type ApiCrudResourceHandlers<
  TRecord = Record<string, unknown>,
  TListParams extends ApiListParams = ApiListParams,
  TCreateInput = Partial<TRecord>,
  TUpdateInput = Partial<TRecord>,
> = {
  list: (params: TListParams) => Promise<ListResponse<TRecord>>;
  get: (id: string) => Promise<TRecord | null>;
  create: (input: TCreateInput) => Promise<TRecord>;
  update: (id: string, input: TUpdateInput) => Promise<TRecord>;
  delete: (id: string) => Promise<void>;
};

export type ApiRegistry = {
  cases: ApiCrudResourceHandlers;
  caseChecklists: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    updateDone: (id: string, done: boolean) => Promise<Record<string, unknown>>;
  };
  clients: ApiCrudResourceHandlers;
  contacts: ApiCrudResourceHandlers;
  contracts: ApiCrudResourceHandlers;
  incidents: ApiCrudResourceHandlers;
  invoices: ApiCrudResourceHandlers;
  leads: ApiCrudResourceHandlers;
  orders: ApiCrudResourceHandlers;
  organizations: ApiCrudResourceHandlers;
  parties: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  products: ApiCrudResourceHandlers;
  projects: ApiCrudResourceHandlers;
  purchasing: ApiCrudResourceHandlers;
  staff: ApiCrudResourceHandlers;
  users: ApiCrudResourceHandlers;
  vendors: ApiCrudResourceHandlers;
};
```

Update production files to import from `contracts.ts`:

```ts
import type { ApiRegistry, ListResponse } from './contracts';
```

Keep `apps/web/src/api/demo-client.ts` as a fixture/demo-handler typing file only. Move the shared error and response definitions out of it and re-export them:

```ts
export {
  ApiAuthorizationError,
  ApiValidationError,
  type ApiCrudResourceHandlers,
  type ApiRegistry,
  type ListResponse,
} from './contracts';
```

Then define the legacy alias in `demo-client.ts` from its typed fixture handlers:

```ts
export type DemoApiRegistry = {
  cases: CasesHandlers;
  caseChecklists: CaseChecklistsHandlers;
  clients: ClientsHandlers;
  contacts: ContactsHandlers;
  contracts: ContractsHandlers;
  incidents: IncidentsHandlers;
  invoices: InvoicesHandlers;
  leads: LeadsHandlers;
  orders: OrdersHandlers;
  organizations: OrganizationsHandlers;
  parties: PartiesHandlers;
  products: ProductsHandlers;
  projects: ProjectsHandlers;
  purchasing: PurchasingHandlers;
  staff: StaffHandlers;
  users: UsersHandlers;
  vendors: VendorsHandlers;
};
```

- [ ] **Step 4: Create Osiris-only runtime providers**

Replace `apps/web/src/app/runtimeProviders.tsx` with:

```tsx
import { useMemo, type ReactNode } from 'react';

import { ApiProvider } from '@/api/ApiProvider';
import { createOsirisApiRegistry } from '@/api/apiRegistryConfig';
import { I18nProvider } from '@/core/i18n';
import { useOsirisI18nRuntime } from '@/core/i18n/osirisRuntimeAdapter';
import { ActiveLocationProvider } from '@/lib/locations/ActiveLocationContext';
import { UserPreferencesProvider } from '@/lib/userPreferences';
import { OsirisAuthProvider } from '@/runtime/osiris/AuthProvider';
import { useOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { AgentChatProvider } from './agent-chat-data';

function I18nBridge({ children }: { children: ReactNode }) {
  const runtime = useOsirisI18nRuntime();
  return <I18nProvider runtime={runtime}>{children}</I18nProvider>;
}

function OsirisApiProvider({ children }: { children: ReactNode }) {
  const runtime = useOsirisRuntime();
  const registry = useMemo(
    () =>
      createOsirisApiRegistry({
        env: import.meta.env,
        osiris: {
          getActiveOrgId: () => runtime.activeOrgId,
          getActiveSiteId: () => runtime.activeSiteId,
        },
      }),
    [runtime.activeOrgId, runtime.activeSiteId],
  );

  return <ApiProvider registry={registry}>{children}</ApiProvider>;
}

function SharedRuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <ActiveLocationProvider>
      <AgentChatProvider>{children}</AgentChatProvider>
    </ActiveLocationProvider>
  );
}

function OsirisRuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <OsirisAuthProvider>
      <I18nBridge>
        <OsirisApiProvider>
          <SharedRuntimeProviders>{children}</SharedRuntimeProviders>
        </OsirisApiProvider>
      </I18nBridge>
    </OsirisAuthProvider>
  );
}

export function RuntimeProviders({ children }: { children: ReactNode }) {
  return (
    <UserPreferencesProvider>
      <OsirisRuntimeProviders>{children}</OsirisRuntimeProviders>
    </UserPreferencesProvider>
  );
}
```

- [ ] **Step 5: Add `createOsirisApiRegistry`**

In `apps/web/src/api/apiRegistryConfig.ts`, import the neutral registry type and add:

```ts
import type { ApiRegistry } from './contracts';
```

```ts
export function createOsirisApiRegistry({
  env,
  osiris,
}: {
  env: ApiRegistryEnvironment;
  osiris: OsirisApiRegistryContextGetters;
}): ApiRegistry {
  const baseUrl = env.VITE_OKTAVIUS_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('VITE_OKTAVIUS_API_BASE_URL is required for Osiris runtime.');
  }

  return createHttpRegistry({
    baseUrl: '',
    endpoints: DEFAULT_HTTP_REGISTRY_ENDPOINTS,
    fetcher: createOsirisApiFetcher({ baseUrl, ...osiris }),
  });
}
```

Then simplify the Osiris branch in `createConfiguredApiRegistry`:

```ts
if (osiris) {
  return createOsirisApiRegistry({ env, osiris });
}
```

- [ ] **Step 6: Remove demo-protected routing**

In `apps/web/src/app/router.tsx`, remove the `useDemoData` import, `USE_DEMO_RUNTIME`, `DemoProtectedRoute`, and the runtime selector inside `ProtectedRoute`. Keep a single Osiris-backed protected route:

```tsx
function ProtectedRoute({ routeId, children }: { routeId: AppNavRouteId; children: ReactNode }) {
  const { permissionSubject, isLoading, error, reload } = useOsirisRuntime();

  if (isLoading) {
    return <AppShellSpinner label="Loading access..." />;
  }

  if (error) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <div className="max-w-md rounded-card border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h2 className="text-base font-semibold">Unable to load access</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => {
              void reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const item = APP_NAV_MODULES.find((entry) => entry.id === routeId);
  const canAccess = item != null && canAccessAppNavItem(item, permissionSubject);

  return canAccess ? children : pageElement(AccessDeniedPage);
}
```

- [ ] **Step 7: Make active-location runtime-backed**

Extend `OsirisRuntimeState` in `apps/web/src/runtime/osiris/types.ts`:

```ts
setActiveSiteId?: (siteId: string | null) => void | Promise<void>;
```

In `apps/web/src/lib/locations/ActiveLocationContext.tsx`, remove `useOptionalDemoData`, `getOrgProfile`, and `DEMO_LOCATIONS`. Use Osiris runtime only:

```tsx
export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const activeSiteId = osirisRuntime?.activeSiteId ?? null;
  const locations = useMemo(
    () =>
      (osirisRuntime?.locationAccess?.sites ?? []).map<LocationDetailItem>((site) => ({
        id: site.id,
        name: site.name,
        isActive: site.isActive ?? true,
        branchCode: null,
        designation: null,
        locality: null,
        category: null,
        phone: null,
        mobilePhone: null,
        fax: null,
        companyName: null,
        email: null,
        street: null,
        postalCode: null,
      })),
    [osirisRuntime?.locationAccess?.sites],
  );

  useEffect(() => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'scope' });
  }, [activeOrgId, activeSiteId, queryClient]);

  const setActiveLocationId = useCallback(
    (id: string | null) => {
      void osirisRuntime?.setActiveSiteId?.(id);
    },
    [osirisRuntime],
  );

  const setAllLocationsMode = useCallback(() => {
    void osirisRuntime?.setActiveSiteId?.(null);
  }, [osirisRuntime]);

  const value = useMemo<ActiveLocationContextValue>(() => {
    const viewAllLocations = activeSiteId === null;
    const activeLocation =
      viewAllLocations || !activeSiteId
        ? null
        : (locations.find((location) => location.id === activeSiteId) ?? null);

    return {
      activeLocationId: activeSiteId,
      viewAllLocations,
      setActiveLocationId,
      setAllLocationsMode,
      locations,
      activeLocation,
    };
  }, [activeSiteId, locations, setActiveLocationId, setAllLocationsMode]);

  return <ActiveLocationContext.Provider value={value}>{children}</ActiveLocationContext.Provider>;
}
```

- [ ] **Step 8: Remove demo data from app-mounted shared consumers**

For every file listed in `productionFiles` inside `demoRuntimeRemoval.test.ts`, replace demo context reads with Osiris runtime, active-location context, API registry data, or empty local state if the feature is still a client-only shell. The minimum replacements for this task are:

```tsx
// Before
const demoData = useOptionalDemoData();
const activeOrgId = osirisRuntime?.activeOrgId ?? demoData?.activeOrgId ?? null;

// After
const osirisRuntime = useOptionalOsirisRuntime();
const activeOrgId = osirisRuntime?.activeOrgId ?? null;
```

```tsx
// Before
const users = demoData?.users ?? [];
const clients = demoData?.clients ?? [];

// After
const users = osirisRuntime?.currentUser ? [osirisRuntime.currentUser] : [];
const clients: Array<{ id: string; name: string }> = [];
```

Fixture-only files may still import `demo-data`, but they must be outside the production guard list: tests, `src/modules/showcase/**`, and `src/lib/demo/**`.

- [ ] **Step 9: Thin out `App.tsx`**

```tsx
import { RuntimeProviders } from './runtimeProviders';
import { AppRouter } from './router';

export function App() {
  return (
    <RuntimeProviders>
      <AppRouter />
    </RuntimeProviders>
  );
}
```

- [ ] **Step 10: Run runtime removal tests**

Run: `pnpm --filter @oktavius/web exec vitest run src/app/demoRuntimeRemoval.test.ts src/app/runtimeProviders.test.ts src/runtime/osiris/bootstrap.test.ts src/api/apiRegistryConfig.test.ts`

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add apps/web/src/app/App.tsx apps/web/src/app/router.tsx apps/web/src/app/runtimeProviders.tsx apps/web/src/app/runtimeProviders.test.ts apps/web/src/app/demoRuntimeRemoval.test.ts apps/web/src/api/contracts.ts apps/web/src/api/apiRegistryConfig.ts apps/web/src/api/apiRegistryConfig.test.ts apps/web/src/api/ApiProvider.tsx apps/web/src/api/httpRegistry.ts apps/web/src/api/demo-client.ts apps/web/src/app/agent-chat-data.tsx apps/web/src/lib/locations/ActiveLocationContext.tsx apps/web/src/runtime/osiris/types.ts
git commit -m "refactor: remove demo runtime from app shell"
```

## Task 2: Move Server Lists To TanStack Query

**Files:**

- Create: `apps/web/src/components/data/standardCrudQuery.ts`
- Modify: `apps/web/src/components/data/StandardCrudListPage.tsx`
- Test: `apps/web/src/components/data/standardCrudQuery.test.ts`
- Test: `apps/web/src/components/data/standardListCrud.test.tsx`

- [ ] **Step 1: Write query-key tests**

```ts
import { describe, expect, it } from 'vitest';

import {
  buildStandardCrudListQueryKey,
  buildStandardCrudListRequestParams,
} from './standardCrudQuery';

describe('standard CRUD query helpers', () => {
  it('builds stable request params from URL list state', () => {
    expect(
      buildStandardCrudListRequestParams({
        page: 2,
        pageSize: 25,
        sort: '-createdAt',
        search: 'apex',
        values: { status: 'active', city: '' },
      }),
    ).toEqual({
      page: '2',
      pageSize: '25',
      sort: '-createdAt',
      search: 'apex',
      status: 'active',
      city: '',
    });
  });

  it('includes org/site scope and resource in query keys', () => {
    expect(
      buildStandardCrudListQueryKey({
        resourceKey: 'clients',
        activeOrgId: 'org_1',
        activeSiteId: 'site_1',
        requestParams: {
          page: '1',
          pageSize: '10',
          sort: 'name',
          search: '',
          status: 'active',
        },
      }),
    ).toEqual([
      'scope',
      'org_1',
      'site_1',
      'standard-crud-list',
      'clients',
      {
        page: '1',
        pageSize: '10',
        search: '',
        sort: 'name',
        status: 'active',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/data/standardCrudQuery.test.ts`

Expected: FAIL because `standardCrudQuery.ts` does not exist.

- [ ] **Step 3: Add query helpers and hook**

```ts
import { useQuery } from '@tanstack/react-query';

import type { ListResponse } from '@/api/contracts';

import type { StandardCrudListRequestParams } from './StandardCrudListPage';

export function buildStandardCrudListRequestParams({
  page,
  pageSize,
  sort,
  search,
  values,
}: {
  page: number;
  pageSize: number;
  sort: string;
  search: string;
  values: Record<string, string>;
}): StandardCrudListRequestParams {
  return {
    page: String(page),
    pageSize: String(pageSize),
    sort,
    search,
    ...values,
  };
}

export function buildStandardCrudListQueryKey({
  resourceKey,
  activeOrgId,
  activeSiteId,
  requestParams,
}: {
  resourceKey: string;
  activeOrgId: string | null;
  activeSiteId: string | null;
  requestParams: StandardCrudListRequestParams;
}) {
  return [
    'scope',
    activeOrgId ?? 'none',
    activeSiteId ?? 'none',
    'standard-crud-list',
    resourceKey,
    requestParams,
  ] as const;
}

export function useStandardCrudServerList<T>({
  enabled,
  loadRows,
  queryKey,
  requestParams,
}: {
  enabled: boolean;
  loadRows?: (params: StandardCrudListRequestParams) => Promise<ListResponse<T>>;
  queryKey: readonly unknown[];
  requestParams: StandardCrudListRequestParams;
}) {
  return useQuery({
    enabled: enabled && Boolean(loadRows),
    queryKey,
    queryFn: () => {
      if (!loadRows) throw new Error('Standard CRUD list loader is not configured.');
      return loadRows(requestParams);
    },
    placeholderData: (previous) => previous,
  });
}
```

- [ ] **Step 4: Modify `StandardCrudListPage.tsx` to use Query**

Replace local `serverList` and `isLoadingServerList` state with:

```tsx
const osirisRuntime = useOsirisRuntime();
const { activeLocationId } = useActiveLocation();
const requestParams = useMemo(
  () =>
    buildStandardCrudListRequestParams({
      page: list.page,
      pageSize: list.pageSize,
      sort: list.sort,
      search: list.search,
      values: list.values,
    }),
  [list.page, list.pageSize, list.sort, list.search, valuesKey],
);
const serverListQuery = useStandardCrudServerList<T>({
  enabled: Boolean(loadRows),
  loadRows,
  requestParams,
  queryKey: buildStandardCrudListQueryKey({
    resourceKey: exportFileName,
    activeOrgId: osirisRuntime.activeOrgId,
    activeSiteId: activeLocationId,
    requestParams,
  }),
});
const serverList = serverListQuery.data ?? null;
const isLoadingServerList = serverListQuery.isLoading;
const isFetchingServerList = serverListQuery.isFetching;
```

Then pass:

```tsx
rows={serverList?.data ?? list.paged}
isLoading={isLoadingServerList && !serverList}
isFetching={isFetchingServerList && Boolean(serverList)}
```

Remove the manual `useEffect`, `useState`, and cancellation flag.

- [ ] **Step 5: Run focused list tests**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/data/standardCrudQuery.test.ts src/components/data/standardListCrud.test.tsx src/app/multiTenantIsolation.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/data/standardCrudQuery.ts apps/web/src/components/data/standardCrudQuery.test.ts apps/web/src/components/data/StandardCrudListPage.tsx apps/web/src/components/data/standardListCrud.test.tsx
git commit -m "refactor: query-back standard crud lists"
```

## Task 3: Add Real Bundle Budgets For Lazy Chunks

**Files:**

- Modify: `apps/web/scripts/assert-bundle-budget.mjs`
- Test: `apps/web/scripts/assert-bundle-budget.test.mjs`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Write bundle-budget tests**

```js
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { assertBundleBudget } from './assert-bundle-budget.mjs';

describe('bundle budget', () => {
  it('fails an oversized vendor chunk', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'oktavius-budget-'));
    try {
      await writeFile(path.join(dir, 'index-a.js'), 'console.log("ok")');
      await writeFile(path.join(dir, 'react-vendor-a.js'), 'x'.repeat(650 * 1024));

      await expect(assertBundleBudget(dir)).rejects.toThrow('react-vendor-a.js exceeds vendor');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('allows known lazy heavy feature chunks below the configured ceiling', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'oktavius-budget-'));
    try {
      await writeFile(path.join(dir, 'index-a.js'), 'console.log("ok")');
      await writeFile(path.join(dir, 'xlsx-vendor-a.js'), 'x'.repeat(420 * 1024));

      await expect(assertBundleBudget(dir)).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run scripts/assert-bundle-budget.test.mjs`

Expected: FAIL because `assertBundleBudget` is not exported.

- [ ] **Step 3: Export a reusable budget assertion**

Replace the script body with:

```js
import { readdir, stat, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const BUDGETS = [
  { name: 'entry', pattern: /^index-[\w-]+\.js$/, raw: 80 * 1024, gzip: 30 * 1024, required: true },
  { name: 'vendor', pattern: /vendor-[\w-]+\.js$/, raw: 520 * 1024, gzip: 180 * 1024 },
  {
    name: 'heavy-feature',
    pattern: /^(xlsx-vendor|rich-text-ui|chart-ui)-[\w-]+\.js$/,
    raw: 460 * 1024,
    gzip: 160 * 1024,
  },
  { name: 'route', pattern: /^[A-Z][\w-]+-[\w-]+\.js$/, raw: 240 * 1024, gzip: 80 * 1024 },
];

function budgetFor(file) {
  return BUDGETS.find((budget) => budget.pattern.test(file));
}

export async function assertBundleBudget(assetsDir = new URL('../dist/assets/', import.meta.url)) {
  const files = await readdir(assetsDir);
  const jsFiles = files.filter((file) => file.endsWith('.js'));

  for (const budget of BUDGETS.filter((entry) => entry.required)) {
    const matches = jsFiles.filter((file) => budget.pattern.test(file));
    if (matches.length !== 1) {
      throw new Error(
        `Expected one ${budget.name} chunk, found ${matches.length}: ${matches.join(', ')}`,
      );
    }
  }

  for (const file of jsFiles) {
    const budget = budgetFor(file);
    if (!budget) continue;
    const filePath = path.join(String(assetsDir), file);
    const source = await readFile(filePath);
    const rawBytes = (await stat(filePath)).size;
    const gzipBytes = gzipSync(source).byteLength;
    if (rawBytes > budget.raw || gzipBytes > budget.gzip) {
      throw new Error(
        `${file} exceeds ${budget.name} budget: raw ${formatBytes(rawBytes)} / ${formatBytes(budget.raw)}, gzip ${formatBytes(gzipBytes)} / ${formatBytes(budget.gzip)}`,
      );
    }
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await assertBundleBudget();
  console.log('All configured bundle chunks are within budget.');
}
```

- [ ] **Step 4: Add budget test script**

In `apps/web/package.json`, add:

```json
"bundle:test": "vitest run scripts/assert-bundle-budget.test.mjs"
```

- [ ] **Step 5: Run build and budget checks**

Run:

```bash
pnpm --filter @oktavius/web build
pnpm --filter @oktavius/web bundle:test
pnpm --filter @oktavius/web bundle:check
```

Expected: tests PASS. If current chunks fail the new budgets, either split the offending chunk in this task or set the first budget to the current measured size plus 10% and create a follow-up line in this plan's final notes with the exact chunk name and target.

- [ ] **Step 6: Commit**

```bash
git add apps/web/scripts/assert-bundle-budget.mjs apps/web/scripts/assert-bundle-budget.test.mjs apps/web/package.json
git commit -m "test: enforce lazy chunk bundle budgets"
```

## Task 4: Target i18n Namespace Warmup

**Files:**

- Create: `apps/web/src/core/i18n/namespaceWarmup.ts`
- Modify: `apps/web/src/core/i18n/I18nProvider.tsx`
- Test: `apps/web/src/core/i18n/namespaceWarmup.test.ts`

- [ ] **Step 1: Write warmup-selection tests**

```ts
import { describe, expect, it } from 'vitest';

import { selectWarmupNamespaces } from './namespaceWarmup';

describe('selectWarmupNamespaces', () => {
  it('warms only enabled route namespaces and always useful shell namespaces', () => {
    expect(
      selectWarmupNamespaces({
        allNamespaces: ['dashboard', 'clients', 'reports', 'calendar', 'funeral_cases'],
        coreNamespaces: ['common', 'navigation'],
        enabledModuleIds: ['dashboard', 'clients', 'reports'],
      }),
    ).toEqual(['dashboard', 'clients', 'reports']);
  });

  it('does not warm disabled heavy module namespaces', () => {
    expect(
      selectWarmupNamespaces({
        allNamespaces: ['calendar', 'funeral_cases', 'doc_processing'],
        coreNamespaces: ['common'],
        enabledModuleIds: ['calendar'],
      }),
    ).toEqual(['calendar']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/core/i18n/namespaceWarmup.test.ts`

Expected: FAIL because `namespaceWarmup.ts` does not exist.

- [ ] **Step 3: Add targeted namespace selection**

```ts
import type { TranslationNamespace } from '@oktavius/i18n';

export function selectWarmupNamespaces({
  allNamespaces,
  coreNamespaces,
  enabledModuleIds,
}: {
  allNamespaces: readonly TranslationNamespace[];
  coreNamespaces: readonly TranslationNamespace[];
  enabledModuleIds: readonly string[];
}): TranslationNamespace[] {
  const core = new Set(coreNamespaces);
  const enabled = new Set(enabledModuleIds);

  return allNamespaces.filter((namespace) => !core.has(namespace) && enabled.has(namespace));
}
```

- [ ] **Step 4: Wire targeted warmup**

In `I18nProvider.tsx`, replace:

```ts
const moduleNs = ALL_NAMESPACES.filter((ns) => !CORE_NAMESPACES.includes(ns));
```

with:

```ts
const moduleNs = selectWarmupNamespaces({
  allNamespaces: ALL_NAMESPACES,
  coreNamespaces: CORE_NAMESPACES,
  enabledModuleIds: runtime.enabledModuleIds ?? [],
});
```

Extend `I18nRuntimeAdapter` in `apps/web/src/core/i18n/runtime.ts`:

```ts
enabledModuleIds?: string[];
```

Extend `useOsirisI18nRuntime()` to pass enabled module ids from the runtime config:

```ts
enabledModuleIds: runtime.config?.enabledModuleIds ?? [],
```

If the runtime has not loaded module configuration yet, keep the fallback as an empty array to avoid warming every namespace.

- [ ] **Step 5: Run focused i18n tests**

Run:

```bash
pnpm --filter @oktavius/web exec vitest run src/core/i18n/namespaceWarmup.test.ts
pnpm --filter @oktavius/i18n validate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/core/i18n/namespaceWarmup.ts apps/web/src/core/i18n/namespaceWarmup.test.ts apps/web/src/core/i18n/I18nProvider.tsx apps/web/src/core/i18n/runtime.ts apps/web/src/core/i18n/osirisRuntimeAdapter.ts
git commit -m "perf: target i18n namespace warmup"
```

## Task 5: Remove Unsupported French Locale

**Files:**

- Modify: `apps/web/src/lib/userPreferences.tsx`
- Modify: `apps/web/src/components/common/LanguageSelector.tsx`
- Test: `apps/web/src/lib/userPreferences.test.tsx`

- [ ] **Step 1: Write locale fallback test**

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { UserPreferencesProvider, useUserPreferences } from './userPreferences';

function Probe() {
  const { locale } = useUserPreferences();
  return <span data-locale={locale}>{locale}</span>;
}

describe('UserPreferencesProvider locales', () => {
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
      root = null;
    }
    document.body.innerHTML = '';
    window.localStorage.clear();
  });

  it('falls back to English when storage contains an unsupported locale', () => {
    window.localStorage.setItem('oktavius.ui.locale', 'fr');
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <UserPreferencesProvider>
          <Probe />
        </UserPreferencesProvider>,
      );
    });

    expect(container.querySelector('[data-locale]')?.getAttribute('data-locale')).toBe('en');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/lib/userPreferences.test.tsx`

Expected: FAIL because `fr` is currently accepted.

- [ ] **Step 3: Remove `fr` from preferences**

Change:

```ts
export type UiLocale = 'de' | 'en' | 'fr';
```

to:

```ts
export type UiLocale = 'de' | 'en';
```

Change `LOCALE_LABELS` to:

```ts
const LOCALE_LABELS: Record<UiLocale, string> = {
  de: 'Deutsch',
  en: 'English',
};
```

Change stored locale parsing to:

```ts
if (stored === 'de' || stored === 'en') {
  return stored;
}
```

- [ ] **Step 4: Ensure the language selector uses supported options**

In `LanguageSelector.tsx`, ensure it imports `UI_LOCALE_OPTIONS` from `userPreferences.tsx` and does not define an independent locale list.

- [ ] **Step 5: Run locale and i18n checks**

Run:

```bash
pnpm --filter @oktavius/web exec vitest run src/lib/userPreferences.test.tsx
pnpm --filter @oktavius/web typecheck
pnpm --filter @oktavius/i18n validate
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/userPreferences.tsx apps/web/src/lib/userPreferences.test.tsx apps/web/src/components/common/LanguageSelector.tsx
git commit -m "fix: remove unsupported French locale"
```

## Task 6: Make Command Palette Runtime-First

**Files:**

- Modify: `apps/web/src/lib/search/SearchRuntime.ts`
- Modify: `apps/web/src/components/command/CommandPalette.tsx`
- Test: `apps/web/src/components/command/commandPaletteSearchWiring.test.ts`

- [ ] **Step 1: Extend the wiring test**

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('command palette search wiring', () => {
  it('uses runtime entity search and does not import demo entity providers', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/command/CommandPalette.tsx'),
      'utf8',
    );

    expect(source).toContain('createRuntimeSearchProvider');
    expect(source).toContain('useOptionalOsirisRuntime');
    expect(source).not.toContain('createDemoClientsSearchProvider');
    expect(source).not.toContain('createDemoOrdersSearchProvider');
    expect(source).not.toContain('useOptionalDemoData');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/command/commandPaletteSearchWiring.test.ts`

Expected: FAIL because command palette still creates demo providers or reads demo data.

- [ ] **Step 3: Add a runtime-backed search provider**

```ts
import type { SearchProvider } from './types';

export type SearchRuntimeAdapter = {
  search: (query: string, signal: AbortSignal) => Promise<import('./types').SearchResult[]>;
};

export const NOOP_SEARCH_RUNTIME: SearchRuntimeAdapter = {
  search: async () => [],
};

export function createRuntimeSearchProvider(runtime: SearchRuntimeAdapter): SearchProvider {
  return {
    id: 'runtime',
    label: 'Global search',
    search: (query, signal) => runtime.search(query, signal),
  };
}
```

- [ ] **Step 4: Wire `CommandPalette` to runtime mode**

In `CommandPalette.tsx`, import:

```ts
import { createRuntimeSearchProvider } from '@/lib/search/SearchRuntime';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
```

Then inside `CommandPaletteProvider`:

```tsx
const osirisRuntime = useOptionalOsirisRuntime();
const searchRuntime = osirisRuntime?.searchRuntime;
```

Build providers like:

```tsx
const providers = useMemo<SearchProvider[]>(() => {
  const routeProvider = createRouteSearchProvider(routeItems);
  const entityProviders = searchRuntime ? [createRuntimeSearchProvider(searchRuntime)] : [];

  return [routeProvider, ...entityProviders].filter((provider) =>
    canUsePermissionRequirement(permissionSubject, provider.permission),
  );
}, [permissionSubject, routeItems, searchRuntime]);
```

Extend `OsirisRuntimeState` in `apps/web/src/runtime/osiris/types.ts`:

```ts
searchRuntime?: SearchRuntimeAdapter;
```

- [ ] **Step 5: Run command palette tests**

Run:

```bash
pnpm --filter @oktavius/web exec vitest run src/components/command/commandPaletteSearchWiring.test.ts src/lib/search/registry.test.ts
pnpm --filter @oktavius/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/search/SearchRuntime.ts apps/web/src/components/command/CommandPalette.tsx apps/web/src/components/command/commandPaletteSearchWiring.test.ts apps/web/src/runtime/osiris/types.ts
git commit -m "refactor: make command search runtime first"
```

## Task 7: Upgrade Generated Module Descriptors For Real ERP Workflows

**Files:**

- Modify: `apps/web/src/lib/generatedModuleContracts.ts`
- Modify: `apps/web/src/lib/generatedModuleFiles.ts`
- Test: `apps/web/src/lib/generatedModuleContracts.test.ts`
- Test: `apps/web/src/lib/generatedModuleFiles.test.ts`

- [ ] **Step 1: Write generator tests for richer descriptors**

Add this test to `generatedModuleFiles.test.ts`:

```ts
it('emits permissions, repeating fields, relations, and workflow actions', () => {
  const files = emitGeneratedModuleScaffoldFiles([
    {
      moduleId: 'orders',
      basePath: '/orders',
      apiResource: 'orders',
      list: {
        title: 'Orders',
        defaultSort: '-createdAt',
        searchKeys: ['orderNumber'],
        filterKeys: ['status'],
        columns: [{ key: 'orderNumber', header: 'Order number', sortable: true }],
        rowActions: [
          {
            key: 'approve',
            label: 'Approve',
            permission: 'orders.approve',
            workflowAction: { endpoint: 'approve', method: 'POST' },
          },
        ],
      },
      forms: ['create'],
      formFields: [
        { name: 'clientId', label: 'Client', type: 'relation', relation: { resource: 'clients' } },
        {
          name: 'lines',
          label: 'Lines',
          type: 'repeating',
          itemFields: [
            { name: 'description', label: 'Description', type: 'text', required: true },
            { name: 'quantity', label: 'Qty', type: 'number', required: true },
          ],
        },
      ],
      detail: {
        tabKeys: ['overview', 'documents'],
        relatedRecords: [{ key: 'documents', type: 'documents', title: 'Documents' }],
      },
    },
  ]);

  const listPage = files.find((file) => file.path.endsWith('list-page.tsx'))?.content ?? '';
  const createPage = files.find((file) => file.path.endsWith('create-page.tsx'))?.content ?? '';
  const detailPage = files.find((file) => file.path.endsWith('detail-page.tsx'))?.content ?? '';

  expect(listPage).toContain("permission: 'orders.approve'");
  expect(listPage).toContain("workflowAction: { endpoint: 'approve', method: 'POST' }");
  expect(createPage).toContain("type: 'repeating'");
  expect(createPage).toContain("relation: { resource: 'clients' }");
  expect(detailPage).toContain("type: 'documents'");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/lib/generatedModuleFiles.test.ts`

Expected: FAIL because descriptor types do not include these fields.

- [ ] **Step 3: Extend descriptor types**

In `generatedModuleContracts.ts`, extend field/action descriptors:

```ts
type GeneratedModuleWorkflowActionDescriptor = {
  endpoint: string;
  method: 'POST' | 'PATCH';
};

type GeneratedModuleRelationDescriptor = {
  resource: GeneratedModuleTemplateApiResource;
  labelKey?: string;
  valueKey?: string;
};

type GeneratedModuleRelatedRecordDescriptor = {
  key: string;
  type: 'crud' | 'documents' | 'timeline' | 'checklist' | 'storage';
  title: string;
};
```

Add to `GeneratedModuleTemplateListActionDescriptor`:

```ts
permission?: string | string[];
workflowAction?: GeneratedModuleWorkflowActionDescriptor;
```

Add to `GeneratedModuleTemplateFieldDescriptor`:

```ts
type: ... | 'repeating';
relation?: GeneratedModuleRelationDescriptor;
itemFields?: GeneratedModuleTemplateFieldDescriptor[];
minItems?: number;
maxItems?: number;
```

Replace `relatedRecordKeys?: string[]` with:

```ts
relatedRecords?: GeneratedModuleRelatedRecordDescriptor[];
```

- [ ] **Step 4: Emit richer generated code**

In `generatedModuleFiles.ts`, add formatting helpers:

```ts
function formatPermissionProperty(permission: string | string[] | undefined): string[] {
  if (!permission) return [];
  return Array.isArray(permission)
    ? [`permission: [${permission.map((entry) => `'${entry}'`).join(', ')}]`]
    : [`permission: '${permission}'`];
}

function formatWorkflowActionProperty(action: GeneratedModuleTemplateListAction): string[] {
  if (!action.workflowAction) return [];
  return [
    `workflowAction: { endpoint: '${action.workflowAction.endpoint}', method: '${action.workflowAction.method}' }`,
  ];
}
```

In action formatting, include both property lists before `onClick`.

In field formatting, include:

```ts
...(field.relation ? [`relation: { resource: '${field.relation.resource}' }`] : []),
...(field.itemFields?.length ? [`itemFields: [${field.itemFields.map(formatFieldDescriptor).join(', ')}]`] : []),
...formatOptionalBooleanProperty('required', field.required),
...(field.minItems != null ? [`minItems: ${field.minItems}`] : []),
...(field.maxItems != null ? [`maxItems: ${field.maxItems}`] : []),
```

In detail generation, emit `relatedRecords` into a constant:

```ts
const generatedRelatedRecords = [
  { key: 'documents', type: 'documents', title: 'Documents' },
] as const;
```

Render a compact `SectionCard` per related-record descriptor until each panel type has a dedicated generic renderer:

```tsx
{
  generatedRelatedRecords.map((related) => (
    <SectionCard key={related.key} title={related.title} meta={related.type}>
      <p className="text-sm text-muted-foreground">{related.key}</p>
    </SectionCard>
  ));
}
```

- [ ] **Step 5: Run generator tests**

Run:

```bash
pnpm --filter @oktavius/web exec vitest run src/lib/generatedModuleFiles.test.ts src/lib/generatedModuleContracts.test.ts src/lib/generatedModuleContract.test.ts
pnpm --filter @oktavius/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/generatedModuleContracts.ts apps/web/src/lib/generatedModuleFiles.ts apps/web/src/lib/generatedModuleFiles.test.ts apps/web/src/lib/generatedModuleContracts.test.ts apps/web/src/lib/generatedModuleContract.test.ts
git commit -m "feat: enrich generated module descriptors"
```

## Task 8: Add Export Runtime Adapter For Large ERP Exports

**Files:**

- Create: `apps/web/src/components/data/exportRuntime.ts`
- Modify: `apps/web/src/components/data/CrudMainView.tsx`
- Test: `apps/web/src/components/data/exportRuntime.test.ts`

- [ ] **Step 1: Write export runtime tests**

```ts
import { describe, expect, it, vi } from 'vitest';

import { chooseExportStrategy } from './exportRuntime';

describe('export runtime', () => {
  it('uses server export when runtime is configured and row count is above threshold', () => {
    const runtime = { startExport: vi.fn() };

    expect(chooseExportStrategy({ runtime, rowCount: 501, threshold: 500 })).toBe('server');
  });

  it('uses local export when runtime is absent', () => {
    expect(chooseExportStrategy({ rowCount: 5000, threshold: 500 })).toBe('local');
  });

  it('uses local export for small row counts even when runtime exists', () => {
    const runtime = { startExport: vi.fn() };

    expect(chooseExportStrategy({ runtime, rowCount: 25, threshold: 500 })).toBe('local');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/data/exportRuntime.test.ts`

Expected: FAIL because `exportRuntime.ts` does not exist.

- [ ] **Step 3: Add export runtime contract**

```ts
import type { CrudColumn } from './CrudTable';

export type ExportRuntimeAdapter = {
  startExport: (request: {
    resourceKey: string;
    fileName: string;
    columns: Array<{ key: string; header: string }>;
    filters?: Record<string, string>;
    search?: string;
    sort?: string;
  }) => Promise<{ downloadUrl?: string; jobId?: string }>;
};

export function chooseExportStrategy({
  runtime,
  rowCount,
  threshold = 500,
}: {
  runtime?: Pick<ExportRuntimeAdapter, 'startExport'>;
  rowCount: number;
  threshold?: number;
}): 'local' | 'server' {
  return runtime && rowCount > threshold ? 'server' : 'local';
}

export function exportColumnsForRuntime<T>(columns: CrudColumn<T>[]) {
  return columns
    .filter((column) => column.key !== '__select__' && column.key !== '__actions__')
    .map((column) => ({ key: String(column.key), header: column.header }));
}
```

- [ ] **Step 4: Wire `CrudMainView` without breaking local export**

Extend `ExportOptions`:

```ts
runtime?: ExportRuntimeAdapter;
resourceKey?: string;
rowCountThreshold?: number;
filters?: Record<string, string>;
search?: string;
sort?: string;
```

In `handleExport`, before local XLSX:

```ts
const exportData = (allRows ?? rows) as unknown as Record<string, unknown>[];
const strategy = chooseExportStrategy({
  runtime: exportOptions.runtime,
  rowCount: exportData.length,
  threshold: exportOptions.rowCountThreshold,
});

if (strategy === 'server' && exportOptions.runtime) {
  await exportOptions.runtime.startExport({
    resourceKey: exportOptions.resourceKey ?? exportOptions.fileName,
    fileName: exportOptions.fileName,
    columns: exportColumnsForRuntime(columns as unknown as CrudColumn<Record<string, unknown>>[]),
    filters: exportOptions.filters,
    search: exportOptions.search,
    sort: exportOptions.sort,
  });
  return;
}
```

Keep the existing `exportToXlsx` call for the local path.

- [ ] **Step 5: Run export tests**

Run:

```bash
pnpm --filter @oktavius/web exec vitest run src/components/data/exportRuntime.test.ts src/components/data/importFileParser.test.ts
pnpm --filter @oktavius/web typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/data/exportRuntime.ts apps/web/src/components/data/exportRuntime.test.ts apps/web/src/components/data/CrudMainView.tsx
git commit -m "feat: add server export runtime adapter"
```

## Task 9: Clear Known Lint Warnings

**Files:**

- Modify: `apps/web/src/modules/dashboard/DashboardPage.tsx`
- Modify: `apps/web/src/modules/email/EmailPage.tsx`
- Modify: `apps/web/src/modules/profile/ProfilePage.tsx`
- Modify: `apps/web/src/modules/reports/ReportsPage.tsx`
- Modify: `apps/web/src/modules/reports/ReportsPage.test.tsx`
- Modify: `apps/web/src/modules/settings/SettingsPage.tsx`
- Modify locale JSON under `packages/i18n/locales/{en,de}/` if new keys are needed.

- [ ] **Step 1: Capture current warning list**

Run: `pnpm --filter @oktavius/web lint`

Expected: 12 warnings matching dashboard hook deps, email bare strings, profile bare string, reports hook deps/test bare string, settings bare strings.

- [ ] **Step 2: Fix Dashboard hook dependency warning**

Move `activityLabelMap` inside the `useMemo` where it is used, or wrap it:

```tsx
const activityLabelMap = useMemo(
  () => ({
    case: t('dashboard.activity.case'),
    invoice: t('dashboard.activity.invoice'),
    order: t('dashboard.activity.order'),
  }),
  [t],
);
```

Run: `pnpm --filter @oktavius/web lint`

Expected: dashboard warning disappears.

- [ ] **Step 3: Fix reports hook dependency warnings**

Replace logical defaults:

```tsx
const orders = reportsQuery.data?.orders ?? [];
const invoices = reportsQuery.data?.invoices ?? [];
```

with memoized constants:

```tsx
const EMPTY_ORDERS: OrderRecord[] = [];
const EMPTY_INVOICES: InvoiceRecord[] = [];
const orders = reportsQuery.data?.orders ?? EMPTY_ORDERS;
const invoices = reportsQuery.data?.invoices ?? EMPTY_INVOICES;
```

Place `EMPTY_ORDERS` and `EMPTY_INVOICES` at module scope.

Run: `pnpm --filter @oktavius/web lint`

Expected: reports hook dependency warnings disappear.

- [ ] **Step 4: Move bare strings into i18n**

Add keys:

```json
{
  "email": {
    "templates": "Templates",
    "compose": "Compose",
    "noThreadSelected": "No thread selected."
  },
  "profile": {
    "openSettings": "Open settings"
  },
  "settings": {
    "locations": "Locations",
    "locationsDescription": "Sites available in the active-location picker."
  },
  "reports": {
    "builder": "Report builder"
  }
}
```

Use existing namespace files rather than creating new namespaces. Replace JSX text with `t('namespace.key')`.

Run:

```bash
pnpm --filter @oktavius/i18n validate
pnpm --filter @oktavius/web lint
```

Expected: 0 lint errors and 0 lint warnings.

- [ ] **Step 5: Update tests that assert literal English strings**

If `ReportsPage.test.tsx` expects `Report builder`, wrap the mock component output in a translated value or suppress the app lint rule in the test with:

```tsx
// eslint-disable-next-line oktavius/no-bare-jsx-strings
return <div>Report builder</div>;
```

Prefer translated output if the test already has an i18n provider.

- [ ] **Step 6: Run warning-free lint**

Run: `pnpm --filter @oktavius/web lint`

Expected: `✖ 0 problems` or no ESLint problem summary.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/modules/dashboard/DashboardPage.tsx apps/web/src/modules/email/EmailPage.tsx apps/web/src/modules/profile/ProfilePage.tsx apps/web/src/modules/reports/ReportsPage.tsx apps/web/src/modules/reports/ReportsPage.test.tsx apps/web/src/modules/settings/SettingsPage.tsx packages/i18n/locales/en packages/i18n/locales/de
git commit -m "chore: clear frontend lint warnings"
```

## Final Verification Gate

- [ ] **Step 1: Run full web checks**

```bash
pnpm --filter @oktavius/web typecheck
pnpm --filter @oktavius/web lint
pnpm --filter @oktavius/web build
pnpm --filter @oktavius/web bundle:check
pnpm --filter @oktavius/web test
```

Expected:

- typecheck exits 0
- lint exits 0 with no warnings
- build exits 0
- bundle check exits 0
- all Vitest files pass

- [ ] **Step 2: Run i18n checks**

```bash
pnpm --filter @oktavius/i18n validate
pnpm --filter @oktavius/i18n test
pnpm --filter @oktavius/i18n scan:missing
```

Expected:

- all locale namespaces validate
- translation tests pass
- missing-key scan reports all keys present

- [ ] **Step 3: Manual smoke checks**

Run: `pnpm --filter @oktavius/web dev`

Open:

- `/dashboard`: shell loads through the Osiris runtime without any `DemoDataProvider` or `VITE_OKTAVIUS_RUNTIME` branch.
- `/clients`: list loads through React Query and keeps previous data while fetching.
- `⌘K`: palette returns route results and runtime search results in Osiris mode.
- `/showcase`: forms, data table, responsive detail, errors, and settings sections still render in dev mode.

Expected: no console errors from provider nesting, missing translations, or query failures.

## Self-Review Notes

- Spec coverage: all previously identified issues are covered: demo runtime removal, server list query handling, chunk budgets, i18n warmup, unsupported locale, runtime-first search, richer generated module descriptors, export runtime, and lint warnings.
- Placeholder scan: no implementation step relies on unspecified files or unnamed helpers. New helper names are defined before later tasks use them.
- Type consistency: `StandardCrudListRequestParams`, `SearchRuntimeAdapter`, `ExportRuntimeAdapter`, and generated descriptor extensions are introduced before they are consumed.
