# Support Module — Design

**Date:** 2026-06-15
**Status:** Approved (design); pending implementation plan
**Module:** `apps/web/src/modules/support`

## Summary

A Support module ported and rethought from osiris. Unlike osiris (one role-morphing
page plus a hidden superadmin console), V3 splits Support into **two clearly separated
surfaces in one module**, plus a superadmin toggle between them:

1. **Requester surface — "My requests"** — every user reports and tracks their own
   tickets.
2. **Admin inbox — "Inbox"** — superadmins triage the whole organization's tickets.

The AI assistant is **not** represented on the page. V3 already renders a persistent,
collapsible AI chat in the right sidebar (`AIChatSidebar`), so the "agent-first"
deflection path is structural — the Support page never duplicates it.

## Decisions (from brainstorming)

- **Two distinct surfaces**, not one role-morphing page.
- **Admin: read real, actions scaffold.** List / view / reply wire to real osiris
  endpoints (they exist). Status / priority / assign / resolve controls render but are
  stubbed ("soon") until backend REST lands.
- **Requester: agent-first, form fallback** — satisfied by the existing right-sidebar
  chat. The Support page is just "my requests" + a quiet "Report a problem".
- **"Report a problem" opens a centered modal dialog** (not a slide-over — a slide-over
  would collide with the right-edge chat sidebar).
- **Admin inbox uses a queue table** (not master-detail) — survives the narrow main
  column when the chat sidebar is open and gives handlers more scannable signal.
- **Two nav entries** provide the superadmin switch: "Support" (Modules → requester
  surface) and "Support Inbox" (Admin). No separate in-header toggle — the nav items
  _are_ the switch (avoids duplicating the same affordance). A superadmin clicking
  "Support" sees the identical requester surface a normal user sees. This still folds
  cleanly into a future app-wide "View as user" mode.

## Out of scope (separate specs)

- App-wide **"View as normal user"** mode (nav hiding, permission gating, preview
  banner). Support's toggle is built so it can later defer to this mode.
- **Admin mutation REST endpoints** in osiris (status / priority / assign / resolve).
  Until they exist, the admin triage controls are non-functional scaffold.

## Surfaces

### 1. Requester surface — "My requests"

- **Shell:** `ModulePage` (`@/components/common/PageLayout`), icon via
  `@/lib/modulePageIcons`.
- **Header action:** a single `variant="cta"` (brand-purple) **"Report a problem"**
  button — the one accent action on the page, per V3 surface aesthetic.
- **Filters:** status `tabs` (`@oktavius/base-ui` — All / Open / In progress / Resolved)
  - search. Reuse `useListPageState` for search/filter/pagination state.
- **List:** borderless tile rows on the tinted wash (V3 aesthetic). Each row: subject,
  category (icon + label), last-updated, and a status pill via `StatusBadge`
  (`@/components/feedback/StatusBadge`) with a support-specific `variantMap`.
- **Empty state:** `EmptyState` (`@/components/common/EmptyState`).
- **Detail** (`/support/:id`): timeline thread (initial request + comments) + a reply
  composer (`textarea` + `file-input` from base-ui) in the main column. Sidebar block
  with ticket metadata (status, category, source, created/updated, attachments via
  `file-input`/download). Reuse `DetailView` / `BackButton` patterns.
- **Report dialog:** `RecordEditDialog` (or `SubEntityFormDialog`) + `EntityForm`
  (`@/components/forms/EntityForm`) + `DialogFormFooter`. Fields: subject, category
  (`select`), message (`textarea`), attachments (`file-input`). On submit → create
  ticket, upload attachments if any, toast (`@/lib/toast`), navigate to the new ticket.

### 2. Admin inbox — "Inbox" (superadmin only)

- **Stats strip:** Open / In progress / Urgent / Avg-response, from
  `GET /support/tickets/stats`. Simple tiles (no new component — plain layout +
  `count-badge` if useful).
- **Queue:** `CrudListShell` + `CrudTable` driven by `useListPageState`, following the
  Members module pattern (`MembersSection.tsx` + `shared.tsx` columns). Columns:
  ticket (subject + category), requester (org · name), priority, status, assignee,
  source (web / agent / email), updated. Filters via the shell: status, priority,
  category, assignee, search. Status/priority render with `StatusBadge`.
- **Detail** (`/support/inbox/:id` or shared detail with admin affordances): same thread
  - reply as requester, **plus** triage controls — status `select`, priority `select`,
    assignee `select`, resolve action — rendered **disabled with a "soon" hint**. Internal
    notes (`is_internal` comments) are part of the reply composer for admins only, also
    scaffold until the backend exposes them.

### Superadmin switch (via nav, no header toggle)

- The switch is **two nav entries**, not an in-header control: "Support" (Modules) and
  "Support Inbox" (Admin). A superadmin sees both; a regular user sees only "Support".
- "Support" always renders the _exact same_ requester surface component (one component,
  reused for both the regular user and a superadmin viewing their own requests).
- No separate segmented toggle in the header — it would duplicate what the nav already
  provides.

## Data layer

Follows the storage module pattern exactly (`modules/storage/data/`):

- **`modules/support/data/supportClient.ts`** — typed client over
  `joinOsirisApiBaseUrl` + `fetch(..., { credentials: 'include' })`, hitting the
  **existing** osiris support routes:
  - `GET /support/tickets` (list — **role-widens to org-wide for superadmins on the
    backend automatically**; the same call serves both surfaces)
  - `GET /support/tickets/:id`
  - `GET /support/tickets/:id/comments`
  - `GET /support/tickets/:id/attachments`
  - `GET /support/tickets/:id/attachments/:nodeId/download`
  - `GET /support/tickets/stats`
  - `POST /support/tickets`
  - `POST /support/tickets/:id/comments`
  - `POST /support/tickets/:id/attachments` (multipart)
- **`modules/support/data/supportKeys.ts`** — react-query keys (mirror `storageKeys.ts`).
- **`modules/support/data/useSupportData.ts`** — react-query hooks (mirror
  `useStorageData.ts`): `useSupportTickets`, `useSupportTicket`, `useSupportTicketComments`,
  `useSupportTicketAttachments`, `useSupportTicketStats`, `useCreateSupportTicket`,
  `useAddSupportTicketComment`, `useUploadSupportTicketAttachments`,
  `useSupportAttachmentDownload`.
- **`modules/support/data/types.ts`** — `SupportTicket`, `SupportTicketComment`,
  `SupportTicketStats` (ported from osiris `useSupport.ts`). Attachments reuse
  `StorageNode` from `modules/storage/data/types`.

**Scaffold mutations** (`updateTicketStatus`, `assignTicket`, `resolveTicket`,
internal-note create) are declared as typed stubs that throw / are disabled in the UI,
with a clear `// TODO: backend REST not yet exposed` marker, so wiring them later is a
drop-in.

## Routing & navigation

Modules are registered in the single manifest `apps/web/src/lib/appNavModules.ts`
(source of both nav and routing).

- Add `'support'` to `OrgModuleId` (`@/lib/org-profiles/types`) and to the relevant
  org-profile module sets.
- **Requester entry:** manifest entry `id: 'support'`, `section: 'modules'`,
  `permission: 'support.view'`, label key `navigation.support`, icon `LifeBuoy`
  (add to `@/lib/icons` if missing).
- **Admin entry:** manifest entry `id: 'support-inbox'`, `section: 'admin'`,
  `superadminOnly: true`, label key `navigation.supportInbox`.
- **Resolved:** two manifest entries (requester under Modules, inbox under Admin),
  sharing the same module components. No in-header toggle.

## i18n

New `support` namespace under `packages/i18n` (follow existing namespace + codegen +
scanner flow). Port osiris `support.*` keys; add keys for the toggle and the "soon"
scaffold hints. No hardcoded strings.

## Components reused (no new primitives)

`ModulePage`, `EmptyState`, `BackButton`, `DetailView`, `RecordEditDialog` /
`SubEntityFormDialog`, `DialogFormFooter`, `EntityForm`, `CrudListShell`, `CrudTable`,
`useListPageState`, `StatusBadge`, `@oktavius/base-ui` (`tabs`, `dialog`, `select`,
`input`, `textarea`, `file-input`, `badge`, `button`, `count-badge`), `@/lib/toast`,
`@/core/i18n`, `@/lib/icons`.

**No new shared components** unless a focused gap appears during implementation (e.g. a
tiny `SupportStatsStrip` local to the module). Triage controls are local module
components, not additions to the shared library.

## Testing

- `supportClient` request shaping (URL/query/method/multipart) — unit, mirror
  `storageClient.test.ts`.
- `useSupportData` hooks with pre-seeded react-query (the established V3 test pattern).
- Requester surface: list renders, status tab filtering, report dialog submit flow
  (create → upload → navigate), empty state.
- Admin queue: renders org-wide rows, filters, triage controls present-but-disabled.
- Superadmin toggle: shown for superadmin, absent for regular user; switches surfaces.

## Open questions for the plan

1. Exact permission key for the admin inbox (`superadminOnly` vs. a `support.manage`
   permission) — confirm against `@/lib/permissions`.
