# Members module — design

**Date:** 2026-06-13
**Status:** Approved for planning
**Branch:** FE

## Goal

A standalone **Members** admin module in the V3 frontend to manage org users:
list members, change roles, remove members, invite people (email invites +
shareable links), manage org-specific custom roles, and complete the
invitee-facing acceptance flow at `/invite/:token`. Must follow the V3 UI rules
(`docs/ui-rules/`) and the existing Osiris runtime-adapter pattern.

## Context (current state)

- v3 talks to a real Osiris API at `/v1` (`VITE_OKTAVIUS_API_BASE_URL`) through
  typed fetch clients wired onto `OsirisRuntimeState` in
  `runtime/osiris/AuthProvider.tsx` and consumed via `useOsirisRuntime()`. The
  reference client to mirror is `runtime/osiris/locationAdminClient.ts`.
- The invitee-side auth methods **already exist** on the runtime:
  `resolveInvitationToken`, `acceptInvitation`, `registerInvitation`
  (`runtime/osiris/authClient.ts`). The `/invite/:token` **page** is still a
  placeholder (`modules/auth/AuthPlaceholderPage` → `InvitePage`).
- Presentational stubs already exist: `components/admin/RoleSelector.tsx`
  (Combobox wrapper) and `components/admin/OrgCustomRolesSection.tsx`.
- Building blocks available: `SettingsPageFactory`, `AppSectionNavLayout`,
  `CrudTable`/`CrudMainView`, `SettingsTable` (base-ui), `SubEntityFormDialog`,
  `ConfirmActionDialog`, `StatusBadge`, `EntityAvatar`, `MultiSelect`,
  `useListPageState`, `appToast`.
- The **API contract** is established in `osiris_erp` and mirrored here:
  - Members: `GET /orgs/:orgId/users`, `PUT /orgs/:orgId/users/:userId/role`,
    `DELETE /orgs/:orgId/users/:userId`.
  - Invitations: `GET|POST /invitations/orgs/:orgId/invitations`,
    `DELETE /invitations/orgs/:orgId/invitations/:id`;
    `GET|POST /invitations/orgs/:orgId/links`,
    `DELETE /invitations/orgs/:orgId/links/:id`.
  - Custom roles: CRUD under `/orgs/:orgId/custom-roles`.
  - All admin endpoints are gated by permission `org.members.manage`.

## Decisions (from brainstorming)

- **Placement:** standalone admin nav module (not a Settings section).
- **Scope:** all four areas — members list+roles+remove, email invitations,
  shareable invite links, custom roles management.
- **Invitee flow:** build the real `/invite/:token` accept/register page.
- **Members list rendering:** `CrudTable` (sortable grid, multiselect + row menu).

## Architecture

### 1. Routing & manifest

- Add `'members'` to the `OrgModuleId` union (`lib/org-profiles/types.ts`).
- Add a `members` entry to `APP_NAV_MODULES` (`lib/appNavModules.ts`):
  `section: 'admin'`, `path: '/members'`, `permission: 'org.members.manage'`,
  `icon: MembersIcon`, `labelKey: 'navigation.members'`,
  `loadPage: () => import('@/modules/members/MembersPage')`,
  `pageExport: 'MembersPage'`.
- Add `'members'` to the `enabledModules` of demo org profiles
  (`lib/org-profiles/profiles.ts` / presets) so it appears in nav.
- Add `MembersIcon` to `@/lib/icons` (duotone, size 20 in nav, matching shell).
- The router already builds a protected route from any manifest entry with a
  `permission`; no router change beyond the manifest entry. The invitee page is
  the one exception — see §5.

### 2. Page (`modules/members/MembersPage.tsx`)

`ModulePage` (title "Members", `icon={membersPageIcon()}`,
`layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}`) + `SettingsPageFactory` with
four sections (respects the ≤6 settings-section-nav limit):

1. **Members** — `CrudTable` driven by `useListPageState()`:
   - Columns: Member (`EntityAvatar` + name), Email, Role (`StatusBadge` +
     shared `ROLE_VARIANT` map), Status (`StatusBadge` + `MEMBER_STATUS_VARIANT`),
     Joined (`formatDisplayDate`).
   - Row actions (kebab): **Change role** → dialog with `RoleSelector`
     (standard roles + custom roles); **Remove** → `ConfirmActionDialog`
     (`destructive`). Multiselect bulk remove via standard list CRUD.
2. **Invitations** — `SettingsTable` of pending email invites
   (email · role · invited by · expires · status) with a revoke action;
   `InlineEmptyState` when empty.
3. **Invite links** — `SettingsTable` of links (role · uses `x/max` · expires)
   with create, copy-to-clipboard of the invite URL, and revoke.
4. **Roles** — custom roles `SettingsTable` (name · description · member count)
   with create/edit dialog (name, description, permission `MultiSelect`) + delete.

The `ModulePage` header carries exactly **one** `cta` — **"Invite member"**
(opens the email-invite `SubEntityFormDialog`). This is the page-entry-point
button (the only brand-purple button on the page, per the V3 surface aesthetic).
"Create link" and "Add custom role" are section-level `outline size="sm"`
buttons.

Config (columns, form fields, role/status variant maps, mappers,
`membersPageIcon`) lives in `modules/members/shared.tsx`, not inline in the page.

### 3. Data layer (`runtime/osiris/`)

Three typed fetch clients mirroring `locationAdminClient.ts` (factory function,
snake→camel normalizers, `readErrorMessage`), each with a `*.test.ts`:

- **`membersAdminClient.ts`** — `OsirisOrgMember` type; `listOrgMembers(orgId)`,
  `updateMemberRole(orgId, userId, { role, customRoleId })`,
  `removeMember(orgId, userId)`.
- **`invitationsAdminClient.ts`** — `OsirisInvitation`, `OsirisInviteLink` types;
  `listInvitations`, `createInvitation`, `revokeInvitation`,
  `listInviteLinks`, `createInviteLink`, `revokeInviteLink`. `createInvitation`
  returns `{ invitation, acceptUrl }`; `createInviteLink` returns
  `{ link, inviteUrl }`.
- **`customRolesAdminClient.ts`** — `OsirisCustomRole` type;
  `listCustomRoles`, `createCustomRole`, `updateCustomRole`, `deleteCustomRole`.

### 4. Runtime wiring

- Extend `OsirisRuntimeState` (`runtime/osiris/types.ts`) with the new methods as
  **optional** members (UI feature-detects them, same as `createOrgLocation?`).
- Instantiate the clients at module scope and wire `useCallback` methods in
  `AuthProvider.tsx` exactly like `listOrgLocations` / `createOrgLocation`.
- All methods scope by `requireOrgId(orgId ?? state.activeOrgId)`.

### 5. Invitee acceptance flow (`/invite/:token`)

Replace the placeholder with `modules/auth/InvitePage.tsx` rendered inside
`AuthShell`:

- On mount: `resolveInvitationToken(token)` → resolve org name + role.
- **Authenticated** session → "Accept invitation" button → `acceptInvitation` →
  set active org to the invitation's org → redirect to `/dashboard`.
- **Anonymous** → registration form (`EntityForm`: email prefilled+read-only,
  full name, password) → `registerInvitation` → sign in → redirect.
- Explicit UI states: loading, expired/not-found, already-a-member, generic error.
- Wire the real page into `router.tsx` (swap the `AuthPlaceholderPage` import for
  the new `InvitePage`).

## Data flow

Page/dialog → `useOsirisRuntime()` method → typed client `fetch` (`/v1`) →
normalizer → component state. Mutations re-fetch the affected list (or update
local state) and emit `appToast`. No global cache library; follow the
load-into-`useState` + re-fetch pattern already used in `SettingsPage`.

## Error handling

- Reads: `.catch(appToast.fromApiError)` with empty-state fallback.
- Mutations: `appToast.success` on success; `appToast.fromApiError` on failure.
- Dialog submits that hit server validation wrap with `withFieldErrors(...)` and
  surface `{ fieldErrors, formError }` per the EntityForm contract.
- Feature-detect runtime methods; render read-only / hide actions when a method
  is absent (e.g. demo org without the endpoint).

## Testing

- **Client unit tests** (`*.test.ts`) for each normalizer + error path, mirroring
  `locationAdminClient.test.ts`.
- **`MembersPage` interaction tests**: role change, remove confirm, invite
  dialog submit, section switching.
- **`InvitePage` state tests**: extend/duplicate `AuthInvitePages.test.tsx` —
  loading, authenticated accept, anonymous register, expired/already-member.
- **Gate:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` clean.
  Respect hard bans: `Combobox`/`CrudTable`/`SettingsTable` (no custom `<table>`,
  no `Select`), icons from `@/lib/icons`, `StatusBadge` + `variantMap`,
  `ConfirmActionDialog` (no `window.confirm`), borderless surfaces, single `cta`.

## Out of scope (later slices)

- Per-site / per-location access management and per-user module grants
  (`/orgs/:orgId/users/:userId/sites`, `/modules`) — endpoints exist in osiris
  but are deferred.
- Staff-profile linking (`linkableStaffProfiles`).
- Superadmin cross-org user management.

## File summary

New:

- `runtime/osiris/membersAdminClient.ts` (+ `.test.ts`)
- `runtime/osiris/invitationsAdminClient.ts` (+ `.test.ts`)
- `runtime/osiris/customRolesAdminClient.ts` (+ `.test.ts`)
- `modules/members/MembersPage.tsx`
- `modules/members/shared.tsx`
- `modules/members/MembersPage.test.tsx`
- `modules/auth/InvitePage.tsx`

Changed:

- `runtime/osiris/types.ts` (runtime method types)
- `runtime/osiris/AuthProvider.tsx` (wire methods)
- `lib/appNavModules.ts` (manifest entry)
- `lib/org-profiles/types.ts` (`OrgModuleId`)
- `lib/org-profiles/profiles.ts` / presets (`enabledModules`)
- `lib/icons.ts` (`MembersIcon`)
- `app/router.tsx` (real `InvitePage`)
- i18n namespace files (nav + section + dialog copy)
- `modules/auth/AuthInvitePages.test.tsx` (extend)
