# V3 Frontend Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead demo runtime, trim the API registry to real consumers, make the module manifest the single source for routes, de-hardcode funeral/org-profile logic, move codegen out of `src/`, and move preference normalization into the Osiris adapter.

**Architecture:** Pure deletion/refactor inside `apps/web` (plus moving 7 files to `apps/web/tools/`). The app keeps booting through the Osiris runtime only. No new dependencies.

**Tech Stack:** React 18, react-router 7, Vite, Vitest, TypeScript strict.

**Constraints:**

- Working tree already has 12 uncommitted changes (Osiris parity work). Do NOT revert or commit them. No commits at all in this plan — user has not requested commits.
- Spec: `docs/superpowers/specs/2026-06-12-frontend-cleanup-design.md`
- Verification commands (run from `apps/web/`): `pnpm exec tsc --noEmit`, `pnpm exec vitest run`, `pnpm exec eslint src`.

---

### Task 1: Delete the demo runtime

**Files:**

- Delete: `src/app/demo-data.tsx`, `src/app/demo-data/` (4 files), `src/api/demo-handlers/` (whole dir), `src/api/demo-client.ts`, `src/lib/demo/`, `src/app/multiTenantIsolation.test.tsx`, `src/app/demoRuntimeRemoval.test.ts`, `src/app/businessModulesRemoved.test.ts`
- Modify: `src/lib/appNavModules.test.ts` (drop `DEMO_ORG_PROFILES` import, inline fixtures)

- [ ] **Step 1:** Delete the files/dirs listed above (`rm -r`).
- [ ] **Step 2:** `grep -rn "demo-data\|demo-client\|demo-handlers\|useEnsureDemoOrg\|DEMO_ORG_PROFILES\|ORG_KUNZ_ID\|ORG_APEX_ID\|ORG_DEMO_ID" src/` — expect hits only in `lib/appNavModules.test.ts` (and none after Step 3).
- [ ] **Step 3:** Rewrite `lib/appNavModules.test.ts`: replace `DEMO_ORG_PROFILES[ORG_KUNZ_ID]` with an inline `OrgProfile` fixture built from `createDefaultOrgProfile('org_test')` with `enabledModules` excluding `reports` and a funeral-style terminology/navPaths object. Preserve the behavioral assertions (enabled-module filtering, terminology label resolution, path overrides, quick actions empty).
- [ ] **Step 4:** Run `pnpm exec vitest run src/lib/appNavModules.test.ts` → PASS; `pnpm exec tsc --noEmit` → clean.

### Task 2: Trim + generalize the API registry

**Files:**

- Modify: `src/api/contracts.ts`, `src/api/httpRegistry.ts`, `src/api/apiRegistryConfig.ts`, and their tests; `src/api/ApiProvider.tsx` if it references removed resources.

- [ ] **Step 1:** Rewrite the registry shape in `contracts.ts`:

```ts
export const API_RESOURCE_KEYS = ['clients', 'contacts', 'invoices', 'orders', 'projects'] as const;

export type ApiResourceKey = (typeof API_RESOURCE_KEYS)[number];

export type ApiRegistry = Record<ApiResourceKey, ApiCrudResourceHandlers>;
```

Remove `caseChecklists`/`parties` custom handler types. Keep `ApiValidationError`, `ApiAuthorizationError`, `ListResponse`, `ApiListParams`, `ApiCrudResourceHandlers` unchanged.

- [ ] **Step 2:** `httpRegistry.ts`: replace the hardcoded `HttpRegistryEndpoints` interface with

```ts
export type HttpRegistryEndpoints = Partial<Record<ApiResourceKey, string>>;
```

and build the registry by iterating `API_RESOURCE_KEYS`, defaulting each endpoint to `'/' + key`. Delete the bespoke `caseChecklists`/`parties` handler implementations.

- [ ] **Step 3:** `apiRegistryConfig.ts`: `DEFAULT_HTTP_REGISTRY_ENDPOINTS` shrinks to `{}` (all defaults derive from keys) or to only true exceptions. Careful: file has uncommitted changes — edit on top, do not regenerate from old version.
- [ ] **Step 4:** Update `contracts`/`httpRegistry`/`apiRegistryConfig`/`apiStoreConfig` tests to the 5-resource registry.
- [ ] **Step 5:** Verify consumers compile: `modules/reports/ReportsPage.tsx` (orders, invoices), `components/pickers/ProjectPicker.tsx` (projects), `components/pickers/ContactPicker.tsx` (contacts, clients). `pnpm exec tsc --noEmit && pnpm exec vitest run src/api` → PASS.

### Task 3: Module manifest as single source

**Files:**

- Modify: `src/lib/appNavModules.ts`, `src/app/router.tsx`, `src/lib/permissions.ts`, `src/lib/org-profiles/types.ts`, `src/lib/org-profiles/nav-paths.ts`, `src/lib/org-profiles/useOrgProfile.ts`

- [ ] **Step 1:** Extend `AppNavModule` in `appNavModules.ts`:

```ts
export type AppNavModule = {
  id: AppNavRouteId;
  path: string;
  label: string;
  labelKey?: string;
  icon: ComponentType<IconProps>;
  section: AppNavSection;
  devOnly?: boolean;
  superadminOnly?: boolean;
  permission?: PermissionRequirement;
  terminologyKey?: string;
  loadPage: () => Promise<Record<string, ComponentType>>;
  pageExport: string;
};
```

Each entry gets its loader, e.g. dashboard: `loadPage: () => import('@/modules/dashboard/DashboardPage'), pageExport: 'DashboardPage'`. showcase gets `superadminOnly: true`, settings gets `permission: 'org.manage'`.

- [ ] **Step 2:** Delete `isOrgModuleId` and inline its (always-true) result at call sites (`MODULE_NAV_ITEMS` filter, `visiblePathFor`, `isAppNavItemEnabled`).
- [ ] **Step 3:** `permissions.ts`: `canAccessAppNavItem` becomes declarative:

```ts
export function canAccessAppNavItem(item: AppNavModule, subject: PermissionSubject) {
  if (item.superadminOnly) return subject.isSuperadmin;
  return canUsePermissionRequirement(subject, item.permission);
}
```

(Drop the `users` special case — module does not exist.)

- [ ] **Step 4:** `router.tsx`: generate module routes from the manifest:

```ts
const moduleRoutes = APP_NAV_MODULES.map((module) => ({
  path: module.path,
  element:
    module.devOnly && !import.meta.env.DEV ? (
      <Navigate to="/dashboard" replace />
    ) : module.permission || module.superadminOnly ? (
      protectedPageElement(module.id, lazyPage(module.loadPage, module.pageExport))
    ) : (
      modulePageElement(module.id, lazyPage(module.loadPage, module.pageExport))
    ),
}));
```

Hoist `lazyPage` results to module scope (one `lazy()` per manifest entry, not per render). Auth routes, `/` redirect, `/profile`, `/access-denied`, `*` stay manual.

- [ ] **Step 5:** Trim `OrgModuleId` in `org-profiles/types.ts` to `'dashboard' | 'ai-chat' | 'email' | 'calendar' | 'reports' | 'settings' | 'showcase'`; change `navPaths` to `Partial<Record<string, string>>`.
- [ ] **Step 6:** `nav-paths.ts`: check consumers of `casesBasePath`/`clientsBasePath`/`productsBasePath`/`useOrgNavPaths`; if only `useOrgNavPaths` (itself unconsumed), delete helpers + hook. `FUNERAL_NAV_PATHS` moves to the funeral preset in Task 4; `isOsirisFuneralPath` stays if anything imports it (re-export from preset if needed).
- [ ] **Step 7:** `pnpm exec tsc --noEmit && pnpm exec vitest run src/lib src/app` → PASS. Manual check: `pnpm exec vite build` still code-splits one chunk per module.

### Task 4: Config-driven org profiles

**Files:**

- Create: `src/lib/org-profiles/presets/index.ts`, `src/lib/org-profiles/presets/generic.ts`, `src/lib/org-profiles/presets/funeral.ts`
- Modify: `src/lib/org-profiles/types.ts`, `profiles.ts`, `terminology.ts`, `src/components/layout/MobileTopBar.tsx`, `src/modules/dashboard/DashboardPage.tsx`, `src/lib/permissions.ts`, `src/runtime/osiris/permissions.ts`, `src/lib/appNavModules.ts` (permission rename)

- [ ] **Step 1:** `types.ts`:

```ts
export type OrgTerminology = Record<string, string>;

export type OrgProfile = {
  id: string;
  slug: string;
  name: string;
  industryKey: string;
  enabledModules: OrgModuleId[];
  navPaths?: Partial<Record<string, string>>;
  terminology: OrgTerminology;
  locations: LocationDetailItem[];
  tagline: string;
  brandTitle?: string;
  dashboardVariant?: string;
};
```

Delete `OrgIndustryKey`.

- [ ] **Step 2:** Preset shape (`presets/index.ts`):

```ts
export type OrgProfilePreset = {
  terminologyByLocale: Record<string, OrgTerminology>;
  navPaths?: Partial<Record<string, string>>;
  brandTitleFromOrgName?: boolean;
  dashboardVariant?: string;
};

export const ORG_PROFILE_PRESETS: Record<string, OrgProfilePreset> = {
  generic: GENERIC_PRESET,
  funeral: FUNERAL_PRESET,
};

export function presetFor(industryKey: string): OrgProfilePreset {
  return ORG_PROFILE_PRESETS[industryKey] ?? ORG_PROFILE_PRESETS.generic;
}
```

`generic.ts`/`funeral.ts` carry the en/de/fr terminology tables currently in `terminology.ts`, plus funeral navPaths (`cases: '/funeral/cases'`, `products: '/catalog'`, `orders: '/sales'`), `brandTitleFromOrgName: true`, `dashboardVariant: 'funeral'`.

- [ ] **Step 3:** `terminology.ts`: `getLocalizedTerminology`/`getLocalizedOrgProfile` read `presetFor(profile.industryKey)` instead of `TERMINOLOGY_BY_INDUSTRY`; keep the missing-key dev warnings; localized profile also resolves `brandTitle` (preset flag → `profile.name`) and `dashboardVariant`.
- [ ] **Step 4:** `profiles.ts`: drop `GENERIC_TERMINOLOGY`/`FUNERAL_TERMINOLOGY` exports (presets own them), drop `isFuneralOrg` (no consumers). `createDefaultOrgProfile` merges `presetFor('generic')`.
- [ ] **Step 5:** `MobileTopBar.tsx`: `const brandTitle = profile.brandTitle ?? 'Oktavius ERP';`
- [ ] **Step 6:** `DashboardPage.tsx`: `const stageOrder = CASE_STAGES_BY_VARIANT[profile.dashboardVariant ?? 'generic'] ?? GENERIC_CASE_STAGES;` and subtitle check uses `profile.dashboardVariant === 'funeral'` → replace with: subtitle uses tagline when `profile.tagline` non-empty. No `industryKey` string comparisons left in components: verify `grep -rn "industryKey ===" src/components src/modules` → empty.
- [ ] **Step 7:** Permission leak: in `appNavModules.ts` change `'calendar-v2.view'` → `'calendar.view'`. In `runtime/osiris/permissions.ts` add:

```ts
const PUBLIC_TO_OSIRIS_PERMISSION: Record<string, string> = {
  'calendar.view': 'calendar-v2.view',
  manageOrganization: 'org.manage',
  deleteRecords: 'records.delete',
};

export function toOsirisPermission(permission: string): string {
  return PUBLIC_TO_OSIRIS_PERMISSION[permission] ?? permission;
}
```

Apply `toOsirisPermission` inside `canUseOsirisPermissionRequirement` when checking each required permission. Remove `resolvePublicPermissionRequirement` from `lib/permissions.ts`.

- [ ] **Step 8:** Update affected tests (`terminology.test.ts`, `permissions.test.ts`, `appNavModules.test.ts`, osiris `permissions.test.ts`). Run `pnpm exec tsc --noEmit && pnpm exec vitest run` → PASS.

### Task 5: Move codegen to tools/

**Files:**

- Move: `src/lib/generatedModuleContract.ts`, `generatedModuleContracts.ts`, `generatedModuleFiles.ts` + their `.test.ts` files → `apps/web/tools/module-generator/`

- [ ] **Step 1:** `mkdir tools/module-generator && git mv src/lib/generatedModule* tools/module-generator/`
- [ ] **Step 2:** Fix imports inside moved files: `'./appNavModules'` → `'@/lib/appNavModules'` (alias works in vitest config).
- [ ] **Step 3:** `grep -rn "generatedModule" src/` → must be empty (nothing in src imports tools).
- [ ] **Step 4:** `pnpm exec vitest run tools/ && pnpm exec tsc --noEmit` → PASS (add `tools` to tsconfig include if tsc skips it).

### Task 6: Preference snapshot into Osiris adapter

**Files:**

- Create: `src/runtime/osiris/preferenceSnapshot.ts` (+ move related test cases)
- Modify: `src/app/runtimeProviders.tsx`, `src/app/runtimeProviders.test.ts`

- [ ] **Step 1:** Move `buildUserPreferenceSnapshot`, `isRecord`, `readLocale`, `readTheme`, `readBoolean`, `readStringArray`, `readRecordKey`, `RuntimePreferenceSource` into `runtime/osiris/preferenceSnapshot.ts` with a header comment: multi-shape reading (`ui`/`uiSettings`/`ui_settings`/top-level) is adapter normalization of inconsistent backend payloads; app layer consumes only `UserPreferenceSnapshot`.
- [ ] **Step 2:** `runtimeProviders.tsx` imports `buildUserPreferenceSnapshot` from the new module; move its snapshot-related tests into `runtime/osiris/preferenceSnapshot.test.ts`.
- [ ] **Step 3:** `pnpm exec tsc --noEmit && pnpm exec vitest run src/runtime src/app` → PASS.

### Task 7: Full verification

- [ ] **Step 1:** `pnpm exec tsc --noEmit` → clean
- [ ] **Step 2:** `pnpm exec vitest run` → all pass
- [ ] **Step 3:** `pnpm exec eslint src tools` → clean
- [ ] **Step 4:** `pnpm exec vite build` → succeeds
- [ ] **Step 5:** Final greps: `grep -rn "demo-data\|demo-handlers" src/` empty; `grep -rn "industryKey === 'funeral'" src/` empty; `grep -rn "calendar-v2" src/lib src/app src/components src/modules` empty.
