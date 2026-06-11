# V3 Platform Logic Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the next base platform logic from the old Oktavius frontend into V3: workspace settings persistence, location administration, bootstrap/no-org polish, and typed runtime config.

**Architecture:** Keep V3 as the UI/runtime boundary and reuse the existing Oktavius API endpoints. Add small runtime adapters instead of copying old route components. Settings and location screens use existing V3 settings/page primitives, while auth/bootstrap behavior stays centralized in `runtime/osiris`.

**Tech Stack:** React 19, Vite, Vitest, TypeScript, `@oktavius/base-ui`, React context runtime adapters, Oktavius API over `/v1`.

---

### Task 1: Workspace Settings Runtime

**Files:**

- Create: `apps/web/src/runtime/osiris/workspaceSettingsClient.ts`
- Test: `apps/web/src/runtime/osiris/workspaceSettingsClient.test.ts`
- Modify: `apps/web/src/runtime/osiris/types.ts`
- Modify: `apps/web/src/runtime/osiris/AuthProvider.tsx`
- Test: `apps/web/src/runtime/osiris/AuthProvider.test.tsx`

- [ ] **Step 1: Write failing tests** for loading and saving `/orgs/:orgId/settings`.
- [ ] **Step 2: Verify red** with `pnpm --filter @oktavius/web exec vitest run src/runtime/osiris/workspaceSettingsClient.test.ts src/runtime/osiris/AuthProvider.test.tsx`.
- [ ] **Step 3: Implement the minimal client and runtime methods**: `loadWorkspaceSettings` and `updateWorkspaceSettings`.
- [ ] **Step 4: Verify green** with the same Vitest command.

### Task 2: Location Administration Runtime

**Files:**

- Create: `apps/web/src/runtime/osiris/locationAdminClient.ts`
- Test: `apps/web/src/runtime/osiris/locationAdminClient.test.ts`
- Modify: `apps/web/src/runtime/osiris/types.ts`
- Modify: `apps/web/src/runtime/osiris/AuthProvider.tsx`
- Test: `apps/web/src/runtime/osiris/AuthProvider.test.tsx`

- [ ] **Step 1: Write failing tests** for list/create/update/deactivate location calls.
- [ ] **Step 2: Verify red** with `pnpm --filter @oktavius/web exec vitest run src/runtime/osiris/locationAdminClient.test.ts src/runtime/osiris/AuthProvider.test.tsx`.
- [ ] **Step 3: Implement location admin client and runtime methods**.
- [ ] **Step 4: Verify green** with the same Vitest command.

### Task 3: Typed Runtime Config

**Files:**

- Create: `apps/web/src/runtime/osiris/runtimeConfig.ts`
- Test: `apps/web/src/runtime/osiris/runtimeConfig.test.ts`
- Modify: `apps/web/src/runtime/osiris/types.ts`
- Modify: `apps/web/src/runtime/osiris/bootstrap.ts`

- [ ] **Step 1: Write failing tests** for normalizing unknown bootstrap config into a typed runtime config.
- [ ] **Step 2: Verify red** with `pnpm --filter @oktavius/web exec vitest run src/runtime/osiris/runtimeConfig.test.ts src/runtime/osiris/bootstrap.test.ts`.
- [ ] **Step 3: Implement the typed config normalizer** with conservative defaults.
- [ ] **Step 4: Verify green** with the same Vitest command.

### Task 4: Settings UI And Bootstrap Polish

**Files:**

- Modify: `apps/web/src/modules/settings/SettingsPage.tsx`
- Test: `apps/web/src/modules/settings/SettingsPage.test.tsx`
- Modify: `apps/web/src/runtime/osiris/OsirisAccessGate.tsx`
- Test: `apps/web/src/runtime/osiris/OsirisAccessGate.test.tsx`

- [ ] **Step 1: Write failing tests** for backend-backed settings save, location administration actions, and no-org guidance.
- [ ] **Step 2: Verify red** with `pnpm --filter @oktavius/web exec vitest run src/modules/settings/SettingsPage.test.tsx src/runtime/osiris/OsirisAccessGate.test.tsx`.
- [ ] **Step 3: Wire the settings page to runtime methods** and improve the no-org state copy/actions without introducing old product names.
- [ ] **Step 4: Verify green** with the same Vitest command.

### Task 5: Final Verification And Publish

**Files:**

- Commit all V3 repo changes requested by the user.

- [ ] **Step 1: Run focused platform tests** for changed runtime/settings files.
- [ ] **Step 2: Run `pnpm --filter @oktavius/web typecheck`**.
- [ ] **Step 3: Run `pnpm --filter @oktavius/web lint`**.
- [ ] **Step 4: Check branding with `rg "Osiris ERP|OSIRIS ERP" apps/web/src packages/i18n/locales -n`**.
- [ ] **Step 5: Stage, commit, and push branch `FE`**.
