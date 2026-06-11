# ERP UI Replacement Plan — v3 → osiris_erp

## Mission

Build oktavius-v3 frontend to the point that a porting agent can replace every osiris_erp module UI with the generated v3 base. North-star: looks easily adjustable via tokens, performant, zero per-module custom UI — all module pages are assembled from shared base components (`apps/web/src/components/**`, `packages/base-ui/**`).

## Conventions for all sprints

- **Paths**: source file references use `OSIRIS:` for `/Users/huti/Desktop/Projects/OktaviusV3/osiris_erp/apps/web/src/` and `V3:` for `/Users/huti/Desktop/Projects/OktaviusV3/oktavius-v3/apps/web/src/`. Package paths spelled out fully.
- **Runtime decoupling**: backend-coupled work follows the established i18n adapter pattern (`V3:core/i18n/runtime.ts` + `osirisRuntimeAdapter.ts`). Demo runtime = no-op. Osiris runtime = real fetch.
- **i18n**: every new user-facing string lands as `t('namespace.key')` with locale files in `packages/i18n/locales/{de,en}/`. Re-run `pnpm --filter @oktavius/i18n generate:namespaces` after adding namespaces. `pnpm --filter @oktavius/i18n validate` must pass.
- **No new abstractions** unless the task says so. Prefer extending existing shared components.
- **Verification per task**: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web build && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/i18n validate`. Tests where listed.
- **Showcase**: every new pattern gets a section in `V3:modules/showcase/sections/` so the porting agent can copy from a live example.

---

# SPRINT 1 — Safety net + cheap wins

## Task 1.1 — Module error boundaries

**Goal**: prevent module-level crashes from blanking the whole shell. Provide consistent error fallback with retry + Sentry hook point.

**Source**: `OSIRIS:core/modules/ModuleErrorBoundary.tsx` (103 LOC).
**Target**: `V3:core/errors/ModuleErrorBoundary.tsx`.

**Pattern**: **copy + adapt**. Adaptations:

- Replace `@sentry/react` import with a thin wrapper `V3:core/errors/sentry.ts` that exports `captureException(error, context)`. Demo runtime: console.warn. Prod runtime hookpoint: real Sentry.
- Keep the `triggerChunkLoadAutoReload` integration; copy the helper file too: `OSIRIS:core/errors/chunkLoadRecovery.ts` → `V3:core/errors/chunkLoadRecovery.ts`.
- Replace `@/components/ui/button` with `@oktavius/base-ui` Button.
- Add `<SectionErrorBoundary>` sibling: same shape but renders inline fallback (not full page). Used inside detail tabs and approvals/documents panels.

**Steps**:

1. Copy `chunkLoadRecovery.ts` and `ModuleErrorBoundary.tsx` files; rewrite imports.
2. Add `sentry.ts` adapter; default `captureException` to console.warn.
3. Add `SectionErrorBoundary.tsx` next to it.
4. Wrap each route element in `V3:app/router.tsx` with `<ModuleErrorBoundary moduleId={...}>`.
5. Add showcase section `errors-section.tsx` demonstrating both.

**Locale keys** (add to `errors.json`): `moduleCrashTitle`, `moduleCrashBody`, `moduleCrashRetry`, `sectionCrashBody`.

**Acceptance**:

- Force-throw inside any module → boundary catches, shell stays.
- Retry button re-mounts module.
- `captureException` called once per crash.
- Showcase entry exists.

**Estimate**: 3h.

---

## Task 1.2 — Permission-aware columns + row/bulk actions

**Goal**: actually hide columns, row actions, and bulk actions when user lacks permission. Currently `CrudColumn.permission` / `BulkAction.permission` fields exist on `V3:components/data/crudTableTypes.ts:23,34,50` but are not respected by render code.

**Source**: `OSIRIS:components/crud/CrudTable.tsx` lines 92, 561, 635 — `.filter((column) => !column.permission || userPerms.includes(column.permission))`.
**Target**: `V3:components/data/CrudTable.tsx`, `V3:components/data/BulkActionsBar.tsx` (already exists; check `bulkActionVisible` line 189).

**Pattern**: **copy logic, adapt to v3 PermissionSubject**. v3 uses `PermissionRequirement` (string | string[] | 'superadmin' | predicate) from `V3:lib/permissions.ts`, not osiris's string-only `userPerms.includes(...)`. Reuse v3's existing `canAccessAppNavItem` helper as the reference for permission resolution.

**Steps**:

1. Add `V3:lib/permissions.ts` helper `permitted(requirement: PermissionRequirement, subject: PermissionSubject): boolean` if not present. Mirror logic from `canAccessAppNavItem`.
2. In `CrudTable`: obtain `permissionSubject` from `useOptionalOsirisRuntime()` (fall back to demo's `permissionSubjectFor`). Filter `columns`, `rowActions`, `bulkActions` through `permitted(...)`.
3. Apply same filter inside `bulkActionVisible` (extend the existing function — already on line 189).
4. Showcase row in `data-section.tsx`: render a table where 1 col + 1 row action + 1 bulk action are guarded by `permission: 'demo.locked'`, toggle subject in the showcase.

**Acceptance**:

- Showcase toggle hides/shows guarded col + action without re-mount.
- `pnpm test` includes a unit test in `CrudTable.test.tsx` covering each of (column hidden / row action hidden / bulk action hidden) when permission is missing.

**Estimate**: 2h.

---

## Task 1.3 — Org/location switcher verification + tenant isolation

**Goal**: confirm `ActiveLocationContext` works end-to-end and CrudTable queries are scoped to active location/org. No data leak between tenants in demo.

**Source**: `OSIRIS:components/layout/ActiveLocationPicker.tsx`, `HeaderControls.tsx`. Reference only — v3 already has equivalents.
**Target**: `V3:lib/locations/ActiveLocationContext.tsx`, `V3:components/layout/ActiveLocationPicker.tsx`, plus `V3:app/demo-data.tsx`.

**Pattern**: **verify + harden**, no copy.

**Steps**:

1. Audit every demo dataset in `V3:app/demo-data.tsx` for an `orgId` / `siteId` field. Add if missing.
2. Wrap `useDemoData()` so it filters records by `activeOrgId` + `activeSiteId` from `ActiveLocationContext`. Today many demo lists return all rows regardless of context.
3. Add invalidation hook: when `activeOrgId` or `activeSiteId` changes, evict `react-query` cache keys matching that scope. Use a query-key prefix convention `[scope: orgId, siteId, ...rest]`.
4. Add showcase section `multi-tenant-section.tsx` with org switcher + table that visibly changes on switch.
5. Add e2e-style integration test in `V3:app/multiTenantIsolation.test.tsx` that mounts a list, switches org, asserts the rendered rows changed and that no row from the prior org leaks.

**Acceptance**:

- Switching org in account menu changes data in lists without page reload.
- No `useQuery` returns prior-org data after switch.
- Test passes.

**Estimate**: 4h.

---

# SPRINT 2 — The custom-UI killer (highest leverage)

## Task 2.1 — Field type registry

**Goal**: replace the 19-case switch in `V3:components/forms/EntityForm.tsx:283` with a pluggable registry so modules and codegen can add field types without touching `EntityForm`.

**Source**: do NOT copy from osiris — its `EntityFieldInput` (764 LOC switch) is the same anti-pattern. Reference only for behavior parity (date pickers, currency selects, etc.).
**Target**: new package `V3:lib/fields/` with files below.

**Pattern**: **build new**, deliberately replaces existing switch.

**Design**:

```
V3:lib/fields/types.ts
  type FieldRenderer<TValue, TConfig> = (props: {
    value: TValue;
    onChange: (next: TValue) => void;
    error?: string;
    field: FieldConfig & TConfig;
    formValues: Record<string, unknown>;
  }) => ReactNode;

  type FieldDefinition<TValue, TConfig> = {
    id: string;                          // e.g. 'email'
    renderer: FieldRenderer<TValue, TConfig>;
    zod?: (config: FieldConfig & TConfig) => ZodTypeAny;
    normalize?: (input: unknown) => TValue;
    serialize?: (value: TValue) => unknown;
  };

V3:lib/fields/registry.ts
  class FieldRegistry { register(def); get(id); list(); }
  export const fieldRegistry = new FieldRegistry();

V3:lib/fields/builtin/*.ts          // one file per built-in type
V3:lib/fields/index.ts              // registers all built-ins at import time
```

Add to `FieldConfig` (in `EntityForm.tsx`):

```
visibleIf?: (values: Record<string, unknown>) => boolean;
dependsOn?: string[];                  // for memoization
crossValidate?: (values, helpers) => string | null;
```

**Steps**:

1. Create `V3:lib/fields/types.ts`, `registry.ts`, `index.ts`.
2. Move each of the 19 cases out of `EntityForm.tsx` switch into a `builtin/<name>.ts` file. Each exports a `FieldDefinition`. Names must match current `FieldType` union.
3. Replace switch in `EntityForm` with `fieldRegistry.get(field.type)?.renderer({...})`.
4. Move Zod logic out of `V3:lib/buildFormZodSchema.ts` into the per-field `zod()` builders. Keep `buildFormZodSchema` as the orchestrator that asks the registry per field.
5. Add `visibleIf` to `FieldConfig`. In `EntityForm`, skip render + Zod validation when `visibleIf(values) === false`.
6. Add `superRefine` integration for cross-field validation: any field with `crossValidate` attaches a refinement to the form schema.
7. Add `usePreloadNamespaces(['forms'])` to EntityForm if not present.
8. Showcase section: `field-registry-section.tsx` demonstrating (a) all built-in types, (b) a custom type registered at module level (`customRating`), (c) `visibleIf` toggling fields, (d) cross-field validation.

**Acceptance**:

- `EntityForm.tsx` switch block is removed.
- All existing forms (UsersForm if any, showcase entity form) still work without change.
- Showcase custom field type registers + renders.
- Unit tests in `V3:lib/fields/registry.test.ts` cover: register/get/duplicate-id error/list.

**Estimate**: 2d.

---

## Task 2.2 — Repeating / line-item fields

**Goal**: support invoice line items, PO lines, any 1:N inline collection. Generic, no per-module custom UI.

**Source**: `OSIRIS:modules/funeral-cases-v2/components/detail/FuneralCaseV2InlineItemCard.tsx` — reference only; one-off, not generic.
**Target**: new field type `repeating` in the registry from Task 2.1, plus `V3:components/forms/LineItemArray.tsx`.

**Pattern**: **build new**, depends on Task 2.1.

**Design**:

```
type RepeatingFieldConfig = {
  type: 'repeating';
  itemFields: FieldConfig[];           // schema for each row
  minItems?: number;
  maxItems?: number;
  addLabel?: string;
  reorderable?: boolean;
  totals?: (rows: Row[]) => { label: string; value: string }[];   // footer slot
};
```

**Steps**:

1. Add `repeating` field type via the registry pattern.
2. Build `LineItemArray.tsx` component: rows rendered via nested `EntityForm` rows. Add/remove/reorder controls. Drag-handle uses existing icon set. Footer renders `totals(rows)` output.
3. Reuse existing `<InlineEdit>` for cells where appropriate.
4. Zod schema: array of row-shape Zod, with min/max via `z.array().min().max()`.
5. Showcase: invoice-style table with qty/unit-price/total auto-calculated via cross-field + footer totals.

**Acceptance**:

- Showcase invoice form works: add row, edit row, reorder, totals update live, form submits correct shape.
- `pnpm test` includes `LineItemArray.test.tsx` with add/remove/reorder/validation.

**Estimate**: 1.5d.

---

# SPRINT 3 — Polish + composition

## Task 3.1 — Generic settings/catalog blocks

**Goal**: replace single-purpose `CatalogOptionsManager` with generic `CatalogBlockManager<T>` + `SettingsPageFactory`. Module-level settings pages assembled declaratively.

**Source**: do not copy from osiris. Adapt v3's existing `V3:components/settings/CatalogOptionsManager.tsx`.
**Target**:

- `V3:components/settings/CatalogBlockManager.tsx` (generic).
- `V3:components/settings/SettingsPageFactory.tsx`.

**Pattern**: **refactor existing v3 file**.

**Design**:

```
type CatalogBlockManagerProps<T> = {
  rows: T[];
  columns: CrudColumn<T>[];           // reuse CrudColumn from data layer
  onCreate?: (draft: Partial<T>) => Promise<void>;
  onUpdate?: (id: string, patch: Partial<T>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  formFields: FieldConfig[];          // for add/edit dialog
  permission?: PermissionRequirement;
};

type SettingsSection = {
  id: string;
  labelKey: string;
  icon?: ComponentType<IconProps>;
  render: () => ReactNode;
  permission?: PermissionRequirement;
};

<SettingsPageFactory sections={[...]} />
```

**Steps**:

1. Extract generic from current `CatalogOptionsManager`. Keep old file as a thin wrapper that passes payment-term-specific config to the generic for backwards-compat with existing showcase.
2. Build `SettingsPageFactory`: renders a left-rail nav (`AppSectionNavLayout` already exists — use it) of sections, right pane = section's `render()` wrapped in `<SectionErrorBoundary>`.
3. Convert current `V3:modules/settings/SettingsPage.tsx` to call the factory.
4. Showcase section: `settings-section.tsx` with 3 catalog blocks (countries, currencies, payment terms) all driven by the generic.

**Acceptance**:

- Original settings page renders identically.
- New showcase demonstrates assembly of a settings page from data alone.
- Permission filtering hides sections + create/edit buttons.

**Estimate**: 1d.

---

## Task 3.2 — Responsive detail layout

**Goal**: detail pages must collapse from desktop `SplitView` (master list left, detail right) to mobile stacked layout with tabs.

**Source**: `V3:components/data/CrudTableMobileList.tsx` already exists for tables — same pattern, extend to detail layouts.
**Target**: new `V3:components/detail/ResponsiveDetailLayout.tsx`. Existing `V3:components/common/SplitViewQueue.tsx` stays as-is.

**Pattern**: **build new**, no copy.

**Design**:

```
<ResponsiveDetailLayout
  master={<MasterList />}
  detail={<DetailPanel />}
  breakpoint="md"          // below this → stacked + tabs
/>
```

Below breakpoint: render `master` full-width when no item selected; on selection, replace with `detail` and add a back-button header. Above: behave like `SplitViewQueue`.

**Steps**:

1. Build `ResponsiveDetailLayout` using `useMediaQuery` (add tiny hook in `V3:lib/useMediaQuery.ts` if missing — use `matchMedia`).
2. Route state for "which item is selected" stays in URL via `nuqs` (already a dep). Selection param: `?id=...`.
3. Add showcase section `responsive-detail-section.tsx` with a list + detail that visibly reflows at md breakpoint.
4. Convert one existing module's detail page (pick the simplest — `profile` or a showcase entity) as reference impl.

**Acceptance**:

- Resize browser past breakpoint: master + detail collapse to stack and back without losing selection.
- URL `?id=` persists selection on refresh.

**Estimate**: 1d.

---

## Task 3.3 — Global search / command palette upgrade

**Goal**: command palette searches across multiple entity sources (clients, orders, cases, documents...) with a pluggable provider system.

**Source**: `OSIRIS:components/CommandPalette.tsx` (365 LOC). Study the command-registry pattern; do not copy verbatim.
**Target**: existing `V3:components/command/CommandPalette.tsx` (135 LOC) — extend.

**Pattern**: **copy pattern, adapt to v3's smaller surface**.

**Design**:

```
type SearchProvider = {
  id: string;
  label: string;
  search: (query: string, signal: AbortSignal) => Promise<SearchResult[]>;
  permission?: PermissionRequirement;
};

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  href: string;                       // navigate target
  groupId: string;                    // for section headers
};

V3:lib/search/registry.ts
V3:lib/search/SearchRuntime.ts        // adapter for backend
```

**Steps**:

1. Extract `SearchProvider` interface + `searchRegistry`. Built-in providers for: routes (existing), demo `clients`, demo `orders`. Each provider in `V3:lib/search/providers/*.ts`.
2. Add `SearchRuntimeAdapter` slot for prod search API. Demo = local fuzzy match over demo data.
3. CommandPalette UI gets group headers per provider, debounced query (200ms), AbortController for in-flight cancellation.
4. Showcase section: open palette, type, demonstrate multi-source results.

**Acceptance**:

- Palette returns results from 2+ providers without UI jank.
- Aborting query cancels in-flight network calls.
- Permission-blocked providers don't appear.

**Estimate**: 1d.

---

# SPRINT 4 — Backend-blocked adapter shims

Same shape for every item: define a Runtime adapter interface, register `NOOP_<X>_RUNTIME` for demo, build osiris adapter that calls real endpoints (these endpoints likely don't exist yet — leave TODOs).

## Task 4.1 — Saved views runtime

**Source**: v3 already has `V3:components/data/useListSavedViews.tsx` (localStorage). Keep behavior; add adapter.
**Target**: `V3:components/data/savedViewsRuntime.ts` + adapter pattern mirroring i18n.

**Steps**:

1. Define `SavedViewsRuntimeAdapter`: `fetchViews(scope) | persistView | deleteView | shareView`.
2. `useListSavedViews` reads runtime; defaults to localStorage adapter.
3. Osiris adapter at `V3:components/data/osirisSavedViewsAdapter.ts` — TODO body, endpoints undefined.

**Acceptance**: demo still works unchanged. Adapter slot covered by a unit test.

**Estimate**: 2h.

---

## Task 4.2 — Notifications runtime

**Target**: `V3:components/layout/NotificationsRuntime.ts`.

**Steps**:

1. Adapter: `subscribe(onEvent) => unsubscribe`, `fetchUnreadCount`, `markRead(id)`, `markAllRead`.
2. Default demo adapter: emits 3 seeded notifications.
3. Wire `NotificationPanel` to consume adapter.

**Acceptance**: panel unread badge updates from adapter events. Showcase demonstrates.

**Estimate**: 2h.

---

# SPRINT 5 — Form server-error mapping (small, do alongside Sprint 2)

**Goal**: server-side validation errors map cleanly to field-level errors.

**Source**: helper exists at `V3:lib/formValidation.ts:normalizeFormSubmissionFailure`. Used by `EntityForm.tsx:869,876` but pattern not documented.
**Target**: doc + tiny wrapper.

**Steps**:

1. Document the contract: server returns `{ fieldErrors: { 'path.to.field': 'message' }, formError?: 'top-level' }`.
2. Add `withFieldErrors(submitFn)` wrapper in `V3:lib/formValidation.ts` that catches errors and rethrows in normalized shape.
3. Update showcase form section with a "simulate server error" toggle showing field-level errors lit up.

**Acceptance**: showcase demonstrates field-level errors from a simulated server failure.

**Estimate**: 3h.

---

# SPRINT 6 — Calendar sync (DEFER until calendar module port)

**Goal**: full Google/Outlook OAuth + sync. Heavy. Do not start until calendar module is being ported.

**Source files to copy when ready** (all under `OSIRIS:modules/calendar-v2/shell/`):

- `hooks/useCalendarSync.ts`
- `components/CalendarSyncSettingsPanel.tsx`
- `calendarSyncCategory.ts`
- `OSIRIS:modules/calendar-v2/components/CalendarV2SyncActivityPanel.tsx`

**Pattern**: copy whole stack, route backend calls through a new `CalendarSyncRuntimeAdapter`.

**Estimate**: 3d when calendar module ports.

---

# Closing checklist (run after every task)

```bash
pnpm --filter @oktavius/web typecheck
pnpm --filter @oktavius/web lint
pnpm --filter @oktavius/web build
pnpm --filter @oktavius/web test
pnpm --filter @oktavius/i18n validate
pnpm --filter @oktavius/i18n test
pnpm --filter @oktavius/i18n scan:missing
```

All must pass before marking a task complete. Each task that adds locale keys must also re-run `pnpm --filter @oktavius/i18n generate:namespaces` if it added a new namespace JSON.

# Final acceptance for the whole plan

Porting agent can take any osiris module and replace its UI by:

1. Declaring its `FieldConfig[]` for forms.
2. Declaring its `CrudColumn[]` + `BulkAction[]` + `RowAction[]` for lists.
3. Declaring its settings sections via `SettingsPageFactory`.
4. Wiring its data via `react-query` + runtime adapter.
5. Adding locale keys.

Zero custom UI per module. Looks adjusted globally via `V3:styles/globals.css` tokens.
