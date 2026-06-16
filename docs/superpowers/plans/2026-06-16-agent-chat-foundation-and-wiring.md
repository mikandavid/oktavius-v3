# Agent Chat Foundation & Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the agent-chat composer's bespoke raw `<button>` toggles with a shared base-ui `IconToggle`, drop the legacy `Osiris` shell name, and finish the dormant backend wiring (forward streaming deltas; send composer state in the turn request).

**Architecture:** A new pure `IconToggle` primitive lands in `@oktavius/base-ui` (icon passed as `children`, no app-icon dependency — mirrors `CalendarViewSwitcher`). The shell `OsirisChatShell` is renamed to `AgentChatShell` and its composer toolbar adopts `IconToggle`. The runtime (`agentRuntime.ts`) is fixed to forward `onStreamMessage` to the transport and to carry `modelMode` / `webSearch` / `memory` in the POST body; the shell threads its composer state through and drops the artificial `setTimeout`.

**Tech Stack:** React 19 + TypeScript, Tailwind (+ `cn` from base-ui), Vitest + @testing-library/react, pnpm monorepo (`apps/web`, `packages/base-ui`).

**Out of scope (separate follow-up plan):** `AgentCardTile` + neutral-card reflow; token-stats indicator; confirmation/tool POST-back (needs the backend confirmation endpoint contract). See the spec at `docs/superpowers/specs/2026-06-16-agent-chat-first-class-design.md`.

---

## File Structure

- Create: `packages/base-ui/src/components/icon-toggle.tsx` — pure round on/off control.
- Create: `packages/base-ui/src/components/icon-toggle.test.tsx` — unit tests.
- Modify: `packages/base-ui/src/index.ts` — export the new component.
- Rename: `apps/web/src/components/layout/OsirisChatShell.tsx` → `AgentChatShell.tsx` (symbol `OsirisChatShell` → `AgentChatShell`, type `OsirisChatShellProps` → `AgentChatShellProps`).
- Modify: every import site of the shell (see Task 2).
- Modify: `apps/web/src/components/agent/agentRuntime.ts` — forward `onStreamMessage`; extend `AgentRuntimeRequest`; include new fields in POST body.
- Test: `apps/web/src/components/agent/agentRuntime.test.ts` — runtime behavior.

---

## Task 1: `IconToggle` primitive in base-ui

**Files:**

- Create: `packages/base-ui/src/components/icon-toggle.tsx`
- Test: `packages/base-ui/src/components/icon-toggle.test.tsx`
- Modify: `packages/base-ui/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/base-ui/src/components/icon-toggle.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconToggle } from './icon-toggle';

describe('IconToggle', () => {
  it('reflects pressed state via aria-pressed', () => {
    render(
      <IconToggle pressed bordered tone="info" aria-label="Web search">
        <svg data-testid="icn" />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Web search' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('applies the info tone classes when pressed', () => {
    render(
      <IconToggle pressed bordered tone="info" aria-label="Web search">
        <svg />
      </IconToggle>,
    );
    expect(screen.getByRole('button', { name: 'Web search' }).className).toContain('text-info');
  });

  it('uses idle classes when not pressed', () => {
    render(
      <IconToggle bordered tone="info" aria-label="Web search">
        <svg />
      </IconToggle>,
    );
    const btn = screen.getByRole('button', { name: 'Web search' });
    expect(btn.className).toContain('text-muted-foreground');
    expect(btn.className).not.toContain('text-info');
  });

  it('fires onClick and respects disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <IconToggle aria-label="Attach" onClick={onClick}>
        <svg />
      </IconToggle>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <IconToggle aria-label="Attach" disabled onClick={onClick}>
        <svg />
      </IconToggle>,
    );
    await user.click(screen.getByRole('button', { name: 'Attach' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/icon-toggle.test.tsx`
Expected: FAIL — `Failed to resolve import "./icon-toggle"` / `IconToggle is not defined`.

- [ ] **Step 3: Write minimal implementation**

Create `packages/base-ui/src/components/icon-toggle.tsx`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/utils';

export type IconToggleTone = 'neutral' | 'info' | 'accent';

export interface IconToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** When true, renders the active/pressed tone and sets aria-pressed. */
  pressed?: boolean;
  /** Tone used while pressed. Defaults to 'neutral'. */
  tone?: IconToggleTone;
  /** Render a border ring (matches the web-search / memory toggles). */
  bordered?: boolean;
  children: ReactNode;
}

const PRESSED_TONE: Record<IconToggleTone, string> = {
  neutral: 'bg-muted text-foreground',
  info: 'border-info bg-info/10 text-info hover:bg-info/15 hover:text-info',
  accent: 'border-accent bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent',
};

/** Round 28px icon control used in the agent composer toolbar. Icon passed as children. */
export function IconToggle({
  pressed = false,
  tone = 'neutral',
  bordered = false,
  className,
  type = 'button',
  children,
  ...props
}: IconToggleProps) {
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40',
        bordered && 'border',
        pressed
          ? PRESSED_TONE[tone]
          : cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground',
              bordered && 'border-transparent',
            ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/base-ui exec vitest run src/components/icon-toggle.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Export from the barrel**

In `packages/base-ui/src/index.ts`, add this line in alphabetical position (between `./components/file-input` and `./components/inline-edit`):

```ts
export * from './components/icon-toggle';
```

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm --filter @oktavius/base-ui exec tsc --noEmit`
Expected: no errors.

```bash
git add packages/base-ui/src/components/icon-toggle.tsx packages/base-ui/src/components/icon-toggle.test.tsx packages/base-ui/src/index.ts
git commit -m "feat(base-ui): add IconToggle primitive for agent composer"
```

---

## Task 2: Rename `OsirisChatShell` → `AgentChatShell`

This is a mechanical rename. The shell file/symbol/type are renamed and every reference updated. Known reference sites (from codebase search):

- `apps/web/src/components/layout/OsirisChatShell.tsx` — definition (function `OsirisChatShell`, type `OsirisChatShellProps`).
- `apps/web/src/components/layout/AIChatSidebar.tsx:9` — `import { OsirisChatShell } from './OsirisChatShell';` and usage `<OsirisChatShell mode="sidebar" ... />`.
- `apps/web/src/components/agent/ModuleScopedAssistantPanel.tsx` — import + `mode="module"` usage.
- `apps/web/src/modules/ai-chat/AIChatPage.tsx:1` — import + `mode="page"` usage.
- `apps/web/src/components/detail/EntityDetailWorkspaceTabs.test.tsx` — `vi.mock(...)` of the shell module.

**Files:**

- Rename: `apps/web/src/components/layout/OsirisChatShell.tsx` → `apps/web/src/components/layout/AgentChatShell.tsx`
- Modify: the four reference sites above.

- [ ] **Step 1: Rename the file (preserve history)**

```bash
git mv apps/web/src/components/layout/OsirisChatShell.tsx apps/web/src/components/layout/AgentChatShell.tsx
```

- [ ] **Step 2: Rename the symbol and type inside the file**

In `apps/web/src/components/layout/AgentChatShell.tsx`:

- `type OsirisChatShellProps = {` → `type AgentChatShellProps = {`
- `export function OsirisChatShell({ mode, className, onCloseHistory }: OsirisChatShellProps) {` → `export function AgentChatShell({ mode, className, onCloseHistory }: AgentChatShellProps) {`

- [ ] **Step 3: Find every remaining reference**

Run: `grep -rn "OsirisChatShell" apps/web/src`
Expected: matches only in the 4 reference sites listed above (AIChatSidebar, ModuleScopedAssistantPanel, AIChatPage, EntityDetailWorkspaceTabs.test). The definition file should no longer match.

- [ ] **Step 4: Update each reference site**

For each file, replace both the import specifier and the import path, and the JSX/mock usage:

- Import: `import { OsirisChatShell } from './OsirisChatShell';` → `import { AgentChatShell } from './AgentChatShell';` (in `AIChatSidebar.tsx`); use the correct relative/alias path that the file currently uses for the other sites (e.g. `@/components/layout/AgentChatShell`).
- JSX: `<OsirisChatShell ` → `<AgentChatShell `.
- In `EntityDetailWorkspaceTabs.test.tsx`: update `vi.mock('…/OsirisChatShell', …)` path to `…/AgentChatShell` and the mocked export name `OsirisChatShell` → `AgentChatShell`.

Re-run: `grep -rn "OsirisChatShell" apps/web/src`
Expected: no matches.

- [ ] **Step 5: Typecheck + run affected tests**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors.
Run: `pnpm --filter @oktavius/web exec vitest run src/components/detail/EntityDetailWorkspaceTabs.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/layout/AgentChatShell.tsx apps/web/src/components/layout/AIChatSidebar.tsx apps/web/src/components/agent/ModuleScopedAssistantPanel.tsx apps/web/src/modules/ai-chat/AIChatPage.tsx apps/web/src/components/detail/EntityDetailWorkspaceTabs.test.tsx
git commit -m "refactor(agent): rename OsirisChatShell to AgentChatShell"
```

---

## Task 3: Adopt `IconToggle` in the composer toolbar

Replace the four hand-rolled `<button>` toggles in the composer `bottomControls`/`rightControls` of `AgentChatShell.tsx` with `IconToggle`. The model-mode `DropdownMenu` trigger is intentionally left as-is (it is a text+caret menu trigger, not an icon toggle).

**Files:**

- Modify: `apps/web/src/components/layout/AgentChatShell.tsx`

- [ ] **Step 1: Add `IconToggle` to the base-ui import**

In `AgentChatShell.tsx`, add `IconToggle` to the existing `@oktavius/base-ui` import block (alphabetically near the other named imports):

```tsx
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  formatDisplayDateTime,
  IconToggle,
  MouseTooltip,
  ScrollArea,
} from '@oktavius/base-ui';
```

- [ ] **Step 2: Replace the voice (mic) `rightControls` button**

Replace the `rightControls` `<button>` (the mic control wrapped in `MouseTooltip`) with:

```tsx
rightControls={
  <MouseTooltip content={isVoiceRecording ? 'Stop voice input' : 'Start voice input'}>
    <IconToggle
      pressed={isVoiceRecording}
      tone="neutral"
      onClick={toggleVoiceInput}
      tabIndex={-1}
      aria-label={isVoiceRecording ? 'Stop voice input' : 'Start voice input'}
      className={cn(
        isVoiceRecording && 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      )}
    >
      <MicIcon size={14} />
    </IconToggle>
  </MouseTooltip>
}
```

- [ ] **Step 3: Replace the attach button in `bottomControls`**

Replace the attach `<button>` with:

```tsx
<IconToggle
  onClick={() => fileInputRef.current?.click()}
  disabled={isAssistantPending}
  tabIndex={-1}
  aria-label="Attach file"
  title="Attach file"
>
  <PaperclipIcon size={14} />
</IconToggle>
```

- [ ] **Step 4: Replace the web-search toggle**

Replace the web-search `<button>` with:

```tsx
<IconToggle
  bordered
  tone="info"
  pressed={webSearchMode}
  onClick={() => setWebSearchMode((current) => !current)}
  disabled={isAssistantPending}
  aria-label="Web search mode"
  title="Web search mode"
>
  <GlobeIcon size={14} />
</IconToggle>
```

- [ ] **Step 5: Replace the instruction/memory toggle**

Replace the "brain" `<button>` with:

```tsx
<IconToggle
  bordered
  tone="accent"
  pressed={instructionUpdateMode}
  onClick={() => setInstructionUpdateMode((current) => !current)}
  disabled={isAssistantPending}
  aria-label="Instruction update mode"
  title="Instruction update mode"
>
  <BrainIcon size={14} />
</IconToggle>
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors. (If `cn` is now unused after the edits, remove it from the import; if still used elsewhere in the file, leave it.)

- [ ] **Step 7: Visual smoke test**

Run: `pnpm --filter @oktavius/web dev`
Open the app, expand the agent chat sidebar. Confirm: attach/mic are ghost icons; web-search toggles to a blue tinted bordered state; memory toggles to a purple/accent tinted bordered state; all disable while a turn is pending. Appearance must match the pre-change look.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/layout/AgentChatShell.tsx
git commit -m "refactor(agent): use base-ui IconToggle in composer toolbar"
```

---

## Task 4: Forward streaming deltas in `runAgentTurn`

`runAgentTurn` accepts `onStreamMessage` but drops it when calling the transport, so SSE deltas never reach the UI. Forward it.

**Files:**

- Modify: `apps/web/src/components/agent/agentRuntime.ts`
- Test: `apps/web/src/components/agent/agentRuntime.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/agent/agentRuntime.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';

import { runAgentTurn } from './agentRuntime';
import type { AgentPageContextSnapshot } from './page-routing';

const SNAPSHOT = { moduleLabel: '', routeLabel: '' } as unknown as AgentPageContextSnapshot;

describe('runAgentTurn', () => {
  it('forwards onStreamMessage to the transport', async () => {
    const onStreamMessage = vi.fn();
    const transport = vi.fn((request: { onStreamMessage?: (m: unknown) => void }) => {
      request.onStreamMessage?.({ id: 'a1', role: 'assistant', createdAt: 'now', content: 'hi' });
      return Promise.resolve([
        { id: 'a1', role: 'assistant' as const, createdAt: 'now', content: 'hi' },
      ]);
    });

    await runAgentTurn({
      content: 'hello',
      createdAt: 'now',
      pageSnapshot: SNAPSHOT,
      onStreamMessage,
      transport,
    });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(onStreamMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a1', content: 'hi' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/agent/agentRuntime.test.ts`
Expected: FAIL — `onStreamMessage` not called (transport invoked without it).

- [ ] **Step 3: Forward the callback**

In `apps/web/src/components/agent/agentRuntime.ts`, change the `transport` branch of `runAgentTurn`:

```ts
export async function runAgentTurn({
  content,
  createdAt,
  pageSnapshot,
  onStreamMessage,
  transport,
}: RunAgentTurnOptions): Promise<AgentMessage[]> {
  if (transport) {
    return transport({ content, createdAt, pageSnapshot, onStreamMessage });
  }

  void content;

  return appendPageContext(
    [
      {
        id: `assistant_unconfigured_${createdAt}`,
        role: 'assistant',
        createdAt,
        content: 'Agent runtime is not configured.',
      },
    ],
    pageSnapshot,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/agent/agentRuntime.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/agent/agentRuntime.ts apps/web/src/components/agent/agentRuntime.test.ts
git commit -m "fix(agent): forward onStreamMessage to transport in runAgentTurn"
```

---

## Task 5: Carry composer state (`modelMode`/`webSearch`/`memory`) in the turn request

Extend the request type and the API transport body so the composer toggles actually reach the backend.

**Files:**

- Modify: `apps/web/src/components/agent/agentRuntime.ts`
- Test: `apps/web/src/components/agent/agentRuntime.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `apps/web/src/components/agent/agentRuntime.test.ts`:

```ts
import { createApiAgentTransport } from './agentRuntime';

describe('createApiAgentTransport request body', () => {
  it('includes modelMode, webSearch and memory flags', async () => {
    const fetcher = vi.fn(async (_url: string, init: { body: string }) => {
      return new Response(JSON.stringify({ messages: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const transport = createApiAgentTransport({ endpoint: 'https://api.test/agent', fetcher });
    await transport({
      content: 'hi',
      createdAt: 'now',
      pageSnapshot: { moduleLabel: '', routeLabel: '' } as unknown as AgentPageContextSnapshot,
      modelMode: 'thinking',
      webSearch: true,
      memory: false,
    });

    const body = JSON.parse(fetcher.mock.calls[0]![1].body) as Record<string, unknown>;
    expect(body.modelMode).toBe('thinking');
    expect(body.webSearch).toBe(true);
    expect(body.memory).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/agent/agentRuntime.test.ts`
Expected: FAIL — `body.modelMode` is `undefined` (fields not sent), and a TS error on the unknown request props.

- [ ] **Step 3: Extend the request type**

In `agentRuntime.ts`, import the mode type and extend `AgentRuntimeRequest`:

```ts
import type { AgentPageContextSnapshot } from './page-routing';
import type { AgentMessage, AgentModelMode } from './types';

export type AgentRuntimeRequest = {
  content: string;
  createdAt: string;
  pageSnapshot: AgentPageContextSnapshot;
  modelMode?: AgentModelMode;
  webSearch?: boolean;
  memory?: boolean;
  onStreamMessage?: (message: AgentMessage) => void;
};
```

- [ ] **Step 4: Include the fields in the POST body**

In `createApiAgentTransport`, update the destructure and body:

```ts
return async ({ content, createdAt, pageSnapshot, modelMode, webSearch, memory, onStreamMessage }) => {
  const resolvedFetcher = fetcher ?? getDefaultFetcher();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
  const response = await resolvedFetcher(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, createdAt, pageSnapshot, modelMode, webSearch, memory }),
  });
  // …unchanged below…
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/components/agent/agentRuntime.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/agent/agentRuntime.ts apps/web/src/components/agent/agentRuntime.test.ts
git commit -m "feat(agent): send modelMode/webSearch/memory in turn request"
```

---

## Task 6: Thread composer state through the shell and drop the fake latency

Wire the shell's existing `modelMode` / `webSearchMode` / `instructionUpdateMode` state into the `runAgentTurn` call and remove the artificial `setTimeout(…, 900)` wrapper.

**Files:**

- Modify: `apps/web/src/components/layout/AgentChatShell.tsx`

- [ ] **Step 1: Pass the flags into `runAgentTurn` and remove the timeout wrapper**

In `AgentChatShell.tsx` `submitDraft`, replace the `window.setTimeout(() => { … runAgentTurn({ … }) … }, 900)` block with a direct call that includes the composer state:

```tsx
const pageSnapshot = captureAgentPageContext(document, window.location.href, pageContext);
void runAgentTurn({
  content,
  createdAt: new Date().toISOString(),
  pageSnapshot,
  modelMode,
  webSearch: webSearchMode,
  memory: instructionUpdateMode,
  transport: agentTransport,
  onStreamMessage: (streamed) => {
    if (targetConversationId) {
      appendToConversation(targetConversationId, [streamed]);
    }
  },
})
  .then((followUp) => {
    if (targetConversationId) {
      appendToConversation(targetConversationId, followUp);
    }
  })
  .catch((error: unknown) => {
    appToast.fromApiError(error, 'Oktavius could not complete the request.');
  })
  .finally(() => {
    setIsAssistantPending(false);
    const viewport = scrollRef.current?.parentElement;
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  });
```

Keep the immediate `window.setTimeout(() => { …scroll… }, 0)` scroll-to-bottom call that follows — only the 900ms turn-delay wrapper is removed.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors. (`runAgentTurn` now accepts `onStreamMessage`, so streaming deltas append live.)

- [ ] **Step 3: Smoke test the unconfigured path**

With `VITE_OKTAVIUS_AGENT_API_URL` unset, run `pnpm --filter @oktavius/web dev`, open the chat, send a message. Expected: `agentTransport` is `undefined`, so `runAgentTurn` returns the graceful "Agent runtime is not configured." assistant message immediately (no crash, no 900ms stall).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/AgentChatShell.tsx
git commit -m "feat(agent): thread composer state into turn, drop fake latency"
```

---

## Task 7: Full verification pass

- [ ] **Step 1: base-ui tests + typecheck**

Run: `pnpm --filter @oktavius/base-ui exec vitest run`
Run: `pnpm --filter @oktavius/base-ui exec tsc --noEmit`
Expected: all pass, no type errors.

- [ ] **Step 2: web tests + typecheck + lint**

Run: `pnpm --filter @oktavius/web exec vitest run`
Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Run: `pnpm --filter @oktavius/web exec eslint src/components/agent src/components/layout`
Expected: all pass.

- [ ] **Step 3: Confirm no legacy name remains**

Run: `grep -rn "OsirisChatShell" apps/web/src`
Expected: no matches.

---

## Self-review notes

- **Spec coverage:** §2 (IconToggle + ChatComposer-stays + rename) → Tasks 1–3. §4 streaming fix → Task 4; request enrichment → Tasks 5–6; remove `setTimeout` → Task 6. Deferred per spec: `AgentCardTile`/card reflow, token-stats indicator, confirmation POST-back — explicitly out of scope here and tracked for a follow-up plan.
- **Type consistency:** `AgentRuntimeRequest` gains `modelMode?: AgentModelMode`, `webSearch?: boolean`, `memory?: boolean`, `onStreamMessage?`; `runAgentTurn` forwards all of them via the same `transport(...)` call; the shell passes `modelMode`/`webSearch: webSearchMode`/`memory: instructionUpdateMode`. `IconToggle` prop names (`pressed`, `tone`, `bordered`) are used identically in Task 1 and Task 3.
- **Naming:** shell symbol `AgentChatShell`, type `AgentChatShellProps`, file `AgentChatShell.tsx` used consistently across Tasks 2–3, 6.
