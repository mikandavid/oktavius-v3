# Support Triage — Frontend Design

**Date:** 2026-06-16
**Scope:** Frontend-only (oktavius-v3 `apps/web`), wired to a defined API contract
**Module:** `apps/web/src/modules/support`
**Status:** Approved for spec review

## Problem

The V3 Support module already lets users **create** tickets, **read** the thread, **reply**, and handle **attachments** end-to-end against the real osiris backend. But nobody can actually _handle_ a ticket: the four triage actions (`updateStatus`, `updatePriority`, `assign`, `resolve`) all `throw 'NOT_IMPLEMENTED'` in `supportClient.ts`, and `TriageControls.tsx` renders status/assignee as `disabled` controls with a "Soon" badge. The reason is upstream: `osiris_erp` `support.routes.ts` exposes only GET/POST for tickets, comments, and attachments — there is no PATCH/PUT/resolve endpoint. The triage business logic exists in the osiris service (used by agent-tools and the legacy `/superadmin/support-tickets` UI), it is simply not surfaced over REST.

This spec covers the **frontend** work to make tickets fully handleable by superadmins, built against an agreed API contract so it works the moment osiris ships the endpoints. The osiris REST implementation is a separate, out-of-scope effort.

## Goals

1. Superadmins can change a ticket's **status**, **priority**, and **assignee**, and **resolve** it with a resolution message.
2. Superadmins can post **internal notes** (hidden from the requester).
3. Superadmins see **automation status** (PR/branch/run) read-only on the ticket.
4. Requesters and superadmins get an **unread/activity indicator** on inbox rows (frontend-only slice of "notifications").
5. The triage UI conforms to the V3 design system, including fixing an existing design violation in `TriageControls.tsx`.

## Non-goals (named, not silent)

- The osiris REST endpoint implementation (separate backend effort).
- Real email/push requester notifications (inherently backend).
- Server-side pagination/filtering (list remains a client-side filter over the 50-row server cap).

## Decisions (from brainstorming)

- **Contract approach:** define the contract and **wire real calls**. Until osiris ships the endpoints, triage actions surface a clean error via `appToast.fromApiError`. Tests run against a mocked client, so all behavior is verifiable now.
- **Assignee source:** superadmins only.
- **Extra scope included:** internal notes, automation status (read-only), and the unread-indicator slice of requester notifications.

## API contract (frontend defines; osiris must match)

All routes are under the existing `/support` base. Admin-gated routes require the same permission level the legacy superadmin board uses (`support.write` plus superadmin context).

| Method  | Endpoint                        | Request body                                                                              | Response                                                                                                                                                            | Perm            |
| ------- | ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| `PATCH` | `/support/tickets/:id`          | `{ status?: SupportStatus, priority?: SupportPriority, assigneeUserId?: string \| null }` | updated ticket                                                                                                                                                      | admin           |
| `POST`  | `/support/tickets/:id/resolve`  | `{ resolutionMessage: string }`                                                           | updated ticket (`status = resolved`); a resolution comment is appended server-side                                                                                  | admin           |
| `POST`  | `/support/tickets/:id/comments` | **extended:** `{ message: string, isInternal?: boolean }`                                 | created comment (includes `is_internal`)                                                                                                                            | `support.write` |
| `GET`   | `/support/tickets/:id/comments` | —                                                                                         | each comment now includes `is_internal: boolean`                                                                                                                    | `support.view`  |
| `GET`   | `/support/assignees`            | —                                                                                         | `{ data: Array<{ userId: string, name: string, email: string }> }` (eligible superadmins)                                                                           | admin           |
| `GET`   | `/support/tickets/:id`          | —                                                                                         | **already returns** `automation_status`, `automation_pr_url`, `automation_branch_name`, `automation_workflow_run_url`, `automation_error` — frontend just maps them | `support.view`  |

Notes:

- `PATCH` accepts any subset of the three fields; each triage control sends a single-field patch.
- `assigneeUserId: null` clears the assignee.
- The resolve endpoint is distinct from a plain `PATCH status=resolved` because it also records the resolution message in the thread.

## Architecture

The change extends the existing module; it does not restructure it. The module already splits into `data/` (client + react-query hooks + key factory + types) and presentation components, with `shared.tsx` holding variant maps and transformers. We follow that layout.

### Data layer (`apps/web/src/modules/support/data/`)

- **`supportClient.ts`** — replace the four `throw SCAFFOLD` stubs with real implementations:
  - `updateStatus(id, status)` → `PATCH /tickets/:id` `{ status }`
  - `updatePriority(id, priority)` → `PATCH /tickets/:id` `{ priority }`
  - `assign(id, assigneeUserId | null)` → `PATCH /tickets/:id` `{ assigneeUserId }`
  - `resolve(id, resolutionMessage)` → `POST /tickets/:id/resolve` `{ resolutionMessage }`
  - `addComment(id, message, isInternal?)` → extend existing method to pass `isInternal` in the body
  - `listAssignees()` → `GET /support/assignees`, normalized
  - Add a `patchJson` helper (mirrors `postJson`) for PATCH requests.
  - `normalizeTicket` — map the automation fields (`automationStatus`, `automationPrUrl`, `automationBranchName`, `automationWorkflowRunUrl`, `automationError`).
  - `normalizeComment` — map `isInternal` from `is_internal`.
- **`types.ts`** — extend `SupportTicket` with the automation fields; extend `SupportComment` with `isInternal: boolean`; add `SupportAssignee` type.
- **`supportKeys.ts`** — add `assignees(orgId)` key.
- **`useSupportData.ts`**:
  - `useSupportMutations` — add `updateStatus`, `updatePriority`, `assign`, `resolve` mutations; extend the comment mutation to accept `isInternal`. Each `onSuccess` invalidates the relevant ticket/list/comment/stats keys; each `onError` is surfaced via `appToast.fromApiError` (no try/catch in components). Success toasts via `appToast.success` using `support.json` strings.
  - `useSupportAssignees` — `useQuery` wrapping `listAssignees`, enabled only for superadmins.
- **`useSupportUnread.ts`** (new) — localStorage-backed last-seen map keyed by ticket id. Exposes `isUnread(ticket)` (true when `ticket.updatedAt` is newer than the stored last-seen) and `markSeen(ticketId)`. No backend dependency.

### Components

- **`TriageControls.tsx`** (rewrite, superadmin-only):
  - **Fix the design violation:** the current root uses `rounded-card border border-border bg-card` — replace with a borderless `SectionCard` (V3 surface aesthetic: borderless white tile, no border/shadow).
  - Status `Combobox` (enabled, options from `STATUSES_FOR_UI`) → `updateStatus`.
  - Priority `Combobox` (enabled) → `updatePriority`.
  - Assignee `Combobox` (options from `useSupportAssignees`, clearable to unassign) → `assign`.
  - A **Resolve** button (`outline` variant — not `cta`, which is reserved for page entry points) opening a `ConfirmActionDialog` containing a resolution-message textarea; confirm → `resolve`. Disabled/hidden when the ticket is already resolved/closed.
  - Remove the "Soon" badges.
- **`AutomationPanel.tsx`** (new, detail aside, superadmin-only): read-only. Renders only when `automationStatus` is present and not `not_requested`. Shows a `StatusBadge` for the automation status plus links to the PR and workflow run when available, and the error text when `failed`. Borderless tile.
- **`SupportTicketThread.tsx`** (extend):
  - Render internal-note comments with a distinct tinted treatment (transparent tinted surface, per V3 alert aesthetic) and a lock icon from `@/lib/icons`.
  - Composer: superadmin-only "Internal note" toggle (`Switch` or checkbox) that sets `isInternal` on send. Non-superadmins never see internal notes or the toggle.
- **`IssueRow.tsx`** (extend): show an unread dot (leading) when `useSupportUnread().isUnread(ticket)`.
- **`SupportTicketDetail.tsx`** (extend): call `markSeen(ticketId)` on mount/open; mount `AutomationPanel` in the aside above/below `TriageControls`.

### Data flow

1. Superadmin opens a ticket (`?ticket=<id>`), `SupportTicketDetail` calls `markSeen`, fetches ticket + comments + (superadmin) assignees + automation fields.
2. Changing a control fires the matching mutation → optimistic-free PATCH/POST → on success, react-query invalidates ticket/list/stats so the row, badges, and inbox reflect the change; `appToast` confirms.
3. Resolve opens `ConfirmActionDialog`; confirming posts the resolution message; the thread re-fetches and shows the resolution comment; status flips to resolved.
4. Internal note: composer toggle sets `isInternal`; on send the thread re-fetches and renders it distinctly; requesters never receive it.

## Error handling

- All mutations route failures through `appToast.fromApiError` via the hook's `onError`. Components do not try/catch.
- Until osiris ships the endpoints, triage calls return non-OK; the existing `readErrorMessage` produces a clean message and the toast shows it. No crash, no broken state.
- `useSupportAssignees` is gated on superadmin; a failed assignee fetch leaves the assignee `Combobox` empty with its placeholder, other controls unaffected.

## Design-system compliance

- Borderless `SectionCard` tiles — no `border`/`shadow` on card surfaces (fixes the `TriageControls` violation).
- `Combobox` everywhere (never `Select`).
- `ConfirmActionDialog` for resolve — no native `window.confirm`.
- `StatusBadge` + existing `STATUS_VARIANT` / `PRIORITY_VARIANT` maps from `shared.tsx`; no ad-hoc badges.
- Icons only from `@/lib/icons`.
- All user-facing strings in `packages/i18n/locales/{en,de}/support.json`.
- Internal-note surface uses the transparent tinted treatment consistent with V3 alerts.
- No cross-module imports; assignee data comes from the support client, not the members module.

## Testing

Vitest with a mocked `supportClient` and pre-seeded react-query client (the established module test pattern):

- `supportClient.test.ts` — `updateStatus`/`updatePriority`/`assign` issue the correct `PATCH /tickets/:id` with the right single-field body; `resolve` posts to `/tickets/:id/resolve`; `addComment` forwards `isInternal`; `listAssignees` normalizes; `normalizeTicket` maps automation fields; `normalizeComment` maps `isInternal`.
- `useSupportData.test.tsx` — each mutation invalidates the expected keys on success and triggers `appToast` paths; `useSupportAssignees` only fetches for superadmins.
- `TriageControls.test.tsx` (new) — renders enabled controls (no "Soon"); selecting status/priority/assignee fires the matching mutation; Resolve opens the dialog and confirming calls `resolve`; controls hidden/disabled when already resolved.
- `SupportTicketThread.test.tsx` (new/extend) — internal notes render distinctly; the composer toggle is superadmin-only and sets `isInternal`; non-superadmins never see internal notes.
- `AutomationPanel.test.tsx` (new) — renders only when automation has run; shows PR/run links and error text appropriately.
- `useSupportUnread.test.ts` (new) — `isUnread` true when `updatedAt > lastSeen`; `markSeen` clears it; persists to localStorage.
- `IssueRow.test.tsx` (extend) — unread dot shows/hides per `useSupportUnread`.

## Files touched

```
apps/web/src/modules/support/
├── data/
│   ├── supportClient.ts        (impl mutations + patchJson + listAssignees + normalize automation/isInternal)
│   ├── types.ts                (automation fields, isInternal, SupportAssignee)
│   ├── supportKeys.ts          (assignees key)
│   ├── useSupportData.ts       (mutations + useSupportAssignees)
│   ├── useSupportUnread.ts     (new)
│   └── *.test.{ts,tsx}         (extend/new)
├── TriageControls.tsx          (rewrite: enable, fix design violation, resolve dialog)
├── AutomationPanel.tsx         (new)
├── SupportTicketThread.tsx     (internal notes render + composer toggle)
├── SupportTicketDetail.tsx     (markSeen, mount AutomationPanel)
├── IssueRow.tsx                (unread dot)
└── *.test.tsx                  (new/extend per Testing)
packages/i18n/locales/en/support.json   (new strings)
packages/i18n/locales/de/support.json   (new strings)
```

## Concurrency note

Branch `FE` carries simultaneous agent streams and lint-staged stashing can clobber uncommitted work. Stage only the files this work touches and commit in focused increments.
