# Support Issues List → Standard CRUD Table — Design

**Date:** 2026-06-16
**Scope:** Frontend-only (oktavius-v3 `apps/web`), `apps/web/src/modules/support`
**Status:** Approved for spec review

## Problem

The Support module's ticket list is bespoke and visually inconsistent with the rest of the app:

- **No surface.** `IssueList` renders a bare `flex flex-col` stack of `ListRow variant="queue"` items directly on the page wash — a "transparent" list rather than a card. Every other module's list lives inside a solid `rounded-card bg-card` via `CrudListShell`/`CrudMainView`.
- **Bespoke components.** `IssueRow`, `IssueList`, and `IssueFilterBar` reimplement what the shared CRUD stack already provides. `IssueFilterBar` is a hand-rolled GitHub-style "Open/Closed" text toggle + counts + ad-hoc comboboxes, diverging from the standard `FilterToolbar` (search + 3 filter slots + reset).
- **Missing CRUD affordances.** No sortable headers, no consistent column widths/alignment, no standard density/hover, no column picker.

The fix: render the list through the shared `CrudListShell` (the primitive `MembersSection` uses), kept inside `SupportPage`'s existing `ModulePage` shell, with columns defined in `shared.tsx`.

## Goals

1. The ticket list renders as a standard CRUD table inside a solid card, matching Members/Showcase/etc.
2. Standard `FilterToolbar`: search + Status/Priority/Category dropdowns (admin) or Status only (requester).
3. Sortable columns, standard density, clickable rows that open the existing in-page detail.
4. Preserve the just-shipped unread indicator (moved into the subject cell) and the triage/detail flow.
5. Remove the bespoke components and their now-dead helpers.

## Non-goals

- Server-side pagination (the 50-row client cap stays).
- Any change to the ticket detail, triage controls, or data layer.
- A separate detail route (detail stays in-page via `?ticket=`).

## Decisions (from brainstorming)

- **Status split:** replace the Open/Closed text toggle + counts with a standard `FilterToolbar` "Status" dropdown (All / Open / In Progress / Resolved / Closed). Default view = All.
- **Admin columns:** Subject (+requester subtitle) / Status / Priority / Category / Updated.
- **Unread dot:** kept, rendered as a leading marker inside the Subject cell.
- **Unify views:** one `SupportTicketList` component (`admin` prop) replaces the two near-identical view components.

## Architecture

`SupportPage` keeps ownership of the page shell (`ModulePage` with title/subtitle/icon + the requester-only "Report a problem" CTA, and the conditional `SupportTicketDetail` when `?ticket=` is set). The list itself is rendered through `CrudListShell` — which is the inner shell (FilterToolbar + CrudTable + Pagination) meant to sit inside an existing page shell, exactly as `MembersSection` does inside a settings page. We do **not** use `CrudMainView` here because that owns its own `ModulePage` and would double the shell.

### New component: `SupportTicketList.tsx`

Props: `{ admin: boolean; onOpenTicket: (id: string) => void }`. Responsibilities:

- Fetch tickets: `useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' })`.
- Map to `TicketRow[]` via the existing `toTicketRow(ticket, t)`.
- Unread: `const { isUnread } = useSupportUnread()`.
- Drive state with `useListPageState<TicketRow>`:
  - `defaultSort: 'updatedAt'`
  - `filterKeys: admin ? ['status', 'priority', 'category'] : ['status']`
  - `searchKeys: admin ? ['subject', 'message', 'requester'] : ['subject', 'message']`
  - `queryNamespace: 'support'`
  - no `initialFilters` (default = All statuses)
- Build columns with the `ticketColumns({ t, admin, isUnread })` factory.
- Build filter defs with `ticketFilters({ t, admin })`.
- Render `CrudListShell<TicketRow>`:
  - `search` / `onSearchChange` / `searchPlaceholder`
  - `filters` / `values={list.values}` / `onFilterChange` / `onReset`
  - `rows={list.paged}` / `columns`
  - `sort` / `onSortChange`
  - `page` / `pageSize` / `total` / `totalPages` / `onPageChange`
  - `isLoading`
  - `emptyTitle` / `emptyDescription` (admin: empty-inbox strings; requester: no-tickets strings)
  - `onRowClick={(row) => onOpenTicket(row.id)}`
  - `enableListCrud={false}` (no inline edit/delete; this is a read+navigate list)
  - `entityLabel="ticket"`

### `shared.tsx` additions

A column factory and a filter factory (kept here so the list component stays thin and columns are testable in isolation):

```tsx
export function ticketColumns(opts: {
  t: (key: string, vars?: Record<string, unknown>) => string;
  admin: boolean;
  isUnread: (row: TicketRow) => boolean;
}): CrudColumn<TicketRow>[] {
  /* ... */
}

export function ticketFilters(opts: { t: (key: string) => string; admin: boolean }): FilterDef[] {
  /* ... */
}
```

Columns:

- **Subject** (`key: 'subject'`, sortable, custom `render`): a flex column — leading unread dot (when `isUnread(row)`, the same `bg-info` 6px dot with `aria-label={t('support.unreadIndicator')}`), the subject (`truncate font-medium`), and — admin only — the requester as a `text-xs text-muted-foreground` subtitle.
- **Status** (`key: 'status'`, sortable, explicit `render`): `<StatusBadge status={row.status} label={t(\`support.statusLabel\_${row.status}\`)} variantMap={STATUS_VARIANT} />`. We use an explicit `render`(not the`statusColumn`helper /`type: 'status'`) because the badge variant must key on the raw status value while the visible text must be the localized label — the same pattern already used in `SupportTicketDetail`.
- **Priority** (admin only, `key: 'priority'`, sortable, explicit `render`): `<StatusBadge status={row.priority} label={t(\`support.priorityLabel\_${row.priority}\`)} variantMap={PRIORITY_VARIANT} />`.
- **Category** — text, `categoryLabel_*` (use `row.categoryLabel`, already on `TicketRow`).
- **Updated** (`key: 'updatedAt'`, sortable, `render`): `<RelativeTime date={row.updatedAt} />`.

Requester column set omits Priority and the requester subtitle.

Filters:

- **Status** — options All + `open/in_progress/resolved/closed` (labels `statusLabel_*`), placeholder `filterStatusAll`.
- **Priority** (admin) — `urgent/high/normal/low`, placeholder `filterPriorityAll`.
- **Category** (admin) — `bug/feature_request/other`, placeholder `filterCategoryAll`.

### Removals

- Delete `SupportIssuesView.tsx`, `SupportRequesterView.tsx`, `IssueList.tsx`, `IssueRow.tsx`, `IssueFilterBar.tsx` and their test files (`IssueRow.test.tsx`, `IssueList.test.tsx`, and any IssueFilterBar test).
- `SupportPage.tsx`: replace the `SupportIssuesView`/`SupportRequesterView` branches with `<SupportTicketList admin={isSuperadmin} onOpenTicket={openTicket} />`. Keep the title/subtitle/CTA/detail logic.
- `shared.tsx`: remove `StatusGroup`, `statusGroupOf`, and `statusGroup` from `TicketRow`/`toTicketRow` once nothing references them. (Confirm no other consumer first.)
- Remove `useSupportStats` usage from the list (the hook itself stays; it is no longer needed for counts). Confirm no other consumer of the open/closed counts.

## i18n

- **Add:** `colCategory` ("Category" / "Kategorie"), `filterStatusAll` ("All statuses" / "Alle Status").
- **Reuse:** `colSubject`, `colStatus`, `colPriority`, `colUpdated`, `statusLabel_*`, `priorityLabel_*`, `categoryLabel_*`, `filterPriorityAll`, `filterCategoryAll`, `unreadIndicator`, `noTickets`, `emptyInboxTitle`, `emptyInboxDescription`.
- **Remove if now-unused:** `countOpen`, `countClosed` (verify no remaining references after the toggle is deleted). Leave other keys untouched.

## Error handling

No new error surfaces. `useSupportTickets` failure is handled as today (the query's error state; `CrudListShell` shows loading then the rows or empty state). Row click navigates in-page; no async there.

## Testing

- **`SupportTicketList.test.tsx`** (new), using the module's `createRoot + act` harness with mocked `@/core/i18n` and mocked `./data/useSupportData` + `./data/useSupportUnread`:
  - Renders ticket rows (subject text present) inside the table.
  - Row click fires `onOpenTicket` with the row id.
  - Admin renders Priority and Category columns + 3 filter controls; requester renders the lighter set (no Priority column; Status filter only).
  - Unread dot (by `aria-label`) shows for an unread row and is absent otherwise.
- **`SupportPage.test.tsx`**: update — the Open/Closed toggle assertions are removed; keep the report-button presence/absence and title assertions.
- **Delete** the obsolete `IssueRow.test.tsx` / `IssueList.test.tsx` (and IssueFilterBar test if present).
- Whole support suite green; `pnpm --filter @oktavius/web typecheck` and `eslint` on touched files clean (the table card surface must have no border/shadow; `Combobox` via FilterToolbar; icons from `@/lib/icons`).

## Files touched

```
apps/web/src/modules/support/
├── SupportTicketList.tsx        CREATE  unified list via CrudListShell
├── SupportTicketList.test.tsx   CREATE
├── shared.tsx                   MODIFY  ticketColumns + ticketFilters factories; drop StatusGroup/statusGroupOf
├── SupportPage.tsx              MODIFY  render SupportTicketList; update SupportPage.test.tsx
├── SupportPage.test.tsx         MODIFY  drop toggle assertions
├── SupportIssuesView.tsx        DELETE
├── SupportRequesterView.tsx     DELETE
├── IssueList.tsx                DELETE
├── IssueList.test.tsx           DELETE
├── IssueRow.tsx                 DELETE
├── IssueRow.test.tsx            DELETE
└── IssueFilterBar.tsx           DELETE  (+ test if present)
packages/i18n/locales/en/support.json   MODIFY  +colCategory, +filterStatusAll; -countOpen/-countClosed (if unused)
packages/i18n/locales/de/support.json   MODIFY  same
```

## Concurrency note

Branch `FE` carries simultaneous agent streams; lint-staged can sweep already-staged files from other agents into your commit. Stage only this feature's files explicitly and commit promptly.
