# V3 Frontend Cleanup — Design

Date: 2026-06-12
Status: approved

## Goal

Remove dead/misleading structures from `apps/web` so the codebase generalizes better and
AI-assisted module work has fewer traps: one module manifest, a trimmed typed-ish API
registry, config-driven org profiles (no funeral hardcoding in components), no demo
runtime, no codegen inside `src/`.

Out of scope (explicit user decisions): i18n sweep (deferred), building business modules,
full Zod schemas per API resource (deferred until real modules exist).

## 1. Delete the demo runtime

The app boots exclusively through the Osiris runtime (`app/runtimeProviders.tsx`). The
demo world is only self-referential. Delete:

- `src/app/demo-data.tsx`
- `src/app/demo-data/` (orgIds, orgProfiles, kunz-seed, records)
- `src/api/demo-handlers/` (entire directory, incl. tests)
- `src/api/demo-client.ts`
- `src/lib/demo/` (`useEnsureDemoOrg.ts`, no consumers)
- `src/app/multiTenantIsolation.test.tsx` (tests demo provider)
- `src/app/demoRuntimeRemoval.test.ts` and `src/app/businessModulesRemoved.test.ts`
  (filesystem-scanning "architecture police" tests; pointless once removal is real)

Keep: component-level fixtures used by production components
(`agentDemoResponses.ts`, `demoLocations.ts`, `demoFuneralCases.ts`,
`demoBusinessContacts.ts`, `demoEntities.ts`, `demoAuditLogs.ts`, `demoDefinitions.ts`,
`demoEntityStorage.ts`, `demoGlobalStorage.ts`, `demoNotificationsRuntime.ts`,
`modules/email/demoData.ts`, `documentPreviewDemoData.ts`).

Fallout: `lib/appNavModules.test.ts` imports `DEMO_ORG_PROFILES` — rewrite with inline
fixture profiles. Any other test importing `@/app/demo-data` gets the same treatment.

## 2. Trim and generalize the API registry

Live consumers use exactly five resources: `orders`, `invoices` (ReportsPage),
`projects` (ProjectPicker), `contacts`, `clients` (ContactPicker).

- `ApiRegistry` becomes derived from a single const resource list:
  `API_RESOURCE_KEYS = ['clients', 'contacts', 'invoices', 'orders', 'projects']`.
  Endpoints derive from the key (`clients` → `/clients`); override map only for
  exceptions. Adding a resource = one line.
- Remove phantom resources (cases, caseChecklists, contracts, incidents, leads,
  organizations, parties, products, purchasing, staff, users, vendors) from
  `contracts.ts`, `apiRegistryConfig.ts`, `httpRegistry.ts`.
- Keep `ApiCrudResourceHandlers<TRecord>` generic; no Zod yet.

## 3. Single module manifest

`APP_NAV_MODULES` (lib/appNavModules.ts) becomes the single source for module routes:

- Each entry gains `loadPage: () => Promise<Record<string, ComponentType>>` +
  `pageExport: string`, plus declarative access:
  `superadminOnly?: boolean` (showcase) and existing `permission`
  (`'org.manage'` for settings).
- `router.tsx` generates module routes by mapping over the manifest (lazy +
  Suspense + ModuleErrorBoundary + ProtectedRoute as today). Auth routes, redirects,
  `access-denied`, `*` stay manual.
- `canAccessAppNavItem` drops its if-chain (showcase/settings/users) and reads the
  declarative fields. The `users` special case dies (no users module).
- Delete the always-true `isOrgModuleId` type guard and its dead call sites.
- Trim `OrgModuleId` to modules that exist:
  `'dashboard' | 'ai-chat' | 'email' | 'calendar' | 'reports' | 'settings' | 'showcase'`.
- `OrgProfile.navPaths` stays but typed `Partial<Record<string, string>>` so industry
  presets can map future module paths without widening a union.

## 4. Config-driven org profiles (de-hardcode funeral)

- `OrgTerminology` → `Record<string, string>`; add `termFor(profile, key, fallback)`
  helper. Existing keys keep working.
- `OrgIndustryKey` union removed → `industryKey: string`. Industry presets live in
  `lib/org-profiles/presets/` as a lookup `Record<string, OrgProfilePreset>` (currently
  one entry: `funeral` with terminology + navPaths). `createDefaultOrgProfile` merges
  preset by key, unknown keys fall back to generic.
- Remove `industryKey === 'funeral'` checks from components:
  - `MobileTopBar`: new optional `OrgProfile.brandTitle`; component renders
    `profile.brandTitle ?? 'Oktavius ERP'`. Funeral preset sets `brandTitle` to org name.
  - `DashboardPage`: `isFuneral` becomes a profile-driven variant field (e.g.
    `dashboardVariant?: string`), set by the funeral preset.
- Permission naming leak: nav uses public names (`'calendar.view'`); the mapping
  public → osiris (`'calendar.view'` → `'calendar-v2.view'`) moves into
  `runtime/osiris/permissions.ts` as a translation table applied in
  `canUseOsirisPermissionRequirement` path. `resolvePublicPermissionRequirement`
  aliases (`manageOrganization`, `deleteRecords`) move into the same table.
- `searchClient.ts` funeral entity mapping stays — it is Osiris backend protocol and
  belongs in the adapter.

## 5. Move codegen out of `src/`

`generatedModuleContract.ts`, `generatedModuleContracts.ts`, `generatedModuleFiles.ts`
plus their 4 test files move to `apps/web/tools/module-generator/`. They are only
self-referential today. Adjust imports (`@/lib/appNavModules` → relative or alias),
keep tests running via vitest include. Nothing in `src/` may import from `tools/`.

## 6. Preference snapshot into the adapter

`buildUserPreferenceSnapshot` and its helpers move from `app/runtimeProviders.tsx` to
`runtime/osiris/preferenceSnapshot.ts`. The multi-shape reading (`ui`, `uiSettings`,
`ui_settings`, top-level) stays — backend format is not verifiable from here — but it is
now documented adapter normalization; the app layer consumes only the canonical
`UserPreferenceSnapshot`.

## Verification

Per phase: `pnpm --filter web tsc --noEmit` (or repo equivalent), `pnpm --filter web test`,
`pnpm --filter web lint`. Existing 12 uncommitted working-tree changes are preserved;
no commits without explicit request.

## Risks

- `appNavModules.test.ts` rewrite must preserve the behavioral assertions (enabled
  modules filtering, terminology labels, path overrides).
- Router generation must keep lazy-loading semantics (chunk per module) — use static
  dynamic-import expressions inside manifest entries so Vite can split chunks.
- Trimming `OrgModuleId` touches `nav-paths.ts` helpers (`casesBasePath` etc.) — check
  consumers; delete helpers if only phantom modules used them.
