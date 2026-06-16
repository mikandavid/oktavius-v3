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

- **`ChatComposer` primitive in `@oktavius/base-ui`** that reproduces **today's
  exact look** (the current colored active toggle states are intentionally
  preserved — chosen as option A in brainstorming), replacing the raw
  `<button>` markup currently inline in `OsirisChatShell`. Existing local
  `ChatComposer` (`layout/ChatComposer`) is promoted/generalized into base-ui.
- **Shared icon-toggle primitive** (the round on/off pill). Web-search, memory,
  mic, and model-mode trigger all consume this one component rather than
  hand-rolled `<button>` + `cn(...)` blocks. It must support: ghost/idle,
  active (the current tinted+bordered state, including the `info`/`accent`
  color variants), and disabled.
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
- **All 19 card kinds + confirmation cards:** render inside one shared
  **borderless white tile** wrapper (`AgentCardTile`) on the tinted wash,
  matching the V3 surface aesthetic (borderless white tiles, soft shadow, no
  border). This wrapper is the single shell every card type sits in;
  `AgentMessageList` routes each `card.kind` / `confirmation` / `ui` payload
  into it.
- No new card kinds are introduced; existing card renderers move inside the
  shared tile wrapper.

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
- **Confirmation & tool round-trips:** approving/rejecting a confirmation card
  and returning tool results post back to the backend, not just mutate local
  message state (`handleConfirmationRespond` currently only flips local status).
- **Token stats:** surface the existing `AgentTokenStats` (defined in `types.ts`,
  currently unused) in the UI (e.g. context-usage / token indicator), fed from
  the stream/response.

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

| Unit                                     | Purpose                                                                            | Depends on                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `ChatComposer` (base-ui)                 | Reusable composer input + toolbar, current look                                    | icon-toggle primitive, base-ui Button/DropdownMenu        |
| icon-toggle primitive (base-ui)          | Round on/off control with idle/active/disabled states                              | base-ui tokens                                            |
| `AgentChatShell` (was `OsirisChatShell`) | Chat column + history orchestration; page/sidebar/module modes                     | ChatComposer, AgentMessageList, chatStorage, agentRuntime |
| `AgentCardTile`                          | Single borderless-white-tile wrapper for all card/confirmation/ui payloads         | base-ui surface tokens                                    |
| `AgentMessageList`                       | Routes messages → bubble (user) / flat prose (assistant) / `AgentCardTile` (cards) | AgentCardTile                                             |
| `agentRuntime`                           | Transport + `runAgentTurn`; streaming + request enrichment                         | AgentRuntimeRequest types                                 |

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
