# Support Triage — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make V3 support tickets fully handleable by superadmins — status/priority/assignee changes, resolve-with-message, internal notes, read-only automation status, and an unread indicator — wired to a defined API contract.

**Architecture:** Extend the existing `apps/web/src/modules/support` module in place (data client + react-query hooks + presentation components). Replace the four `throw SCAFFOLD` client stubs with real `PATCH`/`POST` calls, enable `TriageControls`, add an `AutomationPanel`, internal-note rendering in the thread, and a localStorage-backed unread hook. No backend code is changed.

**Tech Stack:** React 19, TypeScript, `@tanstack/react-query`, `@oktavius/base-ui`, Vitest + Testing Library. All UI follows the V3 design system (borderless `SectionCard`, `Combobox` not `Select`, `appToast`, `ConfirmActionDialog`, icons from `@/lib/icons`).

**Spec:** `docs/superpowers/specs/2026-06-16-support-triage-frontend-design.md`

---

## Working notes for the implementer

- **Run tests from the repo root** `oktavius-v3`: `pnpm --filter @oktavius/web test <path>` runs a single test file. `pnpm --filter @oktavius/web typecheck` and `pnpm lint` validate types and design guardrails.
- **Branch `FE` runs concurrent agents** and lint-staged stashes uncommitted work. **Stage only the files each task names**, and commit promptly after each task.
- **Superadmin flag** comes from `useOptionalOsirisRuntime()?.permissionSubject?.isSuperadmin ?? false`.
- `SupportComment.isInternal` and `normalizeComment` already exist — only the write path and rendering are new.

---

## File structure

```
apps/web/src/modules/support/
├── data/
│   ├── types.ts              MODIFY  assignee + automation fields, SupportAssignee, SupportAutomationStatus
│   ├── supportKeys.ts        MODIFY  assignees key
│   ├── supportClient.ts      MODIFY  patchJson, real mutations, listAssignees, normalize assignee/automation
│   ├── useSupportData.ts     MODIFY  triage mutations, useSupportAssignees
│   ├── useSupportUnread.ts   CREATE  localStorage last-seen hook
│   └── *.test.{ts,tsx}       CREATE/MODIFY
├── TriageControls.tsx        REWRITE enabled controls, borderless SectionCard, resolve dialog
├── AutomationPanel.tsx       CREATE  read-only automation status (superadmin)
├── SupportTicketThread.tsx   MODIFY  internal-note rendering + composer toggle
├── SupportTicketDetail.tsx   MODIFY  markSeen + mount AutomationPanel + pass admin to thread
├── IssueRow.tsx              MODIFY  unread dot
└── *.test.tsx                CREATE/MODIFY
packages/i18n/locales/en/support.json   MODIFY  new strings
packages/i18n/locales/de/support.json   MODIFY  new strings
```

---

## Task 1: Types — assignee, automation, assignee list

**Files:**

- Modify: `apps/web/src/modules/support/data/types.ts`

- [ ] **Step 1: Add the automation-status union and assignee type**

In `types.ts`, after the existing `SupportSource` line (line 4), add:

```ts
export type SupportAutomationStatus =
  | 'not_requested'
  | 'queued'
  | 'pr_created'
  | 'needs_input'
  | 'no_changes'
  | 'failed';
```

- [ ] **Step 2: Extend `SupportTicket` with assignee + automation fields**

In the `SupportTicket` type, after the `resolvedBy: string | null;` line, add:

```ts
assigneeUserId: string | null;
assigneeName: string | null;
automationStatus: SupportAutomationStatus | null;
automationPrUrl: string | null;
automationBranchName: string | null;
automationWorkflowRunUrl: string | null;
automationError: string | null;
```

- [ ] **Step 3: Add the `SupportAssignee` type**

After the `SupportComment` interface, add:

```ts
export interface SupportAssignee {
  userId: string;
  name: string;
  email: string;
}
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: FAIL — `normalizeTicket` in `supportClient.ts` does not yet return the new required fields. (This is fixed in Task 2; the failure confirms the type is now stricter.)

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/data/types.ts
git commit -m "feat(support): add assignee + automation fields to ticket types"
```

---

## Task 2: Client — patchJson, real mutations, listAssignees, normalizers

**Files:**

- Modify: `apps/web/src/modules/support/data/supportClient.ts`
- Test: `apps/web/src/modules/support/data/supportClient.test.ts`

- [ ] **Step 1: Write failing tests for the new client behavior**

Append these tests to `supportClient.test.ts` (reuse the file's existing `fetch` mock helper — match the pattern already used by the `listTickets`/`createTicket` tests; the example below assumes a `mockFetchJson(payload)` style helper exposed in that file, adapt to the existing helper name):

```ts
describe('triage mutations', () => {
  it('updateStatus PATCHes the ticket with status only', async () => {
    const fetchMock = mockFetchJson({ id: 't1', status: 'in_progress' });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    const ticket = await client.updateStatus('t1', 'in_progress');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/support/tickets/t1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ status: 'in_progress' });
    expect(ticket.status).toBe('in_progress');
  });

  it('updatePriority PATCHes priority only', async () => {
    const fetchMock = mockFetchJson({ id: 't1', priority: 'high' });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    await client.updatePriority('t1', 'high');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ priority: 'high' });
  });

  it('assign PATCHes assigneeUserId (null clears)', async () => {
    const fetchMock = mockFetchJson({ id: 't1' });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    await client.assign('t1', null);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ assigneeUserId: null });
  });

  it('resolve POSTs to the resolve endpoint with the message', async () => {
    const fetchMock = mockFetchJson({ id: 't1', status: 'resolved' });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    await client.resolve('t1', 'Fixed in build 42.');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/support/tickets/t1/resolve');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ resolutionMessage: 'Fixed in build 42.' });
  });

  it('addComment forwards isInternal', async () => {
    const fetchMock = mockFetchJson({ id: 'c1', is_internal: true });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    await client.addComment('t1', 'internal note', true);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      message: 'internal note',
      isInternal: true,
    });
  });

  it('listAssignees normalizes the data array', async () => {
    mockFetchJson({ data: [{ user_id: 'u1', name: 'Ada', email: 'ada@x.io' }] });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    const assignees = await client.listAssignees();
    expect(assignees).toEqual([{ userId: 'u1', name: 'Ada', email: 'ada@x.io' }]);
  });

  it('normalizeTicket maps assignee + automation fields', async () => {
    mockFetchJson({
      id: 't1',
      assignee_user_id: 'u1',
      assignee_name: 'Ada',
      automation_status: 'pr_created',
      automation_pr_url: 'https://gh/pr/1',
    });
    const client = createSupportClient({ baseUrl: 'https://api.test' });
    const ticket = await client.getTicket('t1');
    expect(ticket.assigneeUserId).toBe('u1');
    expect(ticket.assigneeName).toBe('Ada');
    expect(ticket.automationStatus).toBe('pr_created');
    expect(ticket.automationPrUrl).toBe('https://gh/pr/1');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/supportClient.test.ts`
Expected: FAIL — `updateStatus` throws `NOT_IMPLEMENTED`, `listAssignees` is undefined, automation fields undefined.

- [ ] **Step 3: Add a nullable-enum reader and import the new types**

In `supportClient.ts`, add `SupportAssignee` and `SupportAutomationStatus` to the type import block (lines 10-24). Add the automation-status list near the other const lists (after line 31):

```ts
const AUTOMATION_STATUSES: readonly SupportAutomationStatus[] = [
  'not_requested',
  'queued',
  'pr_created',
  'needs_input',
  'no_changes',
  'failed',
];
```

Add a nullable-enum helper next to `oneOf` (after line 46):

```ts
function oneOfOrNull<T extends string>(allowed: readonly T[], value: unknown): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}
```

- [ ] **Step 4: Map the new fields in `normalizeTicket`**

In `normalizeTicket`, after the `resolvedBy:` line (line 66), add:

```ts
    assigneeUserId: readStringOrNull(v.assignee_user_id ?? v.assigneeUserId),
    assigneeName: readStringOrNull(v.assignee_name ?? v.assigneeName),
    automationStatus: oneOfOrNull(AUTOMATION_STATUSES, v.automation_status ?? v.automationStatus),
    automationPrUrl: readStringOrNull(v.automation_pr_url ?? v.automationPrUrl),
    automationBranchName: readStringOrNull(v.automation_branch_name ?? v.automationBranchName),
    automationWorkflowRunUrl: readStringOrNull(
      v.automation_workflow_run_url ?? v.automationWorkflowRunUrl,
    ),
    automationError: readStringOrNull(v.automation_error ?? v.automationError),
```

- [ ] **Step 5: Add `patchJson` and a `normalizeAssignee` helper**

After the `postJson` function (line 149), inside `createSupportClient`, add:

```ts
async function patchJson(path: string, body: unknown, fallback: string): Promise<unknown> {
  const response = await fetch(url(path), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
```

Add this module-level normalizer next to `normalizeComment` (after line 87):

```ts
function normalizeAssignee(row: unknown): SupportAssignee {
  const v = readRecord(row);
  return {
    userId: readString(v.user_id ?? v.userId),
    name: readString(v.name),
    email: readString(v.email),
  };
}
```

- [ ] **Step 6: Replace the scaffold stubs and extend `addComment`**

Replace the `addComment` method (lines 205-213) with:

```ts
    async addComment(ticketId: string, message: string, isInternal = false): Promise<SupportComment> {
      return normalizeComment(
        await postJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/comments`,
          { message, isInternal },
          'Reply could not be sent.',
        ),
      );
    },
```

Replace the entire scaffold block (lines 238-250, the four `throw SCAFFOLD` methods) with:

```ts
    async listAssignees(): Promise<SupportAssignee[]> {
      const v = readRecord(await getJson('/support/assignees', 'Assignees could not be loaded.'));
      return Array.isArray(v.data) ? v.data.map(normalizeAssignee) : [];
    },
    async updateStatus(ticketId: string, status: SupportStatus): Promise<SupportTicket> {
      return normalizeTicket(
        await patchJson(
          `/support/tickets/${encodeURIComponent(ticketId)}`,
          { status },
          'Status could not be updated.',
        ),
      );
    },
    async updatePriority(ticketId: string, priority: SupportPriority): Promise<SupportTicket> {
      return normalizeTicket(
        await patchJson(
          `/support/tickets/${encodeURIComponent(ticketId)}`,
          { priority },
          'Priority could not be updated.',
        ),
      );
    },
    async assign(ticketId: string, assigneeUserId: string | null): Promise<SupportTicket> {
      return normalizeTicket(
        await patchJson(
          `/support/tickets/${encodeURIComponent(ticketId)}`,
          { assigneeUserId },
          'Assignee could not be updated.',
        ),
      );
    },
    async resolve(ticketId: string, resolutionMessage: string): Promise<SupportTicket> {
      return normalizeTicket(
        await postJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/resolve`,
          { resolutionMessage },
          'Ticket could not be resolved.',
        ),
      );
    },
```

Delete the now-unused `const SCAFFOLD = ...` line (line 128).

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/supportClient.test.ts`
Expected: PASS (including the pre-existing tests; note the old "updateStatus throws NOT_IMPLEMENTED" test must be deleted — remove it in this step).

- [ ] **Step 8: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS — `normalizeTicket` now returns all required fields.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/modules/support/data/supportClient.ts apps/web/src/modules/support/data/supportClient.test.ts
git commit -m "feat(support): wire triage mutations + assignee list in client"
```

---

## Task 3: Keys + hooks — triage mutations and useSupportAssignees

**Files:**

- Modify: `apps/web/src/modules/support/data/supportKeys.ts`
- Modify: `apps/web/src/modules/support/data/useSupportData.ts`
- Test: `apps/web/src/modules/support/data/useSupportData.test.tsx`

- [ ] **Step 1: Add the assignees query key**

In `supportKeys.ts`, add inside the object (after the `attachments` line):

```ts
  assignees: (org: OrgId) => ['support', org, 'assignees'] as const,
```

- [ ] **Step 2: Write a failing test for the new mutations + assignees hook**

Append to `useSupportData.test.tsx` (follow the file's existing render-hook + mocked-client pattern; the example assumes the existing `renderSupportHook`/mock setup — adapt names to what the file already defines):

```ts
it('updateStatus mutation calls the client and invalidates', async () => {
  const updateStatus = vi.fn().mockResolvedValue({ id: 't1', status: 'resolved' });
  mockClient({ updateStatus });
  const { result } = renderHookWithClient(() => useSupportMutations());
  await act(async () => {
    await result.current.updateStatus.mutateAsync({ ticketId: 't1', status: 'resolved' });
  });
  expect(updateStatus).toHaveBeenCalledWith('t1', 'resolved');
});

it('resolve mutation passes the resolution message', async () => {
  const resolve = vi.fn().mockResolvedValue({ id: 't1', status: 'resolved' });
  mockClient({ resolve });
  const { result } = renderHookWithClient(() => useSupportMutations());
  await act(async () => {
    await result.current.resolve.mutateAsync({ ticketId: 't1', resolutionMessage: 'done' });
  });
  expect(resolve).toHaveBeenCalledWith('t1', 'done');
});

it('useSupportAssignees does not fetch when disabled', () => {
  const listAssignees = vi.fn().mockResolvedValue([]);
  mockClient({ listAssignees });
  renderHookWithClient(() => useSupportAssignees(false));
  expect(listAssignees).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/useSupportData.test.tsx`
Expected: FAIL — `result.current.updateStatus` and `useSupportAssignees` are undefined.

- [ ] **Step 4: Add `useSupportAssignees` and import the type**

In `useSupportData.ts`, extend the type import (line 9) to include `SupportAssignee`, `SupportPriority`, `SupportStatus`:

```ts
import type { CreateTicketInput, ListTicketsParams, SupportPriority, SupportStatus } from './types';
```

Add this hook after `useSupportAttachments` (line 62):

```ts
export function useSupportAssignees(enabled = true) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.assignees(org),
    queryFn: () => client.listAssignees(),
    enabled,
  });
}
```

- [ ] **Step 5: Add the triage mutations and extend `addComment`**

In `useSupportMutations`, replace the `addComment` mutation (lines 81-85) and the `return` (line 87) with:

```ts
const addComment = useMutation({
  mutationFn: (input: { ticketId: string; message: string; isInternal?: boolean }) =>
    client.addComment(input.ticketId, input.message, input.isInternal ?? false),
  onSuccess: invalidate,
});
const updateStatus = useMutation({
  mutationFn: (input: { ticketId: string; status: SupportStatus }) =>
    client.updateStatus(input.ticketId, input.status),
  onSuccess: invalidate,
});
const updatePriority = useMutation({
  mutationFn: (input: { ticketId: string; priority: SupportPriority }) =>
    client.updatePriority(input.ticketId, input.priority),
  onSuccess: invalidate,
});
const assign = useMutation({
  mutationFn: (input: { ticketId: string; assigneeUserId: string | null }) =>
    client.assign(input.ticketId, input.assigneeUserId),
  onSuccess: invalidate,
});
const resolve = useMutation({
  mutationFn: (input: { ticketId: string; resolutionMessage: string }) =>
    client.resolve(input.ticketId, input.resolutionMessage),
  onSuccess: invalidate,
});

return {
  createTicket,
  uploadAttachments,
  addComment,
  updateStatus,
  updatePriority,
  assign,
  resolve,
};
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/useSupportData.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/modules/support/data/supportKeys.ts apps/web/src/modules/support/data/useSupportData.ts apps/web/src/modules/support/data/useSupportData.test.tsx
git commit -m "feat(support): triage mutation hooks + useSupportAssignees"
```

---

## Task 4: useSupportUnread hook

**Files:**

- Create: `apps/web/src/modules/support/data/useSupportUnread.ts`
- Test: `apps/web/src/modules/support/data/useSupportUnread.test.ts`

- [ ] **Step 1: Write the failing test**

Create `useSupportUnread.test.ts`:

```ts
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSupportUnread } from './useSupportUnread';

describe('useSupportUnread', () => {
  beforeEach(() => localStorage.clear());

  it('treats never-seen tickets as unread', () => {
    const { result } = renderHook(() => useSupportUnread());
    expect(result.current.isUnread({ id: 't1', updatedAt: '2026-06-16T10:00:00Z' })).toBe(true);
  });

  it('markSeen clears unread for that ticket', () => {
    const { result } = renderHook(() => useSupportUnread());
    act(() => result.current.markSeen('t1', '2026-06-16T10:00:00Z'));
    expect(result.current.isUnread({ id: 't1', updatedAt: '2026-06-16T10:00:00Z' })).toBe(false);
  });

  it('re-flags unread when the ticket updates after last seen', () => {
    const { result } = renderHook(() => useSupportUnread());
    act(() => result.current.markSeen('t1', '2026-06-16T10:00:00Z'));
    expect(result.current.isUnread({ id: 't1', updatedAt: '2026-06-16T12:00:00Z' })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/useSupportUnread.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `useSupportUnread.ts`:

```ts
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'support:lastSeen';

type LastSeenMap = Record<string, string>;

function read(): LastSeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastSeenMap) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks which tickets the current browser has opened, in localStorage.
 * Frontend-only stand-in for "new activity" until backend notifications exist.
 */
export function useSupportUnread() {
  const [seen, setSeen] = useState<LastSeenMap>(read);

  const isUnread = useCallback(
    (ticket: { id: string; updatedAt: string }) => {
      const lastSeen = seen[ticket.id];
      if (!lastSeen) return true;
      return new Date(ticket.updatedAt).getTime() > new Date(lastSeen).getTime();
    },
    [seen],
  );

  const markSeen = useCallback((ticketId: string, updatedAt: string) => {
    setSeen((prev) => {
      const next = { ...prev, [ticketId]: updatedAt };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota/availability errors */
      }
      return next;
    });
  }, []);

  return { isUnread, markSeen };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/data/useSupportUnread.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/data/useSupportUnread.ts apps/web/src/modules/support/data/useSupportUnread.test.ts
git commit -m "feat(support): localStorage unread/last-seen hook"
```

---

## Task 5: i18n strings

**Files:**

- Modify: `packages/i18n/locales/en/support.json`
- Modify: `packages/i18n/locales/de/support.json`

- [ ] **Step 1: Add English strings**

In `en/support.json`, add these keys (before the closing `}`; ensure the preceding line ends with a comma):

```json
  "statusFieldLabel": "Status",
  "priorityFieldLabel": "Priority",
  "triageStatusUpdated": "Status updated.",
  "triagePriorityUpdated": "Priority updated.",
  "triageAssigneeUpdated": "Assignee updated.",
  "triageUpdateFailed": "Could not update the ticket.",
  "resolveAction": "Resolve ticket",
  "resolveDialogTitle": "Resolve this ticket?",
  "resolveDialogDescription": "Add a short resolution message. The requester will see it in the thread.",
  "resolveMessagePlaceholder": "Describe how this was resolved…",
  "resolveConfirm": "Resolve",
  "resolveCancel": "Cancel",
  "resolveSuccess": "Ticket resolved.",
  "resolveFailed": "Could not resolve the ticket.",
  "assigneeLoadFailed": "Could not load assignees.",
  "internalNoteToggle": "Internal note",
  "internalNoteBadge": "Internal",
  "internalNotePlaceholder": "Add an internal note (not visible to the requester)…",
  "automationTitle": "Automation",
  "automationStatus_queued": "Queued",
  "automationStatus_pr_created": "PR created",
  "automationStatus_needs_input": "Needs input",
  "automationStatus_no_changes": "No changes",
  "automationStatus_failed": "Failed",
  "automationViewPr": "View pull request",
  "automationViewRun": "View workflow run",
  "unreadIndicator": "Unread activity"
```

- [ ] **Step 2: Add matching German strings**

In `de/support.json`, add the same keys with German values:

```json
  "statusFieldLabel": "Status",
  "priorityFieldLabel": "Priorität",
  "triageStatusUpdated": "Status aktualisiert.",
  "triagePriorityUpdated": "Priorität aktualisiert.",
  "triageAssigneeUpdated": "Zuständigkeit aktualisiert.",
  "triageUpdateFailed": "Ticket konnte nicht aktualisiert werden.",
  "resolveAction": "Ticket lösen",
  "resolveDialogTitle": "Dieses Ticket lösen?",
  "resolveDialogDescription": "Füge eine kurze Lösungsnachricht hinzu. Der Anfragende sieht sie im Verlauf.",
  "resolveMessagePlaceholder": "Beschreibe, wie das gelöst wurde…",
  "resolveConfirm": "Lösen",
  "resolveCancel": "Abbrechen",
  "resolveSuccess": "Ticket gelöst.",
  "resolveFailed": "Ticket konnte nicht gelöst werden.",
  "assigneeLoadFailed": "Zuständige konnten nicht geladen werden.",
  "internalNoteToggle": "Interne Notiz",
  "internalNoteBadge": "Intern",
  "internalNotePlaceholder": "Interne Notiz hinzufügen (für den Anfragenden nicht sichtbar)…",
  "automationTitle": "Automatisierung",
  "automationStatus_queued": "In Warteschlange",
  "automationStatus_pr_created": "PR erstellt",
  "automationStatus_needs_input": "Eingabe erforderlich",
  "automationStatus_no_changes": "Keine Änderungen",
  "automationStatus_failed": "Fehlgeschlagen",
  "automationViewPr": "Pull Request ansehen",
  "automationViewRun": "Workflow-Lauf ansehen",
  "unreadIndicator": "Ungelesene Aktivität"
```

- [ ] **Step 3: Validate JSON parses**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS (no JSON parse errors during build). If a codegen step exists for i18n, run it per repo convention.

- [ ] **Step 4: Commit**

```bash
git add packages/i18n/locales/en/support.json packages/i18n/locales/de/support.json
git commit -m "feat(support): i18n strings for triage, resolve, automation, internal notes"
```

---

## Task 6: TriageControls rewrite — enabled controls + resolve dialog + design fix

**Files:**

- Modify: `apps/web/src/modules/support/TriageControls.tsx`
- Test: `apps/web/src/modules/support/TriageControls.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `TriageControls.test.tsx`. Use the module's existing react-query test harness (a `renderWithProviders` that supplies a `QueryClientProvider` and a mocked `useSupportData`; adapt to the helper the other support tests use):

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TriageControls } from './TriageControls';

const baseTicket = {
  id: 't1',
  status: 'open',
  priority: 'normal',
  assigneeUserId: null,
} as never;

const mutations = {
  updateStatus: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  updatePriority: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  assign: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  resolve: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
};

vi.mock('./data/useSupportData', () => ({
  useSupportMutations: () => mutations,
  useSupportAssignees: () => ({ data: [{ userId: 'u1', name: 'Ada', email: 'a@x.io' }] }),
}));

describe('TriageControls', () => {
  it('renders enabled status/priority/assignee controls (no "Soon")', () => {
    render(<TriageControls ticket={baseTicket} />);
    expect(screen.queryByText('Soon')).not.toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Assignee')).toBeInTheDocument();
  });

  it('opens the resolve dialog and calls resolve on confirm', async () => {
    render(<TriageControls ticket={baseTicket} />);
    fireEvent.click(screen.getByText('Resolve ticket'));
    const textarea = await screen.findByPlaceholderText(/Describe how this was resolved/i);
    fireEvent.change(textarea, { target: { value: 'fixed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));
    await waitFor(() =>
      expect(mutations.resolve.mutateAsync).toHaveBeenCalledWith({
        ticketId: 't1',
        resolutionMessage: 'fixed',
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/TriageControls.test.tsx`
Expected: FAIL — controls are disabled with "Soon", no resolve button.

- [ ] **Step 3: Rewrite `TriageControls.tsx`**

Replace the entire file with:

```tsx
import { Button, Combobox, SectionCard, Textarea } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { SupportPriority, SupportStatus, SupportTicket } from './data/types';
import { useSupportAssignees, useSupportMutations } from './data/useSupportData';
import { STATUSES_FOR_UI } from './triageOptions';

interface TriageControlsProps {
  ticket: SupportTicket;
}

const PRIORITIES_FOR_UI: SupportPriority[] = ['low', 'normal', 'high', 'urgent'];

export function TriageControls({ ticket }: TriageControlsProps) {
  const { t } = useTranslation();
  const { updateStatus, updatePriority, assign, resolve } = useSupportMutations();
  const assignees = useSupportAssignees();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const statusOptions = STATUSES_FOR_UI.map((s) => ({
    value: s,
    label: t(`support.statusLabel_${s}`),
  }));
  const priorityOptions = PRIORITIES_FOR_UI.map((p) => ({
    value: p,
    label: t(`support.priorityLabel_${p}`),
  }));
  const assigneeOptions = (assignees.data ?? []).map((a) => ({ value: a.userId, label: a.name }));

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  async function onStatusChange(value: string) {
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status: value as SupportStatus });
      appToast.success(t('support.triageStatusUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onPriorityChange(value: string) {
    try {
      await updatePriority.mutateAsync({ ticketId: ticket.id, priority: value as SupportPriority });
      appToast.success(t('support.triagePriorityUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onAssigneeChange(value: string | undefined) {
    try {
      await assign.mutateAsync({ ticketId: ticket.id, assigneeUserId: value ?? null });
      appToast.success(t('support.triageAssigneeUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onResolveConfirm() {
    try {
      await resolve.mutateAsync({ ticketId: ticket.id, resolutionMessage: resolution.trim() });
      setResolveOpen(false);
      setResolution('');
      appToast.success(t('support.resolveSuccess'));
    } catch (error) {
      appToast.fromApiError(error, t('support.resolveFailed'));
    }
  }

  return (
    <SectionCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">{t('support.statusFieldLabel')}</span>
        <Combobox
          options={statusOptions}
          value={ticket.status}
          onChange={(v) => v && void onStatusChange(v)}
          clearable={false}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {t('support.priorityFieldLabel')}
        </span>
        <Combobox
          options={priorityOptions}
          value={ticket.priority}
          onChange={(v) => v && void onPriorityChange(v)}
          clearable={false}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">{t('support.assigneeLabel')}</span>
        <Combobox
          options={assigneeOptions}
          value={ticket.assigneeUserId ?? undefined}
          onChange={(v) => void onAssigneeChange(v)}
          placeholder={t('support.assigneeUnassigned')}
        />
      </div>

      {!isClosed ? (
        <Button type="button" variant="outline" onClick={() => setResolveOpen(true)}>
          {t('support.resolveAction')}
        </Button>
      ) : null}

      <ConfirmActionDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title={t('support.resolveDialogTitle')}
        description={t('support.resolveDialogDescription')}
        confirmLabel={t('support.resolveConfirm')}
        cancelLabel={t('support.resolveCancel')}
        confirmVariant="cta"
        confirmDisabled={!resolution.trim() || resolve.isPending}
        onConfirm={() => void onResolveConfirm()}
      >
        <Textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder={t('support.resolveMessagePlaceholder')}
          rows={3}
          className="mt-2 resize-none"
        />
      </ConfirmActionDialog>
    </SectionCard>
  );
}
```

> Note: the `Combobox` `onChange` signature — verify against `packages/base-ui/src/components/combobox.tsx`. If it emits `(value: string | undefined)`, the handlers above match. If it differs, adapt the callback wiring only (not the mutation calls).

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/TriageControls.test.tsx`
Expected: PASS

- [ ] **Step 5: Lint (design guardrails) + typecheck**

Run: `pnpm lint && pnpm --filter @oktavius/web typecheck`
Expected: PASS — no `border`/`shadow` on card surface (the old `border border-border bg-card` is gone), `Combobox` used (not `Select`), `ConfirmActionDialog` used (no `window.confirm`).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/support/TriageControls.tsx apps/web/src/modules/support/TriageControls.test.tsx
git commit -m "feat(support): enable triage controls + resolve dialog, fix card border violation"
```

---

## Task 7: AutomationPanel

**Files:**

- Create: `apps/web/src/modules/support/AutomationPanel.tsx`
- Test: `apps/web/src/modules/support/AutomationPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `AutomationPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AutomationPanel } from './AutomationPanel';

const ticket = (overrides: Record<string, unknown>) =>
  ({
    id: 't1',
    automationStatus: null,
    automationPrUrl: null,
    automationWorkflowRunUrl: null,
    automationError: null,
    ...overrides,
  }) as never;

describe('AutomationPanel', () => {
  it('renders nothing when automation has not run', () => {
    const { container } = render(<AutomationPanel ticket={ticket({ automationStatus: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for not_requested', () => {
    const { container } = render(
      <AutomationPanel ticket={ticket({ automationStatus: 'not_requested' })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows status and a PR link when a PR was created', () => {
    render(
      <AutomationPanel
        ticket={ticket({ automationStatus: 'pr_created', automationPrUrl: 'https://gh/pr/1' })}
      />,
    );
    expect(screen.getByText('PR created')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View pull request/i })).toHaveAttribute(
      'href',
      'https://gh/pr/1',
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/AutomationPanel.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AutomationPanel.tsx`**

```tsx
import { Badge, SectionCard } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { ExternalLinkIcon } from '@/lib/icons';

import type { SupportTicket } from './data/types';

interface AutomationPanelProps {
  ticket: SupportTicket;
}

const AUTOMATION_VARIANT: Record<
  string,
  'info' | 'success' | 'warning' | 'destructive' | 'secondary'
> = {
  queued: 'info',
  pr_created: 'success',
  needs_input: 'warning',
  no_changes: 'secondary',
  failed: 'destructive',
};

export function AutomationPanel({ ticket }: AutomationPanelProps) {
  const { t } = useTranslation();
  const status = ticket.automationStatus;
  if (!status || status === 'not_requested') return null;

  return (
    <SectionCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{t('support.automationTitle')}</span>
        <Badge variant={AUTOMATION_VARIANT[status] ?? 'secondary'}>
          {t(`support.automationStatus_${status}`)}
        </Badge>
      </div>
      {ticket.automationError ? (
        <p className="text-xs text-destructive">{ticket.automationError}</p>
      ) : null}
      <div className="flex flex-col gap-1.5">
        {ticket.automationPrUrl ? (
          <a
            href={ticket.automationPrUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon size={14} aria-hidden />
            {t('support.automationViewPr')}
          </a>
        ) : null}
        {ticket.automationWorkflowRunUrl ? (
          <a
            href={ticket.automationWorkflowRunUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon size={14} aria-hidden />
            {t('support.automationViewRun')}
          </a>
        ) : null}
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/AutomationPanel.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/AutomationPanel.tsx apps/web/src/modules/support/AutomationPanel.test.tsx
git commit -m "feat(support): read-only automation status panel"
```

---

## Task 8: SupportTicketThread — internal notes + composer toggle

**Files:**

- Modify: `apps/web/src/modules/support/SupportTicketThread.tsx`
- Test: `apps/web/src/modules/support/SupportTicketThread.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

Create `SupportTicketThread.test.tsx` using the module's react-query harness with a mocked `useSupportData`:

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SupportTicketThread } from './SupportTicketThread';

const addComment = { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false };

vi.mock('./data/useSupportData', () => ({
  useSupportComments: () => ({
    data: [
      {
        id: 'c1',
        message: 'public reply',
        isInternal: false,
        createdAt: '2026-06-16T10:00:00Z',
        userName: 'Ada',
        userEmail: null,
      },
      {
        id: 'c2',
        message: 'secret note',
        isInternal: true,
        createdAt: '2026-06-16T11:00:00Z',
        userName: 'Bob',
        userEmail: null,
      },
    ],
  }),
  useSupportMutations: () => ({ addComment }),
}));

const ticket = {
  id: 't1',
  userName: 'Ada',
  userEmail: 'a@x.io',
  message: 'help',
  createdAt: '2026-06-16T09:00:00Z',
} as never;

describe('SupportTicketThread', () => {
  it('hides internal notes from non-admins', () => {
    render(<SupportTicketThread ticket={ticket} admin={false} />);
    expect(screen.queryByText('secret note')).not.toBeInTheDocument();
    expect(screen.getByText('public reply')).toBeInTheDocument();
  });

  it('shows internal notes with a badge for admins', () => {
    render(<SupportTicketThread ticket={ticket} admin />);
    expect(screen.getByText('secret note')).toBeInTheDocument();
    expect(screen.getByText('Internal')).toBeInTheDocument();
  });

  it('sends isInternal when the toggle is on (admin)', async () => {
    render(<SupportTicketThread ticket={ticket} admin />);
    fireEvent.click(screen.getByLabelText('Internal note'));
    fireEvent.change(screen.getByPlaceholderText(/internal note/i), {
      target: { value: 'note body' },
    });
    fireEvent.click(screen.getByText('Send Reply'));
    await waitFor(() =>
      expect(addComment.mutateAsync).toHaveBeenCalledWith({
        ticketId: 't1',
        message: 'note body',
        isInternal: true,
      }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/SupportTicketThread.test.tsx`
Expected: FAIL — `admin` prop unused, internal notes not rendered, no toggle.

- [ ] **Step 3: Rewrite `SupportTicketThread.tsx`**

Replace the entire file with:

```tsx
import { Button, Switch, Textarea } from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { LockIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import type { SupportTicket } from './data/types';
import { useSupportComments, useSupportMutations } from './data/useSupportData';

interface SupportTicketThreadProps {
  ticket: SupportTicket;
  admin?: boolean;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

interface TimelineEntry {
  author: string;
  date: string;
  body: string;
  label: string;
  isInternal: boolean;
}

export function SupportTicketThread({ ticket, admin = false }: SupportTicketThreadProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [internal, setInternal] = useState(false);

  const commentsQuery = useSupportComments(ticket.id);
  const { addComment } = useSupportMutations();

  const initialEntry: TimelineEntry = {
    author: ticket.userName ?? ticket.userEmail,
    date: ticket.createdAt,
    body: ticket.message,
    label: t('support.initialRequest'),
    isInternal: false,
  };

  const commentEntries: TimelineEntry[] = (commentsQuery.data ?? [])
    .filter((comment) => admin || !comment.isInternal)
    .map((comment) => ({
      author: comment.userName ?? comment.userEmail ?? t('support.supportTeam'),
      date: comment.createdAt,
      body: comment.message,
      label: t('support.commentEntry'),
      isInternal: comment.isInternal,
    }));

  const timeline: TimelineEntry[] = [initialEntry, ...commentEntries];

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, message: trimmed, isInternal: internal });
      setMessage('');
      setInternal(false);
      appToast.success(t('support.replySent'));
    } catch {
      appToast.error(t('support.replyFailed'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {timeline.map((entry, idx) => (
        <div
          key={idx}
          className={
            entry.isInternal ? 'rounded-card bg-warning/10 p-3' : 'rounded-card bg-card p-3'
          }
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{entry.author}</span>
              <span className="text-xs text-muted-foreground">{entry.label}</span>
              {entry.isInternal ? (
                <span className="flex items-center gap-1 rounded-control bg-warning/20 px-1.5 py-0.5 text-xs text-warning-foreground">
                  <LockIcon size={11} aria-hidden />
                  {t('support.internalNoteBadge')}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(entry.date)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{entry.body}</p>
        </div>
      ))}

      {/* Reply composer */}
      <div className="flex flex-col gap-2 rounded-card bg-card p-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            internal ? t('support.internalNotePlaceholder') : t('support.replyPlaceholder')
          }
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          {admin ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={internal}
                onCheckedChange={setInternal}
                aria-label={t('support.internalNoteToggle')}
              />
              {t('support.internalNoteToggle')}
            </label>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={handleSend}
            disabled={addComment.isPending || !message.trim()}
          >
            {t('support.sendReply')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

> Note: also fixes a design-system nit — the old composer used `border border-border bg-card`; the rewrite drops the border. Verify `Switch`'s prop is `onCheckedChange` against `packages/base-ui/src/components/switch.tsx`; if it is `onChange`, adapt that one line.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/SupportTicketThread.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/SupportTicketThread.tsx apps/web/src/modules/support/SupportTicketThread.test.tsx
git commit -m "feat(support): internal notes rendering + admin composer toggle"
```

---

## Task 9: IssueRow unread dot

**Files:**

- Modify: `apps/web/src/modules/support/IssueRow.tsx`
- Test: `apps/web/src/modules/support/IssueRow.test.tsx` (extend)

- [ ] **Step 1: Write the failing test**

Add to `IssueRow.test.tsx`:

```tsx
it('shows an unread indicator when the row is unread', () => {
  render(<IssueRow row={makeRow({ id: 't9' })} onClick={() => {}} unread />);
  expect(screen.getByLabelText('Unread activity')).toBeInTheDocument();
});

it('omits the unread indicator when read', () => {
  render(<IssueRow row={makeRow({ id: 't9' })} onClick={() => {}} unread={false} />);
  expect(screen.queryByLabelText('Unread activity')).not.toBeInTheDocument();
});
```

(Use the file's existing `makeRow`/row factory; if none exists, build a `TicketRow` literal matching the other tests in the file.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/IssueRow.test.tsx`
Expected: FAIL — `unread` prop does not exist.

- [ ] **Step 3: Add the `unread` prop and indicator**

In `IssueRow.tsx`, update the props interface:

```tsx
interface IssueRowProps {
  row: TicketRow;
  onClick: (id: string) => void;
  unread?: boolean;
}
```

Update the signature and the `meta` block to prepend a dot. Replace `export function IssueRow({ row, onClick }: IssueRowProps) {` with `export function IssueRow({ row, onClick, unread = false }: IssueRowProps) {`, and replace the `meta` constant with:

```tsx
const meta = (
  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
    {unread ? (
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-info"
        role="img"
        aria-label="Unread activity"
      />
    ) : null}
    <span className="tabular-nums">#{shortId}</span>
    <span aria-hidden>·</span>
    <span>{row.requester}</span>
    <span aria-hidden>·</span>
    <RelativeTime date={row.updatedAt} />
  </span>
);
```

> The `aria-label` literal "Unread activity" matches the test; if the team prefers i18n here, the caller can pass a translated label — but `IssueRow` has no `t`, so keep the indicator's accessible name wired through the existing `support.unreadIndicator` string at the list level if desired. For this task the literal is acceptable since IssueRow is already string-free.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support/IssueRow.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/IssueRow.tsx apps/web/src/modules/support/IssueRow.test.tsx
git commit -m "feat(support): unread indicator on issue rows"
```

---

## Task 10: Wire it together — detail mounts AutomationPanel, marks seen, passes admin; list feeds unread

**Files:**

- Modify: `apps/web/src/modules/support/SupportTicketDetail.tsx`
- Modify: `apps/web/src/modules/support/IssueList.tsx`
- Modify: `apps/web/src/modules/support/SupportIssuesView.tsx`
- Modify: `apps/web/src/modules/support/SupportRequesterView.tsx`

- [ ] **Step 1: Update `SupportTicketDetail.tsx` — markSeen, AutomationPanel, admin thread**

Add imports at the top:

```tsx
import { useEffect } from 'react';

import { AutomationPanel } from './AutomationPanel';
import { useSupportUnread } from './data/useSupportUnread';
```

Inside the component, after the `useSupportTicket` line, add:

```tsx
const { markSeen } = useSupportUnread();
useEffect(() => {
  if (ticket) markSeen(ticket.id, ticket.updatedAt);
}, [ticket, markSeen]);
```

Pass `admin` into the thread — replace `<SupportTicketThread ticket={ticket} />` with:

```tsx
<SupportTicketThread ticket={ticket} admin={admin} />
```

Mount the automation panel in the aside — replace the `admin ? (...) : null` aside block with:

```tsx
{
  admin ? (
    <aside className="flex flex-col gap-4">
      <TriageControls ticket={ticket} />
      <AutomationPanel ticket={ticket} />
    </aside>
  ) : null;
}
```

- [ ] **Step 2: Thread `unread` from the views into rows**

Check how `IssueList` maps rows to `IssueRow`. Add an `isUnread?: (row: TicketRow) => boolean` prop to `IssueList`'s props and pass `unread={isUnread?.(row) ?? false}` to each `<IssueRow>`. Then in `SupportIssuesView.tsx` and `SupportRequesterView.tsx`, call `const { isUnread } = useSupportUnread();` and pass `isUnread={(row) => isUnread(row)}` to `IssueList`.

Concretely, in `IssueList.tsx` add to the props type:

```tsx
  isUnread?: (row: TicketRow) => boolean;
```

and where each row renders:

```tsx
<IssueRow key={row.id} row={row} onClick={onOpenTicket} unread={isUnread?.(row) ?? false} />
```

In both `SupportIssuesView.tsx` and `SupportRequesterView.tsx`, add the import (the hook lives in `./data/useSupportUnread`):

```tsx
import { useSupportUnread } from './data/useSupportUnread';
```

then near the other hooks:

```tsx
const { isUnread } = useSupportUnread();
```

and pass `isUnread={isUnread}` to the `<IssueList ... />` element.

> `isUnread` already has the `(ticket: { id; updatedAt }) => boolean` shape, and `TicketRow extends SupportTicket`, so passing it directly satisfies `(row: TicketRow) => boolean`.

- [ ] **Step 3: Run the support module test suite**

Run: `pnpm --filter @oktavius/web test apps/web/src/modules/support`
Expected: PASS — all support tests green, including the existing `SupportPage.test.tsx`.

- [ ] **Step 4: Full lint + typecheck**

Run: `pnpm lint && pnpm --filter @oktavius/web typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/support/SupportTicketDetail.tsx apps/web/src/modules/support/IssueList.tsx apps/web/src/modules/support/SupportIssuesView.tsx apps/web/src/modules/support/SupportRequesterView.tsx
git commit -m "feat(support): wire automation panel, mark-seen, and unread indicators end-to-end"
```

---

## Final verification

- [ ] **Run the whole web test suite**

Run: `pnpm --filter @oktavius/web test`
Expected: PASS

- [ ] **Run lint + typecheck once more**

Run: `pnpm lint && pnpm --filter @oktavius/web typecheck`
Expected: PASS

- [ ] **Manual smoke (optional, requires a running osiris with the new endpoints):** As a superadmin, open a ticket, change status/priority/assignee, resolve with a message, post an internal note, confirm the requester view never shows it, and confirm the unread dot clears after opening. Until the osiris endpoints exist, triage actions will surface a toast error — that is expected and the UI must not crash.

---

## Notes for the reviewer

- **Contract dependency:** `PATCH /support/tickets/:id`, `POST /support/tickets/:id/resolve`, `GET /support/assignees`, and the `isInternal` comment field + `assignee_*`/`automation_*` ticket fields must be implemented in osiris for triage to function. Until then, actions degrade gracefully via `appToast`.
- **base-ui API checks:** `Combobox.onChange` and `Switch.onCheckedChange` prop names are flagged inline (Tasks 6 and 8) — verify against the components and adapt only the callback wiring if they differ.
- **Out of scope (per spec):** osiris REST implementation, real email/push notifications, server-side pagination.

```

```
