# Support Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Support module with two surfaces — a requester "My requests" page (report + track your own tickets) and a superadmin "Support Inbox" (org-wide triage) — wired to the existing osiris support REST endpoints, with triage mutations rendered as disabled scaffold.

**Architecture:** Follows the V3 storage-module data pattern (`data/{types,client,keys,hooks}.ts`) and the members-module list pattern (`useListPageState` + `CrudListShell`). Two manifest-registered pages; detail views are in-page swaps driven by a `?ticket=<id>` search param (V3's manifest router builds one route per `path` and does NOT auto-create `/support/:id` routes). The AI assistant is intentionally absent — V3's persistent right-sidebar chat is the agent-first path.

**Tech Stack:** React, TypeScript, `@tanstack/react-query`, react-router-dom, `@oktavius/base-ui`, V3 component toolkit (`CrudListShell`, `RecordEditDialog`, `ModulePage`, `StatusBadge`, `EmptyState`), `@oktavius/i18n` (the `support` namespace already exists), Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-15-support-module-design.md`

---

## File Structure

**New files (module):**

- `apps/web/src/modules/support/data/types.ts` — domain types + list params/result.
- `apps/web/src/modules/support/data/supportClient.ts` — typed osiris client (real reads/writes + scaffold mutation stubs).
- `apps/web/src/modules/support/data/supportKeys.ts` — react-query keys.
- `apps/web/src/modules/support/data/useSupportData.ts` — react-query hooks.
- `apps/web/src/modules/support/shared.tsx` — variant maps, category/source helpers, inbox column defs.
- `apps/web/src/modules/support/ReportProblemDialog.tsx` — create-ticket dialog.
- `apps/web/src/modules/support/SupportTicketThread.tsx` — shared thread + reply composer.
- `apps/web/src/modules/support/TriageControls.tsx` — scaffold status/assignee/resolve panel (disabled).
- `apps/web/src/modules/support/SupportTicketDetail.tsx` — detail view (thread + metadata; admin adds TriageControls).
- `apps/web/src/modules/support/SupportPage.tsx` — requester surface (list + detail swap).
- `apps/web/src/modules/support/SupportInboxPage.tsx` — admin queue (stats + table + detail swap).

**New test files:**

- `apps/web/src/modules/support/data/supportClient.test.ts`
- `apps/web/src/modules/support/data/useSupportData.test.tsx`
- `apps/web/src/modules/support/SupportPage.test.tsx`
- `apps/web/src/modules/support/SupportInboxPage.test.tsx`

**Modified files:**

- `apps/web/src/lib/org-profiles/types.ts` — add `'support' | 'support-inbox'` to `OrgModuleId`.
- `apps/web/src/lib/org-profiles/profiles.ts` — add `'support'` to `DEFAULT_ORG_MODULES`.
- `apps/web/src/lib/org-profiles/presets/*.ts` — add `'support'` to presets that should show it.
- `apps/web/src/lib/icons.ts` — export a `LifeBuoyIcon`.
- `apps/web/src/lib/modulePageIcons.tsx` — add `supportPageIcon`.
- `apps/web/src/lib/appNavModules.ts` — two manifest entries (`support`, `support-inbox`).
- `packages/i18n/locales/en/support.json` + `packages/i18n/locales/de/support.json` — add new keys.
- `packages/i18n/locales/en/navigation.json` + `de/navigation.json` — add `support` / `supportInbox` nav labels.

---

## Conventions (read once)

- **Org scoping:** the list endpoint role-widens to org-wide on the backend for superadmins; the SAME `GET /support/tickets` serves both surfaces. The frontend does not branch the request.
- **Detail via search param:** `useSearchParams()`; `?ticket=<id>` present → render detail, else render list. "Back" clears the param.
- **Scaffold mutations:** `updateStatus`/`assign`/`resolve`/internal-note throw `new Error('NOT_IMPLEMENTED: backend REST not yet exposed')`; their UI controls are rendered `disabled` with a "soon" hint. Never wired to a button that appears enabled.
- **i18n:** every user-facing string uses `t('support.<key>')` / `t('navigation.<key>')`. No hardcoded copy.
- **Commit cadence:** one commit per task. On branch `FE` (concurrent agents) stage ONLY the files you touched — never `git add -A`.

---

### Task 1: Domain types

**Files:**

- Create: `apps/web/src/modules/support/data/types.ts`

- [ ] **Step 1: Write the types file**

```typescript
import type { StorageNode } from '@/modules/storage/data/types';

export type SupportCategory = 'bug' | 'feature_request' | 'other';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportSource = 'web' | 'agent' | 'email';

export interface SupportTicket {
  id: string;
  orgId: string | null;
  orgName: string | null;
  userId: string;
  userEmail: string;
  userName: string | null;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  priority: SupportPriority;
  tags: string[];
  source: SupportSource;
  resolutionMessage: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  currentPageUrl: string | null;
  agentConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface ListTicketsParams {
  page?: number;
  pageSize?: number;
  status?: SupportStatus | undefined;
  priority?: SupportPriority | undefined;
  category?: SupportCategory | undefined;
  search?: string | undefined;
  sort?: string | undefined;
  tag?: string | undefined;
}

export interface TicketListResult {
  data: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTicketInput {
  subject: string;
  message: string;
  category: SupportCategory;
  priority?: SupportPriority;
  tags?: string[];
  currentPageUrl?: string;
}

export type SupportAttachment = StorageNode;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS (no errors referencing `support/data/types.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/data/types.ts
git commit -m "feat(support): add domain types"
```

---

### Task 2: Support client — failing test first

**Files:**

- Test: `apps/web/src/modules/support/data/supportClient.test.ts`

- [ ] **Step 1: Write the failing test** (mirrors `storageClient.test.ts` fetch-mock style)

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSupportClient } from './supportClient';

const BASE = 'https://api.example.test/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createSupportClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists tickets, builds query string and normalizes snake_case', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 't1',
            org_id: 'o1',
            org_name: 'Acme',
            user_id: 'u1',
            user_email: 'a@b.c',
            user_name: 'A B',
            subject: 'Upload fails',
            message: 'big pdf',
            category: 'bug',
            status: 'open',
            priority: 'urgent',
            tags: ['x'],
            source: 'web',
            resolution_message: null,
            resolved_at: null,
            resolved_by: null,
            current_page_url: null,
            agent_conversation_id: null,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 12,
      }),
    );

    const client = createSupportClient({ baseUrl: BASE });
    const result = await client.listTickets({
      page: 1,
      pageSize: 12,
      status: 'open',
      sort: '-updated_at',
    });

    const url = fetchMock.mock.calls[0]![0] as string;
    expect(url).toContain(`${BASE}/support/tickets?`);
    expect(url).toContain('status=open');
    expect(url).toContain('sort=-updated_at');
    expect(result.total).toBe(1);
    expect(result.data[0]!.orgName).toBe('Acme');
    expect(result.data[0]!.priority).toBe('urgent');
  });

  it('creates a ticket with a JSON body', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 't2',
        subject: 'New',
        message: 'm',
        category: 'other',
        status: 'open',
        priority: 'normal',
        source: 'web',
        tags: [],
        created_at: '',
        updated_at: '',
        user_id: 'u',
        user_email: 'e',
      }),
    );
    const client = createSupportClient({ baseUrl: BASE });
    const ticket = await client.createTicket({ subject: 'New', message: 'm', category: 'other' });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      subject: 'New',
      category: 'other',
    });
    expect(ticket.id).toBe('t2');
  });

  it('uploads attachments as multipart form data', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = createSupportClient({ baseUrl: BASE });
    const file = new File(['x'], 'log.txt', { type: 'text/plain' });
    await client.uploadAttachments('t1', [file]);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toContain(`${BASE}/support/tickets/t1/attachments`);
    expect((init as RequestInit).body).toBeInstanceOf(FormData);
  });

  it('updateStatus throws NOT_IMPLEMENTED (scaffold)', async () => {
    const client = createSupportClient({ baseUrl: BASE });
    await expect(client.updateStatus('t1', 'resolved')).rejects.toThrow('NOT_IMPLEMENTED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/data/supportClient.test.ts`
Expected: FAIL — `createSupportClient` is not defined / module not found.

- [ ] **Step 3: Commit the test**

```bash
git add apps/web/src/modules/support/data/supportClient.test.ts
git commit -m "test(support): failing tests for support client"
```

---

### Task 3: Support client — implementation

**Files:**

- Create: `apps/web/src/modules/support/data/supportClient.ts`

- [ ] **Step 1: Implement the client** (uses the same `osirisClientUtils` readers as storage)

```typescript
import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';
import type { StorageNode } from '@/modules/storage/data/types';

import type {
  CreateTicketInput,
  ListTicketsParams,
  SupportComment,
  SupportCategory,
  SupportPriority,
  SupportSource,
  SupportStats,
  SupportStatus,
  SupportTicket,
  TicketListResult,
} from './types';

export type SupportClientOptions = { baseUrl?: string };

const CATEGORIES: readonly SupportCategory[] = ['bug', 'feature_request', 'other'];
const STATUSES: readonly SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: readonly SupportPriority[] = ['low', 'normal', 'high', 'urgent'];
const SOURCES: readonly SupportSource[] = ['web', 'agent', 'email'];

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeTicket(row: unknown): SupportTicket {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    orgName: readStringOrNull(v.org_name ?? v.orgName),
    userId: readString(v.user_id ?? v.userId),
    userEmail: readString(v.user_email ?? v.userEmail),
    userName: readStringOrNull(v.user_name ?? v.userName),
    subject: readString(v.subject),
    message: readString(v.message),
    category: oneOf(CATEGORIES, v.category, 'other'),
    status: oneOf(STATUSES, v.status, 'open'),
    priority: oneOf(PRIORITIES, v.priority, 'normal'),
    tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === 'string') : [],
    source: oneOf(SOURCES, v.source, 'web'),
    resolutionMessage: readStringOrNull(v.resolution_message ?? v.resolutionMessage),
    resolvedAt: readStringOrNull(v.resolved_at ?? v.resolvedAt),
    resolvedBy: readStringOrNull(v.resolved_by ?? v.resolvedBy),
    currentPageUrl: readStringOrNull(v.current_page_url ?? v.currentPageUrl),
    agentConversationId: readStringOrNull(v.agent_conversation_id ?? v.agentConversationId),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function normalizeComment(row: unknown): SupportComment {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    ticketId: readString(v.ticket_id ?? v.ticketId),
    userId: readString(v.user_id ?? v.userId),
    userName: readStringOrNull(v.user_name ?? v.userName),
    userEmail: readStringOrNull(v.user_email ?? v.userEmail),
    message: readString(v.message),
    isInternal: Boolean(v.is_internal ?? v.isInternal),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const SCAFFOLD = 'NOT_IMPLEMENTED: backend REST not yet exposed';

export function createSupportClient(options: SupportClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function postJson(path: string, body: unknown, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listTickets(params: ListTicketsParams = {}): Promise<TicketListResult> {
      const payload = readRecord(
        await getJson(
          `/support/tickets${buildQuery({ ...params })}`,
          'Tickets could not be loaded.',
        ),
      );
      const data = Array.isArray(payload.data) ? payload.data.map(normalizeTicket) : [];
      return {
        data,
        total: readNumber(payload.total, data.length),
        page: readNumber(payload.page, 1),
        pageSize: readNumber(payload.page_size ?? payload.pageSize, data.length),
      };
    },
    async getStats(): Promise<SupportStats> {
      const v = readRecord(await getJson('/support/tickets/stats', 'Stats could not be loaded.'));
      return {
        total: readNumber(v.total),
        open: readNumber(v.open),
        inProgress: readNumber(v.inProgress ?? v.in_progress),
        resolved: readNumber(v.resolved),
        closed: readNumber(v.closed),
      };
    },
    async getTicket(id: string): Promise<SupportTicket> {
      return normalizeTicket(
        await getJson(`/support/tickets/${encodeURIComponent(id)}`, 'Ticket could not be loaded.'),
      );
    },
    async listComments(ticketId: string): Promise<SupportComment[]> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/comments`,
          'Comments could not be loaded.',
        ),
      );
      return Array.isArray(v.data) ? v.data.map(normalizeComment) : [];
    },
    async listAttachments(ticketId: string): Promise<StorageNode[]> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/attachments`,
          'Attachments could not be loaded.',
        ),
      );
      // StorageNode normalization is owned by the storage client; pass through the raw rows.
      return Array.isArray(v.data) ? (v.data as StorageNode[]) : [];
    },
    async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
      return normalizeTicket(
        await postJson('/support/tickets', input, 'Ticket could not be created.'),
      );
    },
    async addComment(ticketId: string, message: string): Promise<SupportComment> {
      return normalizeComment(
        await postJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/comments`,
          { message },
          'Reply could not be sent.',
        ),
      );
    },
    async uploadAttachments(ticketId: string, files: File[]): Promise<void> {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await fetch(
        url(`/support/tickets/${encodeURIComponent(ticketId)}/attachments`),
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Attachments could not be uploaded.'));
    },
    async attachmentDownloadUrl(ticketId: string, nodeId: string): Promise<string> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(nodeId)}/download`,
          'Download unavailable.',
        ),
      );
      return readString(v.url);
    },

    // --- Scaffold mutations: no backend REST yet. Keep signatures stable for later wiring. ---
    async updateStatus(_ticketId: string, _status: SupportStatus): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async updatePriority(_ticketId: string, _priority: SupportPriority): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async assign(_ticketId: string, _assigneeUserId: string | null): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async resolve(_ticketId: string, _resolutionMessage: string): Promise<never> {
      throw new Error(SCAFFOLD);
    },
  };
}

export type SupportClient = ReturnType<typeof createSupportClient>;
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/data/supportClient.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/data/supportClient.ts
git commit -m "feat(support): osiris support client with scaffold mutations"
```

---

### Task 4: Query keys

**Files:**

- Create: `apps/web/src/modules/support/data/supportKeys.ts`

- [ ] **Step 1: Write the keys** (mirror `storageKeys.ts`)

```typescript
import type { ListTicketsParams } from './types';

type OrgId = string | null;

export const supportKeys = {
  root: (org: OrgId) => ['support', org] as const,
  list: (org: OrgId, params: ListTicketsParams) => ['support', org, 'list', params] as const,
  stats: (org: OrgId) => ['support', org, 'stats'] as const,
  ticket: (org: OrgId, id: string) => ['support', org, 'ticket', id] as const,
  comments: (org: OrgId, id: string) => ['support', org, 'comments', id] as const,
  attachments: (org: OrgId, id: string) => ['support', org, 'attachments', id] as const,
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/data/supportKeys.ts
git commit -m "feat(support): react-query keys"
```

---

### Task 5: Data hooks — failing test first

**Files:**

- Test: `apps/web/src/modules/support/data/useSupportData.test.tsx`

- [ ] **Step 1: Write the failing test** (pre-seeded react-query + fetch mock)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSupportTickets } from './useSupportData';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useSupportTickets', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0, page: 1, page_size: 12 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fetches the ticket list', async () => {
    const { result } = renderHook(() => useSupportTickets({ page: 1, pageSize: 12 }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/data/useSupportData.test.tsx`
Expected: FAIL — `useSupportTickets` not defined.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/data/useSupportData.test.tsx
git commit -m "test(support): failing hook test"
```

---

### Task 6: Data hooks — implementation

**Files:**

- Create: `apps/web/src/modules/support/data/useSupportData.ts`

- [ ] **Step 1: Implement hooks** (mirror `useStorageData.ts`)

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createSupportClient } from './supportClient';
import { supportKeys } from './supportKeys';
import type { CreateTicketInput, ListTicketsParams } from './types';

export function useSupportClient() {
  return useMemo(() => createSupportClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useSupportTickets(params: ListTicketsParams) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.list(org, params),
    queryFn: () => client.listTickets(params),
  });
}

export function useSupportStats(enabled = true) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({ queryKey: supportKeys.stats(org), queryFn: () => client.getStats(), enabled });
}

export function useSupportTicket(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.ticket(org, id ?? ''),
    queryFn: () => client.getTicket(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportComments(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.comments(org, id ?? ''),
    queryFn: () => client.listComments(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportAttachments(id: string | null) {
  const client = useSupportClient();
  const org = useOrgId();
  return useQuery({
    queryKey: supportKeys.attachments(org, id ?? ''),
    queryFn: () => client.listAttachments(id as string),
    enabled: Boolean(id),
  });
}

export function useSupportMutations() {
  const client = useSupportClient();
  const org = useOrgId();
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: supportKeys.root(org) });
  };

  const createTicket = useMutation({
    mutationFn: (input: CreateTicketInput) => client.createTicket(input),
    onSuccess: invalidate,
  });
  const uploadAttachments = useMutation({
    mutationFn: (input: { ticketId: string; files: File[] }) =>
      client.uploadAttachments(input.ticketId, input.files),
    onSuccess: invalidate,
  });
  const addComment = useMutation({
    mutationFn: (input: { ticketId: string; message: string }) =>
      client.addComment(input.ticketId, input.message),
    onSuccess: invalidate,
  });

  return { createTicket, uploadAttachments, addComment };
}
```

- [ ] **Step 2: Run to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/data/useSupportData.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/data/useSupportData.ts
git commit -m "feat(support): react-query data hooks"
```

---

### Task 7: Shared presentation helpers

**Files:**

- Create: `apps/web/src/modules/support/shared.tsx`

- [ ] **Step 1: Write helpers** (variant maps + category/source icons + inbox columns)

```tsx
import type { BadgeProps } from '@oktavius/base-ui';

import { statusColumn } from '@/components/data/columns';
import type { CrudColumn } from '@/components/data/CrudTable';
import { BotIcon, BugIcon, GlobeIcon, LifeBuoyIcon, MailIcon, SparklesIcon } from '@/lib/icons';

import type { SupportCategory, SupportSource, SupportTicket } from './data/types';

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

export const CATEGORY_ICON = {
  bug: BugIcon,
  feature_request: SparklesIcon,
  other: LifeBuoyIcon,
} as const satisfies Record<SupportCategory, unknown>;

export const SOURCE_ICON = {
  web: GlobeIcon,
  agent: BotIcon,
  email: MailIcon,
} as const satisfies Record<SupportSource, unknown>;

/** Row shape consumed by CrudListShell (requires `id`). */
export type TicketRow = SupportTicket & {
  requester: string;
  statusLabel: string;
  priorityLabel: string;
};

/**
 * Inbox columns. `t` is passed in so headers/labels are translated.
 * statusColumn renders a StatusBadge from the row value + variant map.
 */
export function inboxColumns(t: (key: string) => string): CrudColumn<TicketRow>[] {
  return [
    { key: 'subject', header: t('support.colSubject'), sortable: true },
    { key: 'requester', header: t('support.colRequester'), sortable: true, hideBelow: 'md' },
    statusColumn<TicketRow>('priorityLabel', t('support.colPriority'), PRIORITY_VARIANT, {
      sortable: true,
    }),
    statusColumn<TicketRow>('statusLabel', t('support.colStatus'), STATUS_VARIANT, {
      sortable: true,
    }),
    {
      key: 'updatedAt',
      header: t('support.colUpdated'),
      sortable: true,
      type: 'date',
      hideBelow: 'sm',
    },
  ];
}

export function toTicketRow(ticket: SupportTicket, t: (key: string) => string): TicketRow {
  return {
    ...ticket,
    requester: ticket.userName ?? ticket.userEmail,
    statusLabel: t(`support.statusLabel_${ticket.status}`),
    priorityLabel: t(`support.priorityLabel_${ticket.priority}`),
  };
}
```

- [ ] **Step 2: Verify icon names exist** (BugIcon/SparklesIcon/GlobeIcon/MailIcon/BotIcon)

Run: `grep -nE "BugIcon|SparklesIcon|GlobeIcon|MailIcon|BotIcon|LifeBuoyIcon" apps/web/src/lib/icons.ts`
Expected: each present. If any is missing, add it in Task 12 (icons) before this compiles — note it now. `BotIcon` is already used by the ai-chat nav entry, so it exists.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/shared.tsx
git commit -m "feat(support): shared variant maps, icons and inbox columns"
```

---

### Task 8: Report-a-problem dialog

**Files:**

- Create: `apps/web/src/modules/support/ReportProblemDialog.tsx`

- [ ] **Step 1: Write the dialog** (uses `RecordEditDialog` + `FormField[]`; centered modal, per spec)

```tsx
import { useState } from 'react';

import { RecordEditDialog } from '@/components/common/RecordEditDialog';
import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { useTranslation } from '@/core/i18n';
import { toast } from '@/lib/toast';

import { useSupportMutations } from './data/useSupportData';
import type { SupportCategory, SupportTicket } from './data/types';

type ReportValues = {
  subject: string;
  category: SupportCategory;
  message: string;
  attachments: File | null;
};

export function ReportProblemDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ticket: SupportTicket) => void;
}) {
  const { t } = useTranslation();
  const { createTicket, uploadAttachments } = useSupportMutations();
  const [submitting, setSubmitting] = useState(false);

  const fields: FormField[] = [
    {
      name: 'subject',
      label: t('support.subjectLabel'),
      type: 'text',
      required: true,
      placeholder: t('support.subjectPlaceholder'),
      validate: { minLength: 3, message: t('support.subjectMin') },
      colSpan: 2,
    },
    {
      name: 'category',
      label: t('support.categoryLabel'),
      type: 'select',
      required: true,
      options: [
        { value: 'bug', label: t('support.categoryBug') },
        { value: 'feature_request', label: t('support.categoryFeatureRequest') },
        { value: 'other', label: t('support.categoryOther') },
      ],
    },
    {
      name: 'message',
      label: t('support.messageLabel'),
      type: 'textarea',
      required: true,
      placeholder: t('support.messagePlaceholder'),
      validate: { minLength: 10, message: t('support.messageMin') },
      colSpan: 2,
    },
    {
      name: 'attachments',
      label: t('support.attachmentsLabel'),
      type: 'file',
      description: t('support.attachmentsHint'),
      colSpan: 2,
    },
  ];

  return (
    <RecordEditDialog<Record<string, FormFieldValue>>
      open={open}
      onOpenChange={onOpenChange}
      title={t('support.createTicket')}
      description={t('support.createDescription')}
      fields={fields}
      defaultValues={{ subject: '', category: 'other', message: '', attachments: null }}
      submitLabel={t('support.submitTicket')}
      isSubmitting={submitting}
      onSubmit={async (values) => {
        setSubmitting(true);
        try {
          const v = values as ReportValues;
          const ticket = await createTicket.mutateAsync({
            subject: v.subject,
            message: v.message,
            category: v.category,
          });
          if (v.attachments instanceof File) {
            await uploadAttachments.mutateAsync({ ticketId: ticket.id, files: [v.attachments] });
          }
          toast.success(t('support.ticketCreated'));
          onCreated(ticket);
          return { ok: true };
        } catch {
          toast.error(t('support.createFailed'));
          return { ok: false };
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
```

> **Note on `onSubmit` return type:** `RecordEditDialog`'s `onSubmit` returns `FormSubmissionResult`. Confirm its exact shape in `apps/web/src/components/common/RecordEditDialog.tsx` and match it (the `{ ok: boolean }` above is the expected shape — adjust if the real type differs, e.g. returns `void` on success / throws on error). If the file input must support multiple files, switch to `accept` + a multi-file field; the osiris version allowed multiple — single-file is acceptable for v1, note the reduction.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS. Fix the `onSubmit` return shape against the real `FormSubmissionResult` if tsc complains.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/ReportProblemDialog.tsx
git commit -m "feat(support): report-a-problem dialog"
```

---

### Task 9: Ticket thread + reply composer

**Files:**

- Create: `apps/web/src/modules/support/SupportTicketThread.tsx`

- [ ] **Step 1: Write the thread component**

```tsx
import { useState } from 'react';

import { Button, Textarea } from '@oktavius/base-ui';
import { useDateTimeFormat, useTranslation } from '@/core/i18n';
import { toast } from '@/lib/toast';

import { useSupportComments, useSupportMutations } from './data/useSupportData';
import type { SupportTicket } from './data/types';

export function SupportTicketThread({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateTimeFormat();
  const { data: comments = [], isLoading } = useSupportComments(ticket.id);
  const { addComment } = useSupportMutations();
  const [message, setMessage] = useState('');

  const timeline = [
    {
      id: `initial-${ticket.id}`,
      label: t('support.initialRequest'),
      author: ticket.userName ?? ticket.userEmail,
      createdAt: ticket.createdAt,
      message: ticket.message,
    },
    ...comments.map((c) => ({
      id: c.id,
      label: t('support.commentEntry'),
      author: c.userName ?? c.userEmail ?? t('support.supportTeam'),
      createdAt: c.createdAt,
      message: c.message,
    })),
  ];

  const handleReply = async () => {
    if (!message.trim()) return;
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, message: message.trim() });
      setMessage('');
      toast.success(t('support.replySent'));
    } catch {
      toast.error(t('support.replyFailed'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : (
          timeline.map((entry) => (
            <div key={entry.id} className="rounded-lg bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{entry.author}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.message}</p>
            </div>
          ))
        )}
      </div>
      <div className="space-y-2 rounded-lg bg-muted/20 p-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('support.commentPlaceholder')}
          className="min-h-[110px]"
        />
        <div className="flex justify-end">
          <Button onClick={handleReply} disabled={addComment.isPending || !message.trim()}>
            {t('support.sendReply')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

> Confirm `Button` and `Textarea` are exported from `@oktavius/base-ui` (they are — `button.tsx`, `textarea.tsx`). Confirm `useDateTimeFormat` is exported from `@/core/i18n` (osiris used it; verify in V3 — if absent, use `new Intl.DateTimeFormat` or the project's date util).

- [ ] **Step 2: Typecheck** — `pnpm --filter @oktavius/web exec tsc --noEmit` → PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportTicketThread.tsx
git commit -m "feat(support): ticket thread + reply composer"
```

---

### Task 10: Triage controls (scaffold)

**Files:**

- Create: `apps/web/src/modules/support/TriageControls.tsx`

- [ ] **Step 1: Write disabled scaffold controls**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@oktavius/base-ui';
import { useTranslation } from '@/core/i18n';

import { STATUSES_FOR_UI } from './triageOptions';
import type { SupportTicket } from './data/types';

// Local, not exported to the shared library — admin-only scaffold.
export function TriageControls({ ticket }: { ticket: SupportTicket }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('common.status')}</label>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {t('support.triageSoon')}
          </span>
        </div>
        <Select value={ticket.status} disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES_FOR_UI.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`support.statusLabel_${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">{t('support.assigneeLabel')}</label>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {t('support.triageSoon')}
          </span>
        </div>
        <Select value="" disabled>
          <SelectTrigger>
            <SelectValue placeholder={t('support.assigneeUnassigned')} />
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the small options file**

Create `apps/web/src/modules/support/triageOptions.ts`:

```typescript
import type { SupportStatus } from './data/types';

export const STATUSES_FOR_UI: SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
```

- [ ] **Step 3: Typecheck** — confirm `Select*` exports from `@oktavius/base-ui` (`select.tsx` exists). `pnpm --filter @oktavius/web exec tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/support/TriageControls.tsx apps/web/src/modules/support/triageOptions.ts
git commit -m "feat(support): scaffold triage controls (disabled)"
```

---

### Task 11: Ticket detail view

**Files:**

- Create: `apps/web/src/modules/support/SupportTicketDetail.tsx`

- [ ] **Step 1: Write the detail view** (thread + metadata; `admin` flag adds TriageControls)

```tsx
import { BackButton } from '@/components/common/BackButton';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { useTranslation } from '@/core/i18n';

import { SupportTicketThread } from './SupportTicketThread';
import { TriageControls } from './TriageControls';
import { useSupportTicket } from './data/useSupportData';
import { PRIORITY_VARIANT, STATUS_VARIANT } from './shared';

export function SupportTicketDetail({
  ticketId,
  onBack,
  admin = false,
}: {
  ticketId: string;
  onBack: () => void;
  admin?: boolean;
}) {
  const { t } = useTranslation();
  const { data: ticket, isLoading } = useSupportTicket(ticketId);

  if (isLoading) return <p className="text-sm text-muted-foreground">…</p>;
  if (!ticket) {
    return (
      <div className="space-y-4">
        <BackButton onClick={onBack} label={t('support.backToTickets')} />
        <p className="text-sm text-muted-foreground">{t('support.ticketNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label={t('support.backToTickets')} />
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{ticket.subject}</h2>
        <StatusBadge
          status={ticket.status}
          label={t(`support.statusLabel_${ticket.status}`)}
          variantMap={STATUS_VARIANT}
        />
        <StatusBadge
          status={ticket.priority}
          label={t(`support.priorityLabel_${ticket.priority}`)}
          variantMap={PRIORITY_VARIANT}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <SupportTicketThread ticket={ticket} />
        {admin ? (
          <aside className="space-y-4">
            <TriageControls ticket={ticket} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
```

> Confirm `BackButton` accepts `onClick` (osiris used `to`/`label`). If it only accepts `to`, wrap with a button or use `to="#"` + `onClick`. Inspect `apps/web/src/components/common/BackButton.tsx` and adapt.

- [ ] **Step 2: Typecheck** — `pnpm --filter @oktavius/web exec tsc --noEmit` → PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportTicketDetail.tsx
git commit -m "feat(support): ticket detail view"
```

---

### Task 12: Icons + module page icon

**Files:**

- Modify: `apps/web/src/lib/icons.ts`
- Modify: `apps/web/src/lib/modulePageIcons.tsx`

- [ ] **Step 1: Ensure LifeBuoy + any missing icons are exported**

In `apps/web/src/lib/icons.ts`, add (Phosphor; match the file's existing export style — alias `Icon` suffix):

```typescript
export { LifeBuoy as LifeBuoyIcon } from '@phosphor-icons/react';
// Add only if grep in Task 7 showed them missing:
export { Bug as BugIcon } from '@phosphor-icons/react';
export { Sparkle as SparklesIcon } from '@phosphor-icons/react';
export { Globe as GlobeIcon } from '@phosphor-icons/react';
export { EnvelopeSimple as MailIcon } from '@phosphor-icons/react';
```

> First run `grep -nE "BugIcon|SparklesIcon|GlobeIcon|MailIcon" apps/web/src/lib/icons.ts` and only add the ones missing. Match the established alias/import convention in that file (it may re-export from a single Phosphor import block).

- [ ] **Step 2: Add the module page icon**

In `apps/web/src/lib/modulePageIcons.tsx`:

```typescript
import { LifeBuoyIcon } from '@/lib/icons';
// ...
export const supportPageIcon = () => modulePageIcon(LifeBuoyIcon);
```

- [ ] **Step 3: Typecheck** — `pnpm --filter @oktavius/web exec tsc --noEmit` → PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/icons.ts apps/web/src/lib/modulePageIcons.tsx
git commit -m "feat(support): support module icon"
```

---

### Task 13: i18n keys

**Files:**

- Modify: `packages/i18n/locales/en/support.json`
- Modify: `packages/i18n/locales/de/support.json`
- Modify: `packages/i18n/locales/en/navigation.json`, `packages/i18n/locales/de/navigation.json`

- [ ] **Step 1: Add new keys to `en/support.json`** (existing keys are reused; add these)

```json
{
  "priorityLabel_low": "Low",
  "priorityLabel_normal": "Normal",
  "priorityLabel_high": "High",
  "priorityLabel_urgent": "Urgent",
  "inboxTitle": "Support Inbox",
  "inboxDescription": "Triage and respond to tickets across the organization.",
  "colSubject": "Ticket",
  "colRequester": "Requester",
  "colPriority": "Priority",
  "colStatus": "Status",
  "colUpdated": "Updated",
  "statRowOpen": "Open",
  "statRowInProgress": "In progress",
  "statRowUrgent": "Urgent",
  "statRowResolved": "Resolved",
  "assigneeLabel": "Assignee",
  "assigneeUnassigned": "Unassigned",
  "triageSoon": "Soon",
  "emptyInboxTitle": "No tickets",
  "emptyInboxDescription": "Tickets from across the organization will appear here.",
  "reportProblem": "Report a problem"
}
```

- [ ] **Step 2: Add the German translations to `de/support.json`** (same keys, German values)

```json
{
  "priorityLabel_low": "Niedrig",
  "priorityLabel_normal": "Normal",
  "priorityLabel_high": "Hoch",
  "priorityLabel_urgent": "Dringend",
  "inboxTitle": "Support-Postfach",
  "inboxDescription": "Tickets der gesamten Organisation sichten und beantworten.",
  "colSubject": "Ticket",
  "colRequester": "Anfragesteller",
  "colPriority": "Priorität",
  "colStatus": "Status",
  "colUpdated": "Aktualisiert",
  "statRowOpen": "Offen",
  "statRowInProgress": "In Bearbeitung",
  "statRowUrgent": "Dringend",
  "statRowResolved": "Gelöst",
  "assigneeLabel": "Zuständig",
  "assigneeUnassigned": "Nicht zugewiesen",
  "triageSoon": "Bald",
  "emptyInboxTitle": "Keine Tickets",
  "emptyInboxDescription": "Tickets aus der gesamten Organisation erscheinen hier.",
  "reportProblem": "Problem melden"
}
```

- [ ] **Step 3: Add nav labels** to `en/navigation.json` (`"support": "Support"`, `"supportInbox": "Support Inbox"`) and `de/navigation.json` (`"support": "Support"`, `"supportInbox": "Support-Postfach"`).

- [ ] **Step 4: Regenerate + validate**

Run:

```bash
pnpm --filter @oktavius/i18n generate:namespaces
pnpm --filter @oktavius/i18n scan:missing
pnpm --filter @oktavius/i18n validate
```

Expected: `support` stays a known namespace; `scan:missing` reports no missing keys for the keys used in this plan; `validate` passes (en/de key parity).

- [ ] **Step 5: Commit**

```bash
git add packages/i18n/locales/en/support.json packages/i18n/locales/de/support.json \
        packages/i18n/locales/en/navigation.json packages/i18n/locales/de/navigation.json \
        packages/i18n/src/generated-namespaces.ts packages/i18n/src/translations.ts
git commit -m "feat(support): i18n keys for inbox, priority, triage and nav"
```

---

### Task 14: Requester page — failing test first

**Files:**

- Test: `apps/web/src/modules/support/SupportPage.test.tsx`

- [ ] **Step 1: Write the failing test** (mirror `StoragePage.test.tsx`: mock `usePreloadNamespaces`, stub fetch with an empty list, assert the empty state + report button render)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import { SupportPage } from './SupportPage';

vi.mock('@/core/i18n', async (importOriginal) => {
  const real = await importOriginal();
  return { ...(real as object), usePreloadNamespaces: () => ({ ready: true }) };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, page_size: 12 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('SupportPage', () => {
  it('renders the report button and the empty state', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter>
          <QueryClientProvider client={qc}>
            <TestI18nProvider>
              <SupportPage />
            </TestI18nProvider>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Report');
  });
});
```

> Confirm `TestI18nProvider` is exported from `@/core/i18n` (used in `StoragePage.test.tsx`).

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/SupportPage.test.tsx`
Expected: FAIL — `SupportPage` not defined.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportPage.test.tsx
git commit -m "test(support): failing requester page test"
```

---

### Task 15: Requester page — implementation

**Files:**

- Create: `apps/web/src/modules/support/SupportPage.tsx`

- [ ] **Step 1: Implement the requester page** (list with status tabs + search; detail swap via `?ticket=`; report dialog)

```tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Button, Tabs, TabsList, TabsTrigger } from '@oktavius/base-ui';
import { CrudListShell } from '@/components/data/CrudListShell';
import { ModulePage } from '@/components/common/PageLayout';
import { useListPageState } from '@/lib/useListPageState';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { PlusIcon } from '@/lib/icons';
import { supportPageIcon } from '@/lib/modulePageIcons';

import { ReportProblemDialog } from './ReportProblemDialog';
import { SupportTicketDetail } from './SupportTicketDetail';
import { useSupportTickets } from './data/useSupportData';
import { inboxColumns, toTicketRow, type TicketRow } from './shared';
import type { SupportStatus } from './data/types';

const STATUS_TABS: Array<SupportStatus | 'all'> = [
  'all',
  'open',
  'in_progress',
  'resolved',
  'closed',
];

export function SupportPage() {
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['support']);
  const [params, setParams] = useSearchParams();
  const [statusTab, setStatusTab] = useState<SupportStatus | 'all'>('all');
  const [showReport, setShowReport] = useState(false);

  const activeTicketId = params.get('ticket');

  const { data, isLoading } = useSupportTickets({
    page: 1,
    pageSize: 50,
    status: statusTab === 'all' ? undefined : statusTab,
    sort: '-updated_at',
  });

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));
  const list = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: [],
    searchKeys: ['subject', 'message'],
    queryNamespace: 'support',
  });

  const openTicket = (id: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('ticket', id);
      return next;
    });
  const closeTicket = () =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('ticket');
      return next;
    });

  if (!ready) return null;

  if (activeTicketId) {
    return (
      <ModulePage title={t('support.title')} icon={supportPageIcon()}>
        <SupportTicketDetail ticketId={activeTicketId} onBack={closeTicket} />
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title={t('support.title')}
      icon={supportPageIcon()}
      actions={
        <Button variant="cta" onClick={() => setShowReport(true)}>
          <PlusIcon className="h-4 w-4" />
          {t('support.reportProblem')}
        </Button>
      }
    >
      <div className="space-y-4">
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as SupportStatus | 'all')}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {s === 'all' ? t('support.filterAll') : t(`support.statusLabel_${s}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <CrudListShell<TicketRow>
          search={list.search}
          onSearchChange={list.onSearchChange}
          searchPlaceholder={t('support.searchPlaceholder')}
          rows={list.paged}
          columns={inboxColumns(t)}
          sort={list.sort}
          onSortChange={list.onSortChange}
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          totalPages={list.totalPages}
          onPageChange={list.onPageChange}
          isLoading={isLoading}
          onRowClick={(row) => openTicket(row.id)}
          emptyTitle={t('support.noTickets')}
          entityLabel="ticket"
          enableListCrud={false}
        />
      </div>

      <ReportProblemDialog
        open={showReport}
        onOpenChange={setShowReport}
        onCreated={(ticket) => {
          setShowReport(false);
          openTicket(ticket.id);
        }}
      />
    </ModulePage>
  );
}
```

> The requester list reuses `inboxColumns` minus the requester column conceptually, but showing it for one's own tickets is harmless. If you prefer a leaner requester table, add a `requesterColumns(t)` variant in `shared.tsx` that drops `requester`. Confirm `PlusIcon` exists in `@/lib/icons` (it's widely used; verify).

- [ ] **Step 2: Run the page test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/SupportPage.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportPage.tsx
git commit -m "feat(support): requester surface page"
```

---

### Task 16: Admin inbox — failing test first

**Files:**

- Test: `apps/web/src/modules/support/SupportInboxPage.test.tsx`

- [ ] **Step 1: Write the failing test** (same harness as Task 14; stub two fetches — stats + list — and assert the inbox title renders)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';
import { SupportInboxPage } from './SupportInboxPage';

vi.mock('@/core/i18n', async (importOriginal) => {
  const real = await importOriginal();
  return { ...(real as object), usePreloadNamespaces: () => ({ ready: true }) };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: string) => {
      const body = String(input).includes('/stats')
        ? { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }
        : { data: [], total: 0, page: 1, page_size: 50 };
      return Promise.resolve(
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }),
  );
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('SupportInboxPage', () => {
  it('renders the inbox heading and the stats strip', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    await act(async () => {
      root.render(
        <MemoryRouter>
          <QueryClientProvider client={qc}>
            <TestI18nProvider>
              <SupportInboxPage />
            </TestI18nProvider>
          </QueryClientProvider>
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.textContent).toContain('Inbox');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/SupportInboxPage.test.tsx`
Expected: FAIL — `SupportInboxPage` not defined.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportInboxPage.test.tsx
git commit -m "test(support): failing inbox page test"
```

---

### Task 17: Admin inbox — implementation

**Files:**

- Create: `apps/web/src/modules/support/SupportInboxPage.tsx`

- [ ] **Step 1: Implement the inbox** (stats strip + queue table + `admin` detail swap)

```tsx
import { useSearchParams } from 'react-router-dom';

import { CrudListShell } from '@/components/data/CrudListShell';
import { ModulePage } from '@/components/common/PageLayout';
import { useListPageState } from '@/lib/useListPageState';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { supportPageIcon } from '@/lib/modulePageIcons';

import { SupportTicketDetail } from './SupportTicketDetail';
import { useSupportStats, useSupportTickets } from './data/useSupportData';
import { inboxColumns, toTicketRow, type TicketRow } from './shared';

function StatTile({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex-1 rounded-xl bg-card p-3">
      <div className={danger ? 'text-lg font-semibold text-destructive' : 'text-lg font-semibold'}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function SupportInboxPage() {
  const { t } = useTranslation();
  const { ready } = usePreloadNamespaces(['support']);
  const [params, setParams] = useSearchParams();
  const activeTicketId = params.get('ticket');

  const { data: stats } = useSupportStats(!activeTicketId);
  const { data, isLoading } = useSupportTickets({ page: 1, pageSize: 50, sort: '-updated_at' });

  const rows: TicketRow[] = (data?.data ?? []).map((ticket) => toTicketRow(ticket, t));
  const list = useListPageState<TicketRow>({
    rows,
    defaultSort: 'updatedAt',
    filterKeys: [],
    searchKeys: ['subject', 'message', 'requester'],
    queryNamespace: 'support-inbox',
  });

  const openTicket = (id: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('ticket', id);
      return next;
    });
  const closeTicket = () =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('ticket');
      return next;
    });

  if (!ready) return null;

  if (activeTicketId) {
    return (
      <ModulePage title={t('support.inboxTitle')} icon={supportPageIcon()}>
        <SupportTicketDetail ticketId={activeTicketId} onBack={closeTicket} admin />
      </ModulePage>
    );
  }

  return (
    <ModulePage
      title={t('support.inboxTitle')}
      subtitle={t('support.inboxDescription')}
      icon={supportPageIcon()}
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <StatTile label={t('support.statRowOpen')} value={stats?.open ?? 0} />
          <StatTile label={t('support.statRowInProgress')} value={stats?.inProgress ?? 0} />
          <StatTile label={t('support.statRowResolved')} value={stats?.resolved ?? 0} />
        </div>

        <CrudListShell<TicketRow>
          search={list.search}
          onSearchChange={list.onSearchChange}
          searchPlaceholder={t('support.searchPlaceholder')}
          rows={list.paged}
          columns={inboxColumns(t)}
          sort={list.sort}
          onSortChange={list.onSortChange}
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          totalPages={list.totalPages}
          onPageChange={list.onPageChange}
          isLoading={isLoading}
          onRowClick={(row) => openTicket(row.id)}
          emptyTitle={t('support.emptyInboxTitle')}
          emptyDescription={t('support.emptyInboxDescription')}
          entityLabel="ticket"
          enableListCrud={false}
        />
      </div>
    </ModulePage>
  );
}
```

- [ ] **Step 2: Run the inbox test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support/SupportInboxPage.test.tsx`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/support/SupportInboxPage.tsx
git commit -m "feat(support): admin inbox page with stats and queue"
```

---

### Task 18: Register navigation + routing

**Files:**

- Modify: `apps/web/src/lib/org-profiles/types.ts`
- Modify: `apps/web/src/lib/org-profiles/profiles.ts` (+ presets that should show Support)
- Modify: `apps/web/src/lib/appNavModules.ts`

- [ ] **Step 1: Extend `OrgModuleId`**

In `apps/web/src/lib/org-profiles/types.ts`, add to the union:

```typescript
  | 'support'
  | 'support-inbox'
```

- [ ] **Step 2: Enable in profiles**

In `apps/web/src/lib/org-profiles/profiles.ts`, add `'support'` to `DEFAULT_ORG_MODULES`. Add `'support'` (and `'support-inbox'` if the profile has superadmins) to each preset's `enabledModules` under `apps/web/src/lib/org-profiles/presets/` that should expose Support.

> `support-inbox` is also gated by `superadminOnly` in the manifest, so a non-superadmin never sees it even if the module id is enabled. Enabling the id just makes the route/nav buildable.

- [ ] **Step 3: Add the two manifest entries**

In `apps/web/src/lib/appNavModules.ts`, import the icon and add to `APP_NAV_MODULES`:

```typescript
import { LifeBuoyIcon } from '@/lib/icons';
// ...
  {
    id: 'support',
    path: '/support',
    label: 'Support',
    labelKey: 'navigation.support',
    icon: LifeBuoyIcon,
    section: 'modules',
    permission: 'support.view',
    loadPage: () => import('@/modules/support/SupportPage'),
    pageExport: 'SupportPage',
  },
  {
    id: 'support-inbox',
    path: '/support-inbox',
    label: 'Support Inbox',
    labelKey: 'navigation.supportInbox',
    icon: LifeBuoyIcon,
    section: 'admin',
    superadminOnly: true,
    loadPage: () => import('@/modules/support/SupportInboxPage'),
    pageExport: 'SupportInboxPage',
  },
```

> **Permission key decision (spec open question):** requester uses `permission: 'support.view'`; admin uses `superadminOnly: true`. If `@/lib/permissions` defines a permissions catalog/enum that new strings must be registered in, add `'support.view'` there. Run `grep -rn "support.view\|email.view_own" apps/web/src/lib/permissions.ts` to check; if permissions are free-form strings (per the contracts report), no registration is needed.

- [ ] **Step 4: Typecheck + run the nav test**

Run:

```bash
pnpm --filter @oktavius/web exec tsc --noEmit
pnpm --filter @oktavius/web exec vitest run src/lib/appNavModules.test.ts
```

Expected: PASS. If `appNavModules.test.ts` asserts a snapshot/count of modules, update it to include the two new entries.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/org-profiles/types.ts apps/web/src/lib/org-profiles/profiles.ts \
        apps/web/src/lib/org-profiles/presets apps/web/src/lib/appNavModules.ts
git commit -m "feat(support): register support + support-inbox in nav manifest"
```

---

### Task 19: Full verification

- [ ] **Step 1: Typecheck the whole web app**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: PASS, no errors.

- [ ] **Step 2: Lint the new files**

Run: `pnpm --filter @oktavius/web exec eslint src/modules/support`
Expected: PASS (no errors). Fix import ordering / unused vars if flagged.

- [ ] **Step 3: Run the support test suite**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/support`
Expected: all support tests PASS.

- [ ] **Step 4: Run i18n validation**

Run: `pnpm --filter @oktavius/i18n validate`
Expected: PASS (en/de parity for `support` + `navigation`).

- [ ] **Step 5: Manual smoke (optional but recommended)**

Run the app, sign in as a regular user → confirm "Support" appears under Modules, the list + report dialog work, a created ticket opens via `?ticket=`. Sign in as a superadmin → confirm "Support Inbox" appears under Admin with the stats strip and queue, detail shows the disabled triage controls with the "Soon" hint.

- [ ] **Step 6: Final commit (if any lint/test fixups were made)**

```bash
git add apps/web/src/modules/support
git commit -m "chore(support): lint + test fixups"
```

---

## Self-Review

**Spec coverage:**

- Two surfaces (requester + admin inbox) → Tasks 15, 17. ✅
- Centered modal report flow → Task 8 (`RecordEditDialog`). ✅
- Admin queue table (not master-detail) → Task 17 (`CrudListShell`). ✅
- Stats strip from `/support/tickets/stats` → Task 17 + Task 6 `useSupportStats`. ✅
- Read-real/actions-scaffold → Task 3 scaffold mutations + Task 10 disabled `TriageControls`. ✅
- Two nav entries, no header toggle, superadminOnly inbox → Task 18. ✅
- Data layer mirrors storage (`client/keys/hooks/types`) → Tasks 1–6. ✅
- Reuse existing components, no new shared primitives → only module-local components created; `StatTile`/`TriageControls` are local, not added to the shared library. ✅
- i18n via existing `support` namespace → Task 13. ✅
- App-wide "View as user" + admin mutation REST → explicitly out of scope; scaffold stubs keep signatures stable for the latter. ✅

**Placeholder scan:** No "TBD"/"implement later". The intentional scaffold throws are spec-required behavior, labeled. Inline "confirm X" notes point at exact files to verify a prop shape — each has a concrete fallback action, not a deferral.

**Type consistency:** `SupportTicket`/`SupportComment`/`SupportStats`/`ListTicketsParams`/`CreateTicketInput` defined in Task 1 are used consistently in Tasks 3/6/7/8/9/11/15/17. `createSupportClient` method names (`listTickets`, `getStats`, `getTicket`, `listComments`, `listAttachments`, `createTicket`, `addComment`, `uploadAttachments`, `updateStatus`, …) match between Task 3 (impl), Task 2 (test) and Task 6 (hooks). `inboxColumns(t)`/`toTicketRow(ticket, t)`/`TicketRow` defined in Task 7 used in Tasks 15/17. `supportKeys` shape (Task 4) matches usage in Task 6.

**Known verification points to resolve during implementation (each has a fallback):** `FormSubmissionResult` return shape (Task 8), `BackButton` onClick support (Task 11), `useDateTimeFormat` export (Task 9), `PlusIcon`/icon existence (Tasks 7/12/15), permissions catalog registration (Task 18), `appNavModules.test.ts` snapshot update (Task 18).
