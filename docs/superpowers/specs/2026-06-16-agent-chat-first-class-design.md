# Agent Chat → first-class feature (Scope B redesign + wiring)

**Date:** 2026-06-16
**Status:** Approved (design); ready for implementation plan
**Area:** `apps/web/src/components/layout` + `apps/web/src/components/agent` + `@oktavius/base-ui`

## Background

The V3 "Agent Chat on the side" was suspected to be legacy code that ignores the
shared component library. Investigation showed a more nuanced reality:

- The **shell** (`AIChatSidebar` + `OsirisChatShell`) is modern and largely
  on-system: resizable/collapsible sidebar, history panel, mobile layout, and
  three render modes (`page` / `sidebar` / `module`). It imports `Button`,
  `DropdownMenu`, `ScrollArea`, `MouseTooltip`, `cn`, `formatDisplayDateTime`
  from `@oktavius/base-ui`.
- The **drift** is concentrated in two places: the **composer toolbar** (raw
  `<button>` elements with one-off Tailwind and bespoke colored toggle states),
  and the **message/card surface**.
- The **backend seam already exists** but is dormant: `createApiAgentTransport`
  (`agentRuntime.ts`) does real SSE streaming and posts to
  `VITE_OKTAVIUS_AGENT_API_URL`. There is a rich message contract — 19 card
  kinds, confirmations, tool calls, a UI-component payload, and an
  `AgentTokenStats` type. The "mock" feel comes from (a) the env URL being
  unset, so `createConfiguredAgentTransport` returns `undefined`, and (b) an
  artificial `setTimeout(…, 900)` in `OsirisChatShell.submitDraft`.
- **Concrete gap:** `runAgentTurn` accepts `onStreamMessage` but drops it when
  invoking the transport (`agentRuntime.ts:214`), so streaming deltas never
  reach the UI even when a real API is connected.

**Goal:** make Agent Chat a first-class, properly wired product feature, keeping
the working shell, fixing the foundation, and redesigning only what drifted.

## Principle

Keep the shell that already works. Fix the foundation (component extraction +
backend wiring). Redesign only the composer extraction and the message/card
surface.

## Design

### 1. Keep as-is (no functional change)

The resizable/collapsible sidebar (`AIChatSidebar`), conversation history panel,
mobile layout (`MobileAgentLayout`), and the page/sidebar/module modes are good
and on-system. Untouched except the rename in §2.

### 2. Component-system alignment

- **Shared `IconToggle` primitive in `@oktavius/base-ui`** (the round on/off
  pill). Web-search, memory, mic, and model-mode trigger all consume this one
  component rather than the hand-rolled `<button>` + `cn(...)` blocks currently
  inline in the shell. It reproduces **today's exact look** (option A in
  brainstorming) and must support: ghost/idle, active (the current
  tinted+bordered state, including `info`/`accent`/neutral color variants), and
  disabled. The icon is passed as `children`, so the primitive has no app-icon
  dependency (mirrors the existing `CalendarViewSwitcher` pattern).
- **`ChatComposer` stays in apps/web** (`layout/ChatComposer`). It is already a
  reusable primitive with `leftControls`/`rightControls`/`bottomControls` slots;
  the drift is in the raw `<button>`s the shell passes into those slots, not in
  `ChatComposer` itself. Relocating it to base-ui is rejected because it imports
  app icons (`@/lib/icons`) that base-ui cannot import. The shell's toggles are
  refactored to use the new base-ui `IconToggle`.
- **Rename `OsirisChatShell` → `AgentChatShell`** and the file accordingly; drop
  the legacy "osiris" name. Update all imports (`AIChatSidebar`, route(s), any
  `page`/`module` mounts).
- **All four composer controls stay:** web-search toggle, memory/"brain"
  (instruction-update) toggle, model mode (Blitz/Default/Thinking), voice (mic /
  SpeechRecognition). Visuals unchanged; they become wired (§4).

### 3. Message + card surface redesign

Chosen treatment (brainstorming option: hybrid, assistant-flat):

- **User turns:** tinted bubble, right-aligned (current bubble style retained).
- **Assistant prose:** flat, full-width — **no** bubble.
- **Cards — light touch (keeps semantic tone).** A shared **borderless white
  tile** wrapper (`AgentCardTile`) matching the V3 surface aesthetic (white,
  soft shadow, no border) is applied to **neutral** cards (entity-list,
  entity-detail, project-summary, catalog-item, search-results, timeline,
  action-items, financial, schedule, planner, memory, context-dump,
  sales-document, document, email-compose). Cards where color carries meaning
  keep their existing semantic tone and are **not** wrapped: `AgentConfirmationCard`
  (warning/approved/rejected), `AgentSkillApprovalCard`, `AgentDocProcessingCard`
  (status), `AgentPythonExecutionCard` (error). This avoids double-wrapping
  (each card already renders its own container) and preserves signal.
- `AgentCardTile` is a thin presentational wrapper applied at the
  `renderAgentCard` call site for neutral kinds; the neutral card components have
  their own outer border/background removed so the tile is the single container.
- No new card kinds are introduced.

### 4. Finish backend wiring (the product layer)

- **Fix streaming:** thread `onStreamMessage` from `runAgentTurn` into the
  transport call (`agentRuntime.ts:214`) so SSE deltas reach the UI. The
  transport already supports streaming; the callback is simply not forwarded.
- **Wire composer state into the turn request:** `modelMode` → model param,
  `webSearchMode` flag, and the memory/instruction flag are all included in the
  request body sent to the agent API. Today they mutate local UI state only.
  Extend `AgentRuntimeRequest` to carry these.
- **Remove the artificial `setTimeout(…, 900)`** latency in `submitDraft` once
  real streaming is in place.
- **Token stats:** surface the existing `AgentTokenStats` (defined in `types.ts`,
  currently unused) in the UI (a small context/token indicator). The transport
  parses an optional `tokenStats` field from the stream/response if present and
  no-ops when absent — fully client-side, no backend dependency.
- **Confirmation & tool round-trips (deferred, needs API contract):** approving/
  rejecting a confirmation card currently only flips local status
  (`handleConfirmationRespond`). Posting the decision back requires the backend's
  confirmation endpoint shape, which is not yet known. This sub-task is **carved
  out of this plan** and added once the endpoint contract is provided; the
  client keeps a clear callback seam (`onConfirmationRespond`) so wiring it later
  touches only one function.

### Conversation storage (confirmed assumption)

Conversations stay in `localStorage` (`chatStorage`) for this round, behind the
existing typed interface (`loadStoredChatConversations` /
`storeChatConversations` / `trimChatConversations`). A clean seam is kept so a
future server-backed conversation store (create/list/rename/delete/messages) can
replace the storage adapter without touching the shell or UI. Server-backed
conversations are **explicitly out of scope** for this round.

## Out of scope

- No new card types.
- No shell/layout redesign (sidebar resize, history panel, mobile layout, modes).
- No auth/permission changes.
- No server-backed conversation persistence (see above).

## Components / units

| Unit                                     | Purpose                                                                                  | Depends on                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `IconToggle` (base-ui)                   | Round on/off control; idle/active/disabled; info/accent/neutral tones; icon via children | base-ui tokens, `cn`                                                  |
| `ChatComposer` (apps/web, stays put)     | Reusable composer input + toolbar slots                                                  | base-ui `cn`, app icons                                               |
| `AgentChatShell` (was `OsirisChatShell`) | Chat column + history orchestration; modes; toggles now use `IconToggle`                 | ChatComposer, IconToggle, AgentMessageList, chatStorage, agentRuntime |
| `AgentCardTile` (apps/web)               | Borderless-white-tile wrapper for **neutral** cards only                                 | base-ui surface tokens                                                |
| `AgentMessageList`                       | Routes user→bubble, assistant→flat, neutral cards→tile, semantic cards→keep tone         | AgentCardTile, renderAgentCard                                        |
| `agentRuntime`                           | Transport + `runAgentTurn`; forwards `onStreamMessage` + request enrichment              | AgentRuntimeRequest types                                             |

## Data flow

1. User submits draft → `submitDraft` builds an `AgentMessage` + enriched
   `AgentRuntimeRequest` (content, page snapshot, modelMode, webSearch, memory).
2. `runAgentTurn` → transport (real SSE when `VITE_OKTAVIUS_AGENT_API_URL` set),
   forwarding `onStreamMessage`.
3. Stream deltas append to the active conversation message; cards/confirmations
   arrive as structured `AgentMessage` payloads.
4. Confirmation approve/reject and tool results post back to the backend.
5. Conversations persisted to `localStorage` via the storage adapter (seam for
   future server store).

## Testing

- Unit: `ChatComposer` toggle states + onChange wiring; icon-toggle a11y
  (aria-pressed, disabled); `AgentCardTile` renders each `card.kind`.
- Unit: `runAgentTurn` forwards `onStreamMessage`; request body includes
  modelMode/webSearch/memory flags.
- Unit: `AgentMessageList` routes user→bubble, assistant→flat, card→tile.
- Integration: streamed turn renders incrementally (mock transport emitting
  SSE-style deltas); confirmation approve/reject posts back.
- Regression: sidebar resize/collapse, history panel, mobile layout unchanged.

## Migration notes

- Rename touches: `OsirisChatShell` file + symbol, `AIChatSidebar` import, any
  route/page/module mount of the shell.
- `setTimeout` removal must be gated on real streaming being wired, so the mock
  fallback path (`runAgentTurn` with no transport → "Agent runtime is not
  configured.") still degrades gracefully when the env URL is unset.
