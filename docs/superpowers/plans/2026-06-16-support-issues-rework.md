# Support Issue-List Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the superadmin `mine | inbox` Tabs toggle with a unified GitHub-issues-style list: every non-superadmin sees a restyled requester view; superadmins land directly on a global issues board.

**Architecture:** Both surfaces render the same `IssueList` presentation (built on base-ui `ListRow`), driven by the existing `useListPageState` engine (search/filter/sort/pagination, client-side). `SupportPage` branches once on `isSuperadmin`. The old `CrudListShell` table and status `Tabs` are removed from both views.

**Tech Stack:** React 19, TypeScript, react-router v7, @tanstack/react-query, nuqs, base-ui (`ListRow`, `RelativeTime`, `InlineEmptyState`, `StatusDot`, `Combobox`, `Input`), vitest + jsdom.

**Branch:** FE (shared with concurrent agents — stage only your own files, commit fast).

---

## File Structure

- `apps/web/src/modules/support/shared.tsx` — variants + `toTicketRow`; **add** `statusGroup`, **remove** `inboxColumns`.
- `apps/web/src/modules/support/IssueRow.tsx` — **new**; one issue row (wraps `ListRow`).
- `apps/web/src/modules/support/IssueList.tsx` — **new**; rows + empty state + pagination.
- `apps/web/src/modules/support/IssueFilterBar.tsx` — **new**; Open/Closed toggle + search + optional dropdowns.
- `apps/web/src/modules/support/SupportIssuesView.tsx` — **renamed** from `SupportInboxView.tsx`; superadmin board.
- `apps/web/src/modules/support/SupportRequesterView.tsx` — **modify**; restyle to `IssueList`, drop status `Tabs`.
- `apps/web/src/modules/support/SupportPage.tsx` — **modify**; drop toggle + `?view=`, branch on `isSuperadmin`.
- `apps/web/src/modules/support/SupportPage.test.tsx` — **modify**; rewrite expectations.
- `apps/web/src/modules/support/IssueRow.test.tsx` — **new**; row render test.
- `packages/i18n/locales/en/support.json`, `packages/i18n/locales/de/support.json` — **modify**; add/remove keys.

Test runner from `apps/web`: `pnpm vitest run <path>` (repo uses pnpm + vitest).

---

## Task 1: Add `statusGroup` to the row model, remove table columns

**Files:**

- Modify: `apps/web/src/modules/support/shared.tsx`
- Modify: `apps/web/src/modules/support/data/types.ts` (no change needed — read only)

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/support/shared.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import type { SupportTicket } from './data/types';
import { toTicketRow } from './shared';

const t = (k: string) => k;

const base: SupportTicket = {
  id: 'abc123def456',
  orgId: 'o1',
  orgName: 'Org',
  userId: 'u1',
  userEmail: 'a@b.c',
  userName: 'Anna',
  subject: 'Login broken',
  message: 'It fails',
  category: 'bug',
  status: 'open',
  priority: 'urgent',
  tags: [],
  source: 'web',
  resolutionMessage: null,
  resolvedAt: null,
  resolvedBy: null,
  currentPageUrl: null,
  agentConversationId: null,
  createdAt: '2026-06-16T00:00:00Z',
  updatedAt: '2026-06-16T00:00:00Z',
};

describe('toTicketRow statusGroup', () => {
  it('maps open and in_progress to "open"', () => {
    expect(toTicketRow({ ...base, status: 'open' }, t).statusGroup).toBe('open');
    expect(toTicketRow({ ...base, status: 'in_progress' }, t).statusGroup).toBe('open');
  });
  it('maps resolved and closed to "closed"', () => {
    expect(toTicketRow({ ...base, status: 'resolved' }, t).statusGroup).toBe('closed');
    expect(toTicketRow({ ...base, status: 'closed' }, t).statusGroup).toBe('closed');
  });
  it('uses requester name fallback to email', () => {
    expect(toTicketRow({ ...base, userName: null }, t).requester).toBe('a@b.c');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/modules/support/shared.test.ts`
Expected: FAIL — `statusGroup` is `undefined`.

- [ ] **Step 3: Edit `shared.tsx`**

Remove the `inboxColumns` function and its now-unused imports (`statusColumn`, `CrudColumn`). Add `statusGroup` to the row type and compute it. Final file:

```tsx
import type { BadgeProps } from '@oktavius/base-ui';

import type { SupportStatus, SupportTicket } from './data/types';

export const STATUS_VARIANT: Record<string, BadgeProps['variant']> = {
  open: 'info',
  in_progress: 'secondary',
  resolved: 'success',
  closed: 'outline',
};

export const PRIORITY_VARIANT: Record<string, BadgeProps['variant']> = {
  urgent: 'destructive',
  high: 'warning',
  normal: 'secondary',
  low: 'outline',
};

export type StatusGroup = 'open' | 'closed';

export function statusGroupOf(status: SupportStatus): StatusGroup {
  return status === 'open' || status === 'in_progress' ? 'open' : 'closed';
}

/** Row shape consumed by useListPageState (requires `id`). */
export type TicketRow = SupportTicket & {
  requester: string;
  statusLabel: string;
  priorityLabel: string;
  categoryLabel: string;
  statusGroup: StatusGroup;
};

export function toTicketRow(ticket: SupportTicket, t: (key: string) => string): TicketRow {
  return {
    ...ticket,
    requester: ticket.userName ?? ticket.userEmail,
    statusLabel: t(`support.statusLabel_${ticket.status}`),
    priorityLabel: t(`support.priorityLabel_${ticket.priority}`),
    categoryLabel: t(`support.categoryLabel_${ticket.category}`),
    statusGroup: statusGroupOf(ticket.status),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/modules/support/shared.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/shared.tsx apps/web/src/modules/support/shared.test.ts
git commit -m "refactor(support): add statusGroup to row model, drop table columns"
```

---

## Task 2: `IssueRow` component

**Files:**

- Create: `apps/web/src/modules/support/IssueRow.tsx`
- Test: `apps/web/src/modules/support/IssueRow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { TicketRow } from './shared';
import { IssueRow } from './IssueRow';

const row: TicketRow = {
  id: 'abc123def456',
  orgId: 'o1',
  orgName: 'Org',
  userId: 'u1',
  userEmail: 'a@b.c',
  userName: 'Anna',
  subject: 'Login broken',
  message: 'fails',
  category: 'bug',
  status: 'open',
  priority: 'urgent',
  tags: [],
  source: 'web',
  resolutionMessage: null,
  resolvedAt: null,
  resolvedBy: null,
  currentPageUrl: null,
  agentConversationId: null,
  createdAt: '2026-06-16T00:00:00Z',
  updatedAt: '2026-06-16T00:00:00Z',
  requester: 'Anna',
  statusLabel: 'Open',
  priorityLabel: 'Urgent',
  categoryLabel: 'Bug',
  statusGroup: 'open',
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
});

describe('IssueRow', () => {
  it('renders subject, short id, requester and pills, and fires onClick', () => {
    let clicked = '';
    act(() => {
      root.render(<IssueRow row={row} onClick={(id) => (clicked = id)} />);
    });
    expect(container.textContent).toContain('Login broken');
    expect(container.textContent).toContain('#abc123'); // first 6 of uuid
    expect(container.textContent).toContain('Anna');
    expect(container.textContent).toContain('Urgent');
    expect(container.textContent).toContain('Bug');

    const clickable = container.querySelector('[role="button"], button') as HTMLElement;
    act(() => clickable.click());
    expect(clicked).toBe('abc123def456');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/modules/support/IssueRow.test.tsx`
Expected: FAIL — cannot find module `./IssueRow`.

- [ ] **Step 3: Create `IssueRow.tsx`**

```tsx
// IssueRow — one ticket rendered GitHub-issue style. Thin wrapper over base-ui ListRow.
import { Badge, ListRow, RelativeTime, StatusDot } from '@oktavius/base-ui';

import { SuccessIcon } from '@/lib/icons';

import { PRIORITY_VARIANT, type TicketRow } from './shared';

interface IssueRowProps {
  row: TicketRow;
  onClick: (id: string) => void;
}

export function IssueRow({ row, onClick }: IssueRowProps) {
  const shortId = row.id.slice(0, 6);
  const isClosed = row.statusGroup === 'closed';

  const leading = isClosed ? (
    <SuccessIcon size={18} weight="fill" className="text-success" aria-hidden />
  ) : (
    <StatusDot tone="info" size="md" />
  );

  const meta = (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="tabular-nums">#{shortId}</span>
      <span aria-hidden>·</span>
      <span>{row.requester}</span>
      <span aria-hidden>·</span>
      <RelativeTime date={row.updatedAt} />
    </span>
  );

  const trailing = (
    <span className="flex shrink-0 items-center gap-1.5">
      <Badge variant={PRIORITY_VARIANT[row.priority] ?? 'secondary'}>{row.priorityLabel}</Badge>
      <Badge variant="outline">{row.categoryLabel}</Badge>
    </span>
  );

  return (
    <ListRow
      variant="queue"
      leading={leading}
      title={row.subject}
      meta={meta}
      trailing={trailing}
      onClick={() => onClick(row.id)}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/modules/support/IssueRow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/IssueRow.tsx apps/web/src/modules/support/IssueRow.test.tsx
git commit -m "feat(support): add GitHub-issue-style IssueRow"
```

---

## Task 3: `IssueList` component

**Files:**

- Create: `apps/web/src/modules/support/IssueList.tsx`

No standalone test — exercised via `SupportPage.test.tsx` in Task 6.

- [ ] **Step 1: Create `IssueList.tsx`**

```tsx
// IssueList — renders issue rows with empty state + pagination. Presentation only;
// the caller owns data + useListPageState wiring.
import { InlineEmptyState } from '@oktavius/base-ui';

import { Pagination } from '@/components/data/Pagination';

import { IssueRow } from './IssueRow';
import type { TicketRow } from './shared';

interface IssueListProps {
  rows: TicketRow[];
  isLoading: boolean;
  emptyText: string;
  onOpenTicket: (id: string) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function IssueList({
  rows,
  isLoading,
  emptyText,
  onOpenTicket,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: IssueListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-px">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-control bg-muted/40" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <InlineEmptyState text={emptyText} centered />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        {rows.map((row) => (
          <IssueRow key={row.id} row={row} onClick={onOpenTicket} />
        ))}
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm vitest run src/modules/support/IssueRow.test.tsx` (imports compile-check the chain)
Expected: PASS (no new failures).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/IssueList.tsx
git commit -m "feat(support): add IssueList with empty state and pagination"
```

---

## Task 4: `IssueFilterBar` component

**Files:**

- Create: `apps/web/src/modules/support/IssueFilterBar.tsx`

GitHub-style header. The Open/Closed counts are two clickable text toggles (NOT a Tabs component). Dropdowns are optional via props so the requester surface can hide them.

- [ ] **Step 1: Create `IssueFilterBar.tsx`**

```tsx
// IssueFilterBar — GitHub-issues header: Open/Closed toggle + search + optional dropdowns.
// Deliberately NOT a Tabs component; the Open/Closed split is rendered as text toggles.
import { Combobox, Input } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CheckIcon, SearchIcon, StatusDot } from '@/lib/icons';
import { cn } from '@/lib/utils';

import { StatusDot as Dot } from '@oktavius/base-ui';
import type { StatusGroup } from './shared';

interface FilterOption {
  value: string;
  label: string;
}

interface IssueFilterBarProps {
  openCount: number;
  closedCount: number;
  statusGroup: StatusGroup;
  onStatusGroupChange: (g: StatusGroup) => void;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  /** Optional admin dropdowns. Omit to hide (requester surface). */
  priority?: { value: string; onChange: (v: string) => void; options: FilterOption[] };
  category?: { value: string; onChange: (v: string) => void; options: FilterOption[] };
}

export function IssueFilterBar({
  openCount,
  closedCount,
  statusGroup,
  onStatusGroupChange,
  search,
  onSearchChange,
  searchPlaceholder,
  priority,
  category,
}: IssueFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 rounded-card bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => onStatusGroupChange('open')}
            className={cn(
              'flex items-center gap-1.5 font-medium',
              statusGroup === 'open' ? 'text-foreground' : 'text-muted-foreground',
            )}
            aria-pressed={statusGroup === 'open'}
          >
            <Dot tone="info" size="sm" />
            {t('support.countOpen', { count: openCount })}
          </button>
          <button
            type="button"
            onClick={() => onStatusGroupChange('closed')}
            className={cn(
              'flex items-center gap-1.5 font-medium',
              statusGroup === 'closed' ? 'text-foreground' : 'text-muted-foreground',
            )}
            aria-pressed={statusGroup === 'closed'}
          >
            <CheckIcon size={14} weight="bold" />
            {t('support.countClosed', { count: closedCount })}
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <SearchIcon
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      </div>

      {(priority || category) && (
        <div className="flex flex-wrap items-center gap-2">
          {priority && (
            <div className="w-40">
              <Combobox
                options={priority.options}
                value={priority.value || undefined}
                onChange={(v) => priority.onChange(v ?? '')}
                placeholder={t('support.filterPriorityAll')}
              />
            </div>
          )}
          {category && (
            <div className="w-40">
              <Combobox
                options={category.options}
                value={category.value || undefined}
                onChange={(v) => category.onChange(v ?? '')}
                placeholder={t('support.filterCategoryAll')}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

NOTE: remove the stray duplicate import. The file must import `StatusDot` ONCE. Use this corrected import block at the top (replace the two import lines above):

```tsx
import { Combobox, Input, StatusDot as Dot } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CheckIcon, SearchIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

import type { StatusGroup } from './shared';
```

- [ ] **Step 2: Typecheck via build of consumers later.** For now verify no syntax error:

Run: `pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | grep IssueFilterBar || echo "no IssueFilterBar errors"`
Expected: `no IssueFilterBar errors`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/IssueFilterBar.tsx
git commit -m "feat(support): add IssueFilterBar (open/closed toggle + filters)"
```

---

## Task 5: Restyle `SupportRequesterView` + create `SupportIssuesView`

**Files:**

- Modify: `apps/web/src/modules/support/SupportRequesterView.tsx`
- Create: `apps/web/src/modules/support/SupportIssuesView.tsx` (git mv from `SupportInboxView.tsx`)
- Delete: `apps/web/src/modules/support/SupportInboxView.tsx`

- [ ] **Step 1: Rewrite `SupportRequesterView.tsx`**

```tsx
// SupportRequesterView — the standard support surface every non-superadmin sees.
// Lighter issue list: Open/Closed toggle + search only. No admin dropdowns.
// ReportProblemDialog state lives in SupportPage (CTA sits in ModulePage actions).
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';
import type { StatusGroup, TicketRow } from './shared';
import { toTicketRow } from './shared';
import { useSupportTickets } from './data/useSupportData';

interface SupportRequesterViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportRequesterView({ onOpenTicket }: SupportRequesterViewProps) {
  const { t } = useTranslation();
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('open');

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));
  const openCount = rows.filter((r) => r.statusGroup === 'open').length;
  const closedCount = rows.filter((r) => r.statusGroup === 'closed').length;

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: ['statusGroup'],
    initialFilters: { statusGroup: 'open' },
    searchKeys: ['subject', 'message'],
    queryNamespace: 'support',
  });

  // Keep the toggle and the list-state filter in sync.
  function handleStatusGroupChange(g: StatusGroup) {
    setStatusGroup(g);
    listState.onFilterChange('statusGroup', g);
  }

  return (
    <div className="flex flex-col gap-4">
      <IssueFilterBar
        openCount={openCount}
        closedCount={closedCount}
        statusGroup={statusGroup}
        onStatusGroupChange={handleStatusGroupChange}
        search={listState.search}
        onSearchChange={listState.onSearchChange}
        searchPlaceholder={t('support.searchPlaceholder')}
      />
      <IssueList
        rows={listState.paged}
        isLoading={isLoading}
        emptyText={t('support.noTickets')}
        onOpenTicket={onOpenTicket}
        page={listState.page}
        pageSize={listState.pageSize}
        total={listState.total}
        totalPages={listState.totalPages}
        onPageChange={listState.onPageChange}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create `SupportIssuesView.tsx` (git mv first)**

```bash
git mv apps/web/src/modules/support/SupportInboxView.tsx apps/web/src/modules/support/SupportIssuesView.tsx
```

Then replace its contents:

```tsx
// SupportIssuesView — superadmin global issues board. Full filter bar:
// Open/Closed toggle + search + Priority + Category dropdowns.
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { useListPageState } from '@/lib/useListPageState';

import { IssueFilterBar } from './IssueFilterBar';
import { IssueList } from './IssueList';
import type { StatusGroup, TicketRow } from './shared';
import { toTicketRow } from './shared';
import { useSupportStats, useSupportTickets } from './data/useSupportData';

const PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
const CATEGORIES = ['bug', 'feature_request', 'other'] as const;

interface SupportIssuesViewProps {
  onOpenTicket: (id: string) => void;
}

export function SupportIssuesView({ onOpenTicket }: SupportIssuesViewProps) {
  const { t } = useTranslation();
  const [statusGroup, setStatusGroup] = useState<StatusGroup>('open');

  // 50-row server cap retained (documented v1 limitation). Filtering is client-side.
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });
  const { data: stats } = useSupportStats(true);

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));

  // Prefer server stats for the counts; fall back to fetched-page counts.
  const openCount = stats
    ? stats.open + stats.inProgress
    : rows.filter((r) => r.statusGroup === 'open').length;
  const closedCount = stats
    ? stats.resolved + stats.closed
    : rows.filter((r) => r.statusGroup === 'closed').length;

  const listState = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: ['statusGroup', 'priority', 'category'],
    initialFilters: { statusGroup: 'open' },
    searchKeys: ['subject', 'message', 'requester'],
    queryNamespace: 'support',
  });

  function handleStatusGroupChange(g: StatusGroup) {
    setStatusGroup(g);
    listState.onFilterChange('statusGroup', g);
  }

  return (
    <div className="flex flex-col gap-4">
      <IssueFilterBar
        openCount={openCount}
        closedCount={closedCount}
        statusGroup={statusGroup}
        onStatusGroupChange={handleStatusGroupChange}
        search={listState.search}
        onSearchChange={listState.onSearchChange}
        searchPlaceholder={t('support.searchPlaceholder')}
        priority={{
          value: listState.filters.priority ?? '',
          onChange: (v) => listState.onFilterChange('priority', v),
          options: PRIORITIES.map((p) => ({ value: p, label: t(`support.priorityLabel_${p}`) })),
        }}
        category={{
          value: listState.filters.category ?? '',
          onChange: (v) => listState.onFilterChange('category', v),
          options: CATEGORIES.map((c) => ({ value: c, label: t(`support.categoryLabel_${c}`) })),
        }}
      />
      <IssueList
        rows={listState.paged}
        isLoading={isLoading}
        emptyText={t('support.emptyInboxTitle')}
        onOpenTicket={onOpenTicket}
        page={listState.page}
        pageSize={listState.pageSize}
        total={listState.total}
        totalPages={listState.totalPages}
        onPageChange={listState.onPageChange}
      />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | grep -E "SupportRequesterView|SupportIssuesView|SupportInboxView" || echo "clean"`
Expected: `clean`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/support/SupportRequesterView.tsx apps/web/src/modules/support/SupportIssuesView.tsx
git commit -m "feat(support): issue-list requester view + superadmin issues board"
```

---

## Task 6: Rewire `SupportPage` (drop toggle) + i18n keys + tests

**Files:**

- Modify: `apps/web/src/modules/support/SupportPage.tsx`
- Modify: `packages/i18n/locales/en/support.json`, `packages/i18n/locales/de/support.json`
- Modify: `apps/web/src/modules/support/SupportPage.test.tsx`

- [ ] **Step 1: Add/remove i18n keys (en)**

In `packages/i18n/locales/en/support.json`: delete `"viewMine"` and `"viewInbox"` lines. Add:

```json
  "issuesTitle": "Issues",
  "issuesDescription": "Triage and respond to tickets across the organization.",
  "countOpen": "{{count}} Open",
  "countClosed": "{{count}} Closed",
  "filterPriorityAll": "All priorities",
  "filterCategoryAll": "All categories"
```

- [ ] **Step 2: Add/remove i18n keys (de)**

In `packages/i18n/locales/de/support.json`: delete `"viewMine"`/`"viewInbox"` if present. Add:

```json
  "issuesTitle": "Tickets",
  "issuesDescription": "Tickets der gesamten Organisation sichten und beantworten.",
  "countOpen": "{{count}} Offen",
  "countClosed": "{{count}} Geschlossen",
  "filterPriorityAll": "Alle Prioritäten",
  "filterCategoryAll": "Alle Kategorien"
```

(If `de/support.json` lacks any required key like `searchPlaceholder`/`noTickets`, add a German value — verify with `grep`.)

- [ ] **Step 3: Rewrite `SupportPage.tsx`**

```tsx
import { Button } from '@oktavius/base-ui';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { supportPageIcon } from '@/lib/modulePageIcons';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { ReportProblemDialog } from './ReportProblemDialog';
import { SupportIssuesView } from './SupportIssuesView';
import { SupportRequesterView } from './SupportRequesterView';
import { SupportTicketDetail } from './SupportTicketDetail';

export function SupportPage() {
  const { ready } = usePreloadNamespaces(['support']);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(false);

  // Superadmins get the global issues board; everyone else gets the requester view.
  const isSuperadmin = useOptionalOsirisRuntime()?.permissionSubject?.isSuperadmin ?? false;

  const ticketId = searchParams.get('ticket');

  function openTicket(id: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('ticket', id);
      return next;
    });
  }

  function clearTicketParam() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('ticket');
      return next;
    });
  }

  if (!ready) return null;

  const title = isSuperadmin ? t('support.issuesTitle') : t('support.title');
  const subtitle = isSuperadmin ? t('support.issuesDescription') : undefined;

  // Report-problem CTA only for non-superadmins (superadmins manage, don't file).
  const actions = isSuperadmin ? undefined : (
    <Button variant="cta" onClick={() => setReportOpen(true)}>
      <PlusIcon size={16} aria-hidden />
      {t('support.reportProblem')}
    </Button>
  );

  return (
    <ModulePage title={title} subtitle={subtitle} icon={supportPageIcon()} actions={actions}>
      {ticketId ? (
        <SupportTicketDetail ticketId={ticketId} onBack={clearTicketParam} admin={isSuperadmin} />
      ) : isSuperadmin ? (
        <SupportIssuesView onOpenTicket={openTicket} />
      ) : (
        <>
          <SupportRequesterView onOpenTicket={openTicket} />
          <ReportProblemDialog
            open={reportOpen}
            onOpenChange={setReportOpen}
            onCreated={(ticket) => {
              setReportOpen(false);
              openTicket(ticket.id);
            }}
          />
        </>
      )}
    </ModulePage>
  );
}
```

- [ ] **Step 4: Rewrite `SupportPage.test.tsx` expectations**

Keep the existing harness (the mocks/setup at the top of the file — ResizeObserver shim, i18n mock, runtime mock, fetch stub, createRoot lifecycle). Replace ONLY the two `describe` blocks (lines ~68-123) with:

```tsx
describe('SupportPage — non-superadmin', () => {
  it('renders the report problem button and the issue list (no toggle)', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SupportPage />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain('support.reportProblem');
    // Old toggle keys must be gone.
    expect(container.textContent).not.toContain('support.viewMine');
    expect(container.textContent).not.toContain('support.viewInbox');
    // Open/Closed counts header present.
    expect(container.textContent).toContain('support.countOpen');
  });
});

describe('SupportPage — superadmin', () => {
  it('renders the issues board with no toggle and no report button', async () => {
    vi.doMock('@/runtime/osiris/useOsirisRuntime', () => ({
      useOptionalOsirisRuntime: () => ({
        activeOrgId: 'o1',
        permissionSubject: { isSuperadmin: true, role: 'admin', permissions: [] },
      }),
    }));
    const { SupportPage: SuperSupportPage } = await import('./SupportPage');

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/support']}>
          <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
              <TestI18nProvider>
                <SuperSupportPage />
              </TestI18nProvider>
            </QueryClientProvider>
          </NuqsAdapter>
        </MemoryRouter>,
      );
    });
    // Superadmin board title + counts, but no report button and no old toggle.
    expect(container.textContent).toContain('support.issuesTitle');
    expect(container.textContent).toContain('support.countOpen');
    expect(container.textContent).not.toContain('support.reportProblem');
    expect(container.textContent).not.toContain('support.viewInbox');
  });
});
```

- [ ] **Step 5: Run the full support test suite**

Run: `pnpm vitest run src/modules/support`
Expected: PASS — `shared.test.ts`, `IssueRow.test.tsx`, `SupportPage.test.tsx`, and the existing `data/*.test.ts(x)` all green.

- [ ] **Step 6: Lint + typecheck the module**

Run: `pnpm exec tsc --noEmit -p apps/web/tsconfig.json 2>&1 | grep "modules/support" || echo "clean"`
Run: `pnpm exec eslint apps/web/src/modules/support --max-warnings 0`
Expected: `clean` and no eslint errors.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/modules/support/SupportPage.tsx apps/web/src/modules/support/SupportPage.test.tsx packages/i18n/locales/en/support.json packages/i18n/locales/de/support.json
git commit -m "feat(support): drop view toggle, branch on superadmin for issues board"
```

---

## Task 7: Cleanup pass

**Files:** whole `support/` module.

- [ ] **Step 1: Confirm no dangling references**

Run: `grep -rn "SupportInboxView\|inboxColumns\|viewMine\|viewInbox\|CrudListShell" apps/web/src/modules/support`
Expected: no matches (CrudListShell fully removed from support; columns gone).

- [ ] **Step 2: Confirm i18n parity**

Run: `pnpm --filter @oktavius/i18n run check 2>/dev/null || node -e "const e=require('./packages/i18n/locales/en/support.json');const d=require('./packages/i18n/locales/de/support.json');const miss=Object.keys(e).filter(k=>!(k in d));console.log(miss.length?'MISSING in de: '+miss.join(','):'i18n parity OK')"`
Expected: `i18n parity OK` (add any missing de keys, then re-run).

- [ ] **Step 3: Full module test + lint once more**

Run: `pnpm vitest run src/modules/support && pnpm exec eslint apps/web/src/modules/support --max-warnings 0`
Expected: all green.

- [ ] **Step 4: Commit any cleanup**

```bash
git add apps/web/src/modules/support packages/i18n/locales
git commit -m "chore(support): cleanup dangling refs and i18n parity" || echo "nothing to clean up"
```

---

## Self-Review notes

- **Spec coverage:** toggle removal (T6), superadmin issues board (T5/T6), requester restyle (T5), IssueRow/List/FilterBar (T2-4), `statusGroup` model + drop `inboxColumns` (T1), i18n add/remove (T6), tests (T1/T2/T6). All spec sections mapped.
- **Type consistency:** `TicketRow` gains `statusGroup`/`categoryLabel` in T1 and is consumed unchanged in T2-5. `StatusGroup` exported from `shared.tsx`, imported by IssueFilterBar/views. `IssueFilterBar` props match call sites in both views. `IssueList` props match both call sites.
- **Known limitation carried forward:** 50-row server cap + client-side filtering (documented in code comments, unchanged from current behavior).
- **Concurrency:** every commit stages only support-module + i18n files (branch FE shared with other agents).
