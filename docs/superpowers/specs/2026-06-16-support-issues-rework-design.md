# Support module rework — unified issue-list, no view toggle

**Date:** 2026-06-16
**Branch:** FE
**Status:** Approved (design)

## Problem

The support module currently shows superadmins a `mine | inbox` Tabs toggle in the
page actions bar (driven by `?view=inbox`). The toggle is awkward and mixes two
unrelated experiences behind one control. We want:

- The support view to look the same for every non-superadmin user.
- Superadmins to instead land directly on a GitHub-issues-style board — no toggle.

## Decisions (locked with user)

1. **Superadmin scope:** issues board only. No `mine/inbox` toggle, no "Report a
   problem" button for superadmins.
2. **Issues layout:** GitHub Issues style — `Open (n) / Closed (n)` header counts,
   a search box, dropdown filters, and stacked issue rows with status glyph +
   priority/category pills + meta line.
3. **Requester view:** restyled to the same issue-list look (lighter — no admin
   dropdowns). The old status `Tabs` is replaced by the Open/Closed toggle. Keeps
   the "Report a problem" CTA.
4. **Issue number:** no sequential id exists in the data model, so display
   `#<first-6-chars-of-uuid>`.
5. **Open/Closed split:** Open = `open` + `in_progress`; Closed = `resolved` +
   `closed`.

## Architecture

### Orchestration — `SupportPage.tsx`

Remove the Tabs toggle and the `?view=` param. Branch once on `isSuperadmin`
(`useOptionalOsirisRuntime()?.permissionSubject?.isSuperadmin`):

- Superadmin → `SupportIssuesView` (global queue, full filter bar, no report button).
- Else → `SupportRequesterView` (own tickets, lighter bar, keeps report CTA).

Ticket detail pane unchanged. The `admin` flag passed to `SupportTicketDetail`
now equals `isSuperadmin` (triage sidebar shows for superadmins).

### New shared presentation (replaces the CrudListShell table)

- **`IssueRow.tsx`** — one issue: leading status glyph (`◉` for open/in_progress,
  `✓` for resolved/closed), subject as clickable title, meta line
  `#<shortId> · by <requester> · <relative time> · <priority pill> <category pill>`.
- **`IssueList.tsx`** — renders an array of rows, empty state, loading skeleton, and
  bottom Prev/Next pagination wired to `useListPageState`.
- **`IssueFilterBar.tsx`** — header: `Open (n) / Closed (n)` as two clickable text
  toggles (NOT a Tabs component — honors "no tab switch"), a search box, and optional
  dropdown filters (Priority, Category). Props decide which dropdowns render.

Counts: superadmin uses `useSupportStats` (open+inProgress vs resolved+closed);
requester derives counts from the fetched rows.

### Surfaces

- **`SupportIssuesView.tsx`** (renamed from `SupportInboxView.tsx`): full bar —
  Open/Closed toggle + search + Priority dropdown + Category dropdown.
  `useListPageState` with `filterKeys: ['statusGroup','priority','category']`,
  `searchKeys: ['subject','message','requester']`. 50-row server cap retained
  (already documented limitation).
- **`SupportRequesterView.tsx`** (restyled): same `IssueList`, lighter bar —
  Open/Closed toggle + search only. `filterKeys: ['statusGroup']`,
  `searchKeys: ['subject','message']`. Old status `Tabs` removed.

### `shared.tsx`

- Drop `inboxColumns` (table-only, now unused).
- Keep `STATUS_VARIANT`, `PRIORITY_VARIANT`, `toTicketRow`.
- Add `statusGroup: 'open' | 'closed'` to `TicketRow` (and set it in `toTicketRow`)
  so the Open/Closed toggle filters via `useListPageState` equality matching.

### i18n (`en` + `de` `support.json`)

- Remove `viewMine`, `viewInbox`.
- Add: `issuesTitle`, `issuesDescription`, `countOpen`, `countClosed`,
  `filterPriorityAll`, `filterCategoryAll`, and an issue meta template
  `issueMeta` (e.g. `"#{{id}} · by {{name}} · {{time}}"`).

## Testing (TDD)

Rewrite `SupportPage.test.tsx`:

- Superadmin sees the issues board with **no toggle** and **no report button**.
- Non-superadmin sees the requester issue-list **with** report button.
- Open/Closed toggle filters rows.
- Priority/Category dropdowns filter (superadmin only).
- Row click opens the detail pane.

Add a small `IssueRow` render test (glyph, short id, pills, meta).

## File changes

- Edit: `SupportPage.tsx`, `SupportRequesterView.tsx`, `shared.tsx`,
  `SupportPage.test.tsx`, `packages/i18n/locales/{en,de}/support.json`.
- Rename: `SupportInboxView.tsx` → `SupportIssuesView.tsx`.
- Add: `IssueRow.tsx`, `IssueList.tsx`, `IssueFilterBar.tsx` (+ `IssueRow` test).
- Untouched: `SupportTicketDetail.tsx`, `TriageControls.tsx`, data layer,
  `ReportProblemDialog.tsx`.

## Out of scope

- Server-side filtering/pagination (50-row cap stays).
- Assignee/milestone concepts beyond what the data model already has.
- Kanban board layout (explicitly not chosen).
