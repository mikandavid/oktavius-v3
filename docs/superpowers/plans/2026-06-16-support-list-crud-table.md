# Support Issues List → CRUD Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bespoke transparent `IssueList`/`IssueRow`/`IssueFilterBar` with the shared `CrudListShell` (solid card, `FilterToolbar`, sortable columns, clickable rows), unifying the two support views into one `SupportTicketList`.

**Architecture:** A new `SupportTicketList` (admin prop) renders `CrudListShell` inside the existing `SupportPage` `ModulePage` shell — exactly as `MembersSection` embeds `CrudListShell` in a settings page. Columns/filters come from `ticketColumns`/`ticketFilters` factories in `shared.tsx`. The bespoke components and the now-dead `statusGroup` helpers are deleted.

**Tech Stack:** React 19, TypeScript, `@tanstack/react-query`, `@oktavius/base-ui`, `CrudListShell`/`CrudTable`/`FilterToolbar` (`@/components/data/*`), `useListPageState` (nuqs), Vitest. Design system: solid `rounded-card bg-card` (CrudListShell provides it), no borders/shadows, `Combobox` via FilterToolbar, icons from `@/lib/icons`.

**Spec:** `docs/superpowers/specs/2026-06-16-support-list-crud-table-design.md`

---

## Working notes for the implementer

- Test a single file: `pnpm --filter @oktavius/web test <package-relative-path>` (e.g. `src/modules/support/shared.test.ts`). Typecheck: `pnpm --filter @oktavius/web typecheck`. Lint a file: `npx eslint <repo-relative-path>`.
- **Branch `FE` has concurrent agents.** Stage ONLY the files each task names (`git add <paths>`), never `git add -A`. Commit promptly. lint-staged can sweep other agents' staged files into your commit — if that happens, it's a known branch artifact; don't try to rewrite shared history.
- Reference the API shapes:
  - `CrudListShell` props: `apps/web/src/components/data/CrudListShell.tsx` (search/filters/values/onFilterChange/onReset/rows/columns/sort/onSortChange/page.../isLoading/emptyTitle/emptyDescription/onRowClick/enableListCrud/entityLabel).
  - `CrudColumn<T>`: `apps/web/src/components/data/crudTableTypes.ts` (`{ key, header, sortable?, render?, type?, align?, width?, hideBelow? }`).
  - `FilterDef`: exported from `apps/web/src/components/data/FilterToolbar.tsx`. **Read it first** to confirm the exact shape (expected `{ key: string; label: string; options: { value: string; label: string }[] }`) and that there is no per-filter placeholder prop.
  - `StatusBadge`: `apps/web/src/components/feedback/StatusBadge.tsx` — usage `<StatusBadge status={row.status} label={...} variantMap={STATUS_VARIANT} />` (as in `SupportTicketDetail.tsx`).
- `TicketRow` (in `shared.tsx`) extends `SupportTicket` and already carries `requester`, `statusLabel`, `priorityLabel`, `categoryLabel`. The raw fields `status`, `priority`, `category`, `updatedAt`, `subject`, `message` come from `SupportTicket`.

---

## File structure

```
apps/web/src/modules/support/
├── shared.tsx                   MODIFY  + ticketColumns/ticketFilters; (Task 5) remove StatusGroup/statusGroupOf/statusGroup
├── shared.test.ts               MODIFY  + factory tests; (Task 5) drop statusGroup tests
├── SupportTicketList.tsx        CREATE  unified list via CrudListShell
├── SupportTicketList.test.tsx   CREATE
├── SupportPage.tsx              MODIFY  render SupportTicketList
├── SupportPage.test.tsx         MODIFY  drop count/toggle assertions
├── SupportIssuesView.tsx        DELETE (Task 5)
├── SupportRequesterView.tsx     DELETE (Task 5)
├── IssueList.tsx / .test.tsx    DELETE (Task 5)
├── IssueRow.tsx / .test.tsx     DELETE (Task 5)
└── IssueFilterBar.tsx           DELETE (Task 5, + test if present)
packages/i18n/locales/{en,de}/support.json   MODIFY  +colCategory (Task 1); -countOpen/-countClosed (Task 5)
```

---

## Task 1: i18n — add `colCategory`

**Files:**

- Modify: `packages/i18n/locales/en/support.json`
- Modify: `packages/i18n/locales/de/support.json`

- [ ] **Step 1: Add the key to both locales**

In `en/support.json`, add (before the closing `}`, ensure prior line ends with a comma):

```json
  "colCategory": "Category"
```

In `de/support.json`, add:

```json
  "colCategory": "Kategorie"
```

(Do not remove anything in this task. `colSubject`, `colStatus`, `colPriority`, `colUpdated`, `statusLabel_*`, `priorityLabel_*`, `categoryLabel_*` already exist and are reused.)

- [ ] **Step 2: Validate JSON + typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS (both JSON files parse).

- [ ] **Step 3: Commit**

```bash
git add packages/i18n/locales/en/support.json packages/i18n/locales/de/support.json
git commit -m "feat(support): add colCategory i18n string"
```

---

## Task 2: `shared.tsx` — `ticketColumns` + `ticketFilters` factories

**Files:**

- Modify: `apps/web/src/modules/support/shared.tsx`
- Test: `apps/web/src/modules/support/shared.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `shared.test.ts` (it currently tests `statusGroupOf` and `toTicketRow`; keep those for now). Match the file's existing imports/style; render cells with the repo's `createRoot + act` pattern (see `IssueRow.test.tsx` for the harness). Add:

```ts
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ticketColumns, ticketFilters, toTicketRow } from './shared';
import type { SupportTicket } from './data/types';

const t = (key: string) => key; // identity translator for tests

function baseTicket(over: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: 't1',
    orgId: null,
    orgName: null,
    userId: 'u1',
    userEmail: 'ada@x.io',
    userName: 'Ada',
    subject: 'Login broken',
    message: 'help',
    category: 'bug',
    status: 'open',
    priority: 'urgent',
    tags: [],
    source: 'web',
    resolutionMessage: null,
    resolvedAt: null,
    resolvedBy: null,
    assigneeUserId: null,
    assigneeName: null,
    automationStatus: null,
    automationPrUrl: null,
    automationBranchName: null,
    automationWorkflowRunUrl: null,
    automationError: null,
    currentPageUrl: null,
    agentConversationId: null,
    createdAt: '2026-06-16T09:00:00Z',
    updatedAt: '2026-06-16T10:00:00Z',
    ...over,
  };
}

// No JSX in this .ts file: call the column's render() and serialize the result.
function html(node: unknown): string {
  return renderToStaticMarkup(node as ReactElement);
}

describe('ticketFilters', () => {
  it('admin has status/priority/category', () => {
    expect(ticketFilters({ t, admin: true }).map((f) => f.key)).toEqual([
      'status',
      'priority',
      'category',
    ]);
  });
  it('requester has status only', () => {
    expect(ticketFilters({ t, admin: false }).map((f) => f.key)).toEqual(['status']);
  });
});

describe('ticketColumns', () => {
  const isUnread = (r: { id: string }) => r.id === 'unread';
  it('admin includes a priority column', () => {
    const keys = ticketColumns({ t, admin: true, isUnread }).map((c) => c.key);
    expect(keys).toEqual(['subject', 'status', 'priority', 'categoryLabel', 'updatedAt']);
  });
  it('requester omits the priority column', () => {
    const keys = ticketColumns({ t, admin: false, isUnread }).map((c) => c.key);
    expect(keys).toEqual(['subject', 'status', 'categoryLabel', 'updatedAt']);
  });
  it('subject cell shows the unread dot only when unread', () => {
    const cols = ticketColumns({ t, admin: true, isUnread });
    const subject = cols.find((c) => c.key === 'subject')!;
    const unreadRow = toTicketRow(baseTicket({ id: 'unread' }), t);
    const readRow = toTicketRow(baseTicket({ id: 'read' }), t);
    expect(html(subject.render!(unreadRow))).toContain('support.unreadIndicator');
    expect(html(subject.render!(readRow))).not.toContain('support.unreadIndicator');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @oktavius/web test src/modules/support/shared.test.ts`
Expected: FAIL — `ticketColumns`/`ticketFilters` not exported.

- [ ] **Step 3: Implement the factories in `shared.tsx`**

Add these imports at the top of `shared.tsx` (it is a `.tsx` file):

```tsx
import { RelativeTime } from '@oktavius/base-ui';

import type { CrudColumn } from '@/components/data/CrudTable';
import type { FilterDef } from '@/components/data/FilterToolbar';
import { StatusBadge } from '@/components/feedback/StatusBadge';
```

(If `FilterDef` is not exported from `@/components/data/CrudTable`, import it from `@/components/data/FilterToolbar` — confirm by reading that file.)

Append to `shared.tsx`:

```tsx
type TFn = (key: string, vars?: Record<string, unknown>) => string;

export function ticketColumns(opts: {
  t: TFn;
  admin: boolean;
  isUnread: (row: TicketRow) => boolean;
}): CrudColumn<TicketRow>[] {
  const { t, admin, isUnread } = opts;
  const columns: CrudColumn<TicketRow>[] = [
    {
      key: 'subject',
      header: t('support.colSubject'),
      sortable: true,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          {isUnread(row) ? (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-info"
              role="img"
              aria-label={t('support.unreadIndicator')}
            />
          ) : null}
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-foreground">{row.subject}</span>
            {admin ? (
              <span className="truncate text-xs text-muted-foreground">{row.requester}</span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('support.colStatus'),
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={t(`support.statusLabel_${row.status}`)}
          variantMap={STATUS_VARIANT}
        />
      ),
    },
  ];

  if (admin) {
    columns.push({
      key: 'priority',
      header: t('support.colPriority'),
      sortable: true,
      render: (row) => (
        <StatusBadge
          status={row.priority}
          label={t(`support.priorityLabel_${row.priority}`)}
          variantMap={PRIORITY_VARIANT}
        />
      ),
    });
  }

  columns.push(
    { key: 'categoryLabel', header: t('support.colCategory'), sortable: true },
    {
      key: 'updatedAt',
      header: t('support.colUpdated'),
      sortable: true,
      render: (row) => <RelativeTime date={row.updatedAt} />,
    },
  );

  return columns;
}

export function ticketFilters(opts: { t: TFn; admin: boolean }): FilterDef[] {
  const { t, admin } = opts;
  const filters: FilterDef[] = [
    {
      key: 'status',
      label: t('support.colStatus'),
      options: (['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => ({
        value: s,
        label: t(`support.statusLabel_${s}`),
      })),
    },
  ];
  if (admin) {
    filters.push(
      {
        key: 'priority',
        label: t('support.colPriority'),
        options: (['urgent', 'high', 'normal', 'low'] as const).map((p) => ({
          value: p,
          label: t(`support.priorityLabel_${p}`),
        })),
      },
      {
        key: 'category',
        label: t('support.colCategory'),
        options: (['bug', 'feature_request', 'other'] as const).map((c) => ({
          value: c,
          label: t(`support.categoryLabel_${c}`),
        })),
      },
    );
  }
  return filters;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @oktavius/web test src/modules/support/shared.test.ts`
Expected: PASS. Then `pnpm --filter @oktavius/web typecheck` → PASS, and `npx eslint apps/web/src/modules/support/shared.tsx` → clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/shared.tsx apps/web/src/modules/support/shared.test.ts
git commit -m "feat(support): ticketColumns + ticketFilters factories"
```

---

## Task 3: `SupportTicketList` component

**Files:**

- Create: `apps/web/src/modules/support/SupportTicketList.tsx`
- Test: `apps/web/src/modules/support/SupportTicketList.test.tsx`

- [ ] **Step 1: Write a smoke/behavior test**

Create `SupportTicketList.test.tsx`. **First read an existing test that renders `CrudListShell`/`CrudTable`** (e.g. a Members section test, or reuse the harness in `SupportPage.test.tsx`) and copy its provider setup: the `ResizeObserver` polyfill at the top of the file, `MemoryRouter` + `NuqsAdapter` + `QueryClientProvider`, the `@/core/i18n` mock, and a `useOptionalOsirisRuntime` mock (CrudListShell reads `permissionSubject`). Mock the data hooks so the test is deterministic:

```tsx
// ResizeObserver polyfill (copy from SupportPage.test.tsx top-of-file block)
// ...providers + i18n mock + useOptionalOsirisRuntime mock per existing pattern...

vi.mock('./data/useSupportData', () => ({
  useSupportTickets: () => ({
    data: {
      data: [
        {
          id: 't1',
          subject: 'Login broken',
          message: 'help',
          category: 'bug',
          status: 'open',
          priority: 'urgent',
          userEmail: 'ada@x.io',
          userName: 'Ada',
          createdAt: '2026-06-16T09:00:00Z',
          updatedAt: '2026-06-16T10:00:00Z',
          orgId: null,
          orgName: null,
          userId: 'u1',
          tags: [],
          source: 'web',
          resolutionMessage: null,
          resolvedAt: null,
          resolvedBy: null,
          assigneeUserId: null,
          assigneeName: null,
          automationStatus: null,
          automationPrUrl: null,
          automationBranchName: null,
          automationWorkflowRunUrl: null,
          automationError: null,
          currentPageUrl: null,
          agentConversationId: null,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    },
    isLoading: false,
  }),
}));
vi.mock('./data/useSupportUnread', () => ({
  useSupportUnread: () => ({ isUnread: () => false, markSeen: vi.fn() }),
}));

// Test: renders the ticket subject inside the table.
it('renders ticket rows in the table', async () => {
  // render <SupportTicketList admin onOpenTicket={vi.fn()} /> inside the providers
  // await act; then:
  expect(container.textContent).toContain('Login broken');
});
```

If driving an actual grid row click in jsdom proves impractical (lytenyte grid + pointer events), do NOT force it — the deterministic row→`onOpenTicket` contract is `onRowClick={(row) => onOpenTicket(row.id)}` and is trivial; assert what you reliably can (subject text present). Report what you covered.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test src/modules/support/SupportTicketList.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `SupportTicketList.tsx`**

```tsx
import { CrudListShell } from '@/components/data/CrudListShell';
import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { useSupportTickets } from './data/useSupportData';
import { useSupportUnread } from './data/useSupportUnread';
import { ticketColumns, ticketFilters, toTicketRow, type TicketRow } from './shared';

interface SupportTicketListProps {
  admin: boolean;
  onOpenTicket: (id: string) => void;
}

export function SupportTicketList({ admin, onOpenTicket }: SupportTicketListProps) {
  const { t } = useTranslation();
  const { isUnread } = useSupportUnread();

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });
  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  const list = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: admin ? ['status', 'priority', 'category'] : ['status'],
    searchKeys: admin ? ['subject', 'message', 'requester'] : ['subject', 'message'],
    queryNamespace: 'support',
  });

  return (
    <CrudListShell<TicketRow>
      search={list.search}
      onSearchChange={list.onSearchChange}
      searchPlaceholder={t('support.searchPlaceholder')}
      filters={ticketFilters({ t, admin })}
      values={list.values}
      onFilterChange={list.onFilterChange}
      onReset={list.onReset}
      rows={list.paged}
      columns={ticketColumns({ t, admin, isUnread })}
      sort={list.sort}
      onSortChange={list.onSortChange}
      page={list.page}
      pageSize={list.pageSize}
      total={list.total}
      totalPages={list.totalPages}
      onPageChange={list.onPageChange}
      isLoading={isLoading}
      emptyTitle={admin ? t('support.emptyInboxTitle') : t('support.noTickets')}
      emptyDescription={admin ? t('support.emptyInboxDescription') : undefined}
      onRowClick={(row) => onOpenTicket(row.id)}
      enableListCrud={false}
      entityLabel="ticket"
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test src/modules/support/SupportTicketList.test.tsx`
Expected: PASS. Then `pnpm --filter @oktavius/web typecheck` → PASS; `npx eslint apps/web/src/modules/support/SupportTicketList.tsx` → clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/SupportTicketList.tsx apps/web/src/modules/support/SupportTicketList.test.tsx
git commit -m "feat(support): SupportTicketList using CrudListShell"
```

---

## Task 4: Wire `SupportPage` to `SupportTicketList`

**Files:**

- Modify: `apps/web/src/modules/support/SupportPage.tsx`
- Modify: `apps/web/src/modules/support/SupportPage.test.tsx`

- [ ] **Step 1: Update `SupportPage.tsx`**

Replace the imports of the two views:

```tsx
import { SupportIssuesView } from './SupportIssuesView';
import { SupportRequesterView } from './SupportRequesterView';
```

with:

```tsx
import { SupportTicketList } from './SupportTicketList';
```

Replace the body branch (currently `... : isSuperadmin ? (<SupportIssuesView .../>) : (<><SupportRequesterView .../><ReportProblemDialog .../></>)`) with:

```tsx
{
  ticketId ? (
    <SupportTicketDetail ticketId={ticketId} onBack={clearTicketParam} admin={isSuperadmin} />
  ) : isSuperadmin ? (
    <SupportTicketList admin onOpenTicket={openTicket} />
  ) : (
    <>
      <SupportTicketList admin={false} onOpenTicket={openTicket} />
      <ReportProblemDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        onCreated={(ticket) => {
          setReportOpen(false);
          openTicket(ticket.id);
        }}
      />
    </>
  );
}
```

(Keep everything else in `SupportPage.tsx` unchanged — title/subtitle/icon/actions/`openTicket`/`clearTicketParam`.)

- [ ] **Step 2: Update `SupportPage.test.tsx`**

The old tests assert `support.countOpen` is present (the deleted Open/Closed counts). Replace those assertions. In the non-superadmin test, change the count assertion to verify the CRUD list rendered by checking a search input exists, and keep the report-button + no-old-toggle assertions:

```tsx
expect(container.textContent).toContain('support.reportProblem');
expect(container.textContent).not.toContain('support.viewMine');
expect(container.textContent).not.toContain('support.viewInbox');
// CRUD list rendered (FilterToolbar search input present); old counts gone.
expect(container.querySelector('input')).not.toBeNull();
expect(container.textContent).not.toContain('support.countOpen');
```

In the superadmin test, replace the `countOpen` assertion likewise:

```tsx
expect(container.textContent).toContain('support.issuesTitle');
expect(container.querySelector('input')).not.toBeNull();
expect(container.textContent).not.toContain('support.reportProblem');
expect(container.textContent).not.toContain('support.viewInbox');
expect(container.textContent).not.toContain('support.countOpen');
```

- [ ] **Step 3: Run the support suite**

Run: `pnpm --filter @oktavius/web test src/modules/support/SupportPage.test.tsx`
Expected: PASS. Then `pnpm --filter @oktavius/web typecheck` → PASS (note: `SupportIssuesView`/`SupportRequesterView` are now unused but still exist — they're deleted in Task 5; ESLint may warn about unused exports only if imported nowhere, which is fine until Task 5).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/support/SupportPage.tsx apps/web/src/modules/support/SupportPage.test.tsx
git commit -m "feat(support): render SupportTicketList from SupportPage"
```

---

## Task 5: Delete bespoke components, dead helpers, and unused i18n

**Files:**

- Delete: `SupportIssuesView.tsx`, `SupportRequesterView.tsx`, `IssueList.tsx`, `IssueList.test.tsx`, `IssueRow.tsx`, `IssueRow.test.tsx`, `IssueFilterBar.tsx` (+ its test if one exists)
- Modify: `apps/web/src/modules/support/shared.tsx`, `apps/web/src/modules/support/shared.test.ts`
- Modify: `packages/i18n/locales/en/support.json`, `packages/i18n/locales/de/support.json`

- [ ] **Step 1: Confirm nothing references the components or dead helpers**

Run:

```bash
cd /Users/huti/Desktop/Projects/OktaviusV3/oktavius-v3
grep -rn "SupportIssuesView\|SupportRequesterView\|IssueList\|IssueRow\|IssueFilterBar" apps/web/src
grep -rn "statusGroupOf\|StatusGroup\|statusGroup" apps/web/src
grep -rn "countOpen\|countClosed" apps/web/src
```

Expected after Task 4: the component names appear only in their own files; `statusGroup*` appears only in `shared.tsx`/`shared.test.ts` (and the deleted Issue files); `countOpen/countClosed` appears nowhere in `apps/web/src` (only the locale JSON). If any OTHER file references them, stop and report — do not delete.

- [ ] **Step 2: Delete the bespoke files**

```bash
git rm apps/web/src/modules/support/SupportIssuesView.tsx \
       apps/web/src/modules/support/SupportRequesterView.tsx \
       apps/web/src/modules/support/IssueList.tsx \
       apps/web/src/modules/support/IssueList.test.tsx \
       apps/web/src/modules/support/IssueRow.tsx \
       apps/web/src/modules/support/IssueRow.test.tsx \
       apps/web/src/modules/support/IssueFilterBar.tsx
```

(If `IssueFilterBar.test.tsx` exists, add it to the `git rm`.)

- [ ] **Step 3: Remove the dead `statusGroup` helpers from `shared.tsx`**

In `shared.tsx`: delete the `StatusGroup` type, the `statusGroupOf` function, the `statusGroup` field from the `TicketRow` type, and the `statusGroup: statusGroupOf(ticket.status)` line in `toTicketRow`. Leave `requester`/`statusLabel`/`priorityLabel`/`categoryLabel` intact.

- [ ] **Step 4: Update `shared.test.ts`**

Remove the test(s) that exercise `statusGroupOf` / `statusGroup`. Keep the `toTicketRow` requester-fallback test and the new `ticketColumns`/`ticketFilters` tests from Task 2.

- [ ] **Step 5: Remove unused i18n keys**

In both `packages/i18n/locales/en/support.json` and `de/support.json`, remove the `countOpen` and `countClosed` keys (now unreferenced). Do not touch other keys.

- [ ] **Step 6: Verify the whole module + checks**

Run:

```bash
pnpm --filter @oktavius/web test src/modules/support
pnpm --filter @oktavius/web typecheck
npx eslint apps/web/src/modules/support
```

Expected: support suite green (the deleted tests gone; `shared`, `SupportTicketList`, `SupportPage`, `SupportTicketThread`, `TriageControls`, `AutomationPanel`, `SupportTicketDetail` tests all pass), typecheck clean, eslint clean. Confirm grep from Step 1 now returns nothing for the deleted names.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/modules/support packages/i18n/locales/en/support.json packages/i18n/locales/de/support.json
git commit -m "refactor(support): remove bespoke issue list + dead statusGroup/count helpers"
```

---

## Final verification

- [ ] **Run the full support module suite and checks**

Run:

```bash
pnpm --filter @oktavius/web test src/modules/support
pnpm --filter @oktavius/web typecheck
npx eslint apps/web/src/modules/support
```

Expected: all green; the list now renders as a `CrudListShell` (solid `rounded-card bg-card`) with `FilterToolbar` (Status [+Priority+Category for admin]), sortable columns, clickable rows opening the in-page detail, and the unread dot in the subject cell.

- [ ] **Manual smoke (optional):** load `/support` as a non-superadmin (table with Subject/Status/Category/Updated + Status filter + report CTA) and as a superadmin (adds Priority column, requester subtitle, Priority/Category filters, no report CTA); click a row → detail opens; the table sits in a solid card, no transparent rows.

## Notes for the reviewer

- The list is `CrudListShell` (inner shell) inside `SupportPage`'s `ModulePage`, NOT `CrudMainView` (which would double the page shell).
- Badge columns use explicit `render` (variant keyed on raw value, label localized) rather than the `statusColumn` helper — intentional.
- Out of scope: server-side pagination (50-row client cap stays), detail/triage (already shipped).
