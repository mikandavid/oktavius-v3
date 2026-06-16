# Members → Settings consolidation

**Date:** 2026-06-16
**Status:** Design approved, ready for planning
**Supersedes the UI of:** `docs/superpowers/specs/2026-06-13-members-module-design.md` (data layer + capabilities unchanged)

## Problem

The current Members module is a standalone top-level nav route (`/members`) that
_internally_ reuses the same section-nav layout Settings uses, rendering four
sections: **Members · Invitations · Invite links · Roles**. This produces a
"settings page living next to the settings page," and four sections for what is
really two jobs (who is in / what they can do) is excessive chrome. osiris_erp
instead keeps member management as a single section under `/settings`.

## Decisions

- **Placement:** fold Members into the existing `/settings` page as two
  **Workspace-group** sections. Matches osiris and the recent Profile→Settings
  consolidation, and removes the nav-inside-nav redundancy.
- **Layout:** consolidate the four old sections into **two**: **People**
  (members + invitations + invite links) and **Roles** (custom roles).
- **Scope:** capabilities are unchanged from the 2026-06-13 build. No per-member
  location-access dialog is added (per-site access + module grants remain the
  deferred later slice). Custom-role permission/module multiselect editors stay
  deferred (sent as `[]`).

## Architecture

### Settings sections

Add two entries to `SettingsPage`'s `settingsSections` array, both
`group: 'Workspace'` and `permission: 'org.members.manage'`:

| id       | label  | renders                    |
| -------- | ------ | -------------------------- |
| `people` | People | `<MembersPeopleSection />` |
| `roles`  | Roles  | `<MembersRolesSection />`  |

`SettingsPageFactory` already filters by an arbitrary `PermissionRequirement`
via `canUsePermissionRequirement`, so the `org.members.manage` gate works with no
factory changes. Section action buttons render inside the section body (the same
pattern the Locations section uses for its "Add location" button) — no
page-header CTA is required or available.

`org.members.manage` will not be in the default permission set for non-admins, so
the two sections simply do not appear for them — same gating behavior as today.

### People section — `MembersPeopleSection`

A single stateful container, single vertical scroll, in this order:

1. **Members table** — existing `MembersSection` (inline role change + remove),
   with an **"Invite member"** button at the top-right of the section.
2. **Pending invitations** — existing `InvitationsSection`.
3. **Invite links** — existing `InviteLinksSection` (its own "Create link" button).

Owns: `useMembers`, `useInvitations`, `useInviteLinks`, `useMembersMutations`;
invite-dialog and create-link-dialog state; the `handleInvite`,
`handleCreateLink`, `handleChangeRole`, `handleRemoveMember`,
`handleRevokeInvitation`, `handleRevokeLink` handlers (lifted verbatim from
`MembersPage`).

### Roles section — `MembersRolesSection`

A stateful container rendering existing `CustomRolesSection` + the add/edit role
dialog (its own "Add role" button).

Owns: `useCustomRoles`, the role-save/delete mutations, role-dialog state, and
`editingRole`; the `handleSaveRole` (permissions/modules still `[]`) and
`handleDeleteRole` handlers (lifted verbatim from `MembersPage`).

### Routing

- Remove the `members` entry from `lib/appNavModules.ts` (no longer a top-level
  nav module).
- Keep `/members` as a redirect to `/settings?section=people`, mirroring the
  existing `/profile` → `/settings?section=account` redirect.
- Delete `modules/members/MembersPage.tsx` and `MembersPage.test.tsx` (the
  `ModulePage` + nested `SettingsPageFactory` wrapper that caused the problem).

### File moves (cross-module import constraint)

`modules/settings/SettingsPage.tsx` cannot import from `modules/members/`
(no-cross-module-imports lint rule). As the Profile→Settings merge did with
`NotificationSettingsSection`, relocate the member UI into `@/components/settings/`:

- `MembersPeopleSection.tsx` (new container) → `@/components/settings/`
- `MembersRolesSection.tsx` (new container) → `@/components/settings/`
- `MembersSection.tsx`, `InvitationsSection.tsx`, `InviteLinksSection.tsx`,
  `CustomRolesSection.tsx`, `shared.tsx`, and the `data/useMembersData.ts` hook
  move under `@/components/settings/` (or a shared subfolder there).
- `runtime/osiris/*` admin clients are shared infrastructure and stay put.

After the move, `modules/members/` contains only the redirect (or is removed
entirely if the redirect lives in the router config).

### Tests

- Move/adapt `MembersSection.test.tsx` to its new location.
- Replace `MembersPage.test.tsx` with `MembersPeopleSection.test.tsx` and
  `MembersRolesSection.test.tsx` (same assertions: invite flow, role change,
  remove, revoke, link create, role create/edit/delete) using the existing
  pre-seeded react-query test harness.
- Add a test that `/members` redirects to `/settings?section=people`.
- Settings page test: People and Roles appear for `org.members.manage` holders
  and are absent otherwise.

## Out of scope

- Per-member location-access / default-location dialog (deferred slice).
- Custom-role permission + allowed-module multiselect editors (still `[]`).
- Any data-layer / API contract changes — the three osiris admin clients are
  reused as-is.
