# Storage Full-Page Document Editor — Design

**Date:** 2026-06-18
**Module:** `apps/web/src/modules/storage`
**Status:** Approved (pending spec review)

## Problem

Editing a text document in Storage today only happens inside a centered
`Dialog` popup (`StorageDocumentEditorModal`, ~85vw × 85vh). There is no
full-page, "Google Docs"-style writing surface. Additionally, creating a text
doc is only reachable via the right-click context menu on empty pane space,
which made "New text file" feel like it does nothing.

## Goals

1. Add a full-page, centered-paper document editor reachable from the existing
   modal via an "open in full page" button.
2. Keep the quick modal editor; the two surfaces must save identically.
3. Verify the existing "New text file" create flow works end to end.

## Non-Goals

- No new visible "New" button in the toolbar/header — entry point stays the
  right-click context menu (per user decision).
- No change to the read-only `StoragePreviewModal` (clicking an editable text
  file already routes to the editor, not the preview).
- No collaborative/real-time editing, comments, or version history.

## Decisions

- **Editor relationship:** Keep the modal, add an "open in full page" button to
  it. (User choice: "Modal + expand button".)
- **Page chrome:** Full page lives inside the app shell — the global left nav
  stays; a doc-focused header replaces the `ModulePage` header. (User choice.)
- **New text file surface:** Keeps opening the modal (unchanged), consistent
  with the "modal + expand" model. User can expand to full page from there.
- **Title in full-page header:** Inline-renameable, reusing the existing rename
  mutation (Docs-like in-place rename).

## Architecture

### 1. `useDocumentEditorSession` hook — `modules/storage/data/`

Extract the autosave engine currently inlined in `StorageDocumentEditorModal`
so both surfaces share one implementation:

- Local `markdown` state, hydrated from `useFileTextContent(node)`; skips
  re-hydration while dirty or saving (preserves the existing keystroke-safety
  guard).
- Save-status state machine: `idle | dirty | saving | saved | error`.
- Debounced autosave (`AUTOSAVE_DELAY_MS = 1500`) via `handleChange`, plus a
  `flush(current)` that calls `useSaveTextFile` and applies the post-save
  **node-id remap** (`saved.id !== node.id → onNodeIdChange`).
- `beforeunload` guard while dirty/saving (the only permitted native dialog).
- Cleanup of the pending timer on unmount.

**Signature (sketch):**

```ts
useDocumentEditorSession({
  nodeId: string | null,
  onNodeIdChange: (id: string) => void,
}): {
  node: StorageNode | null;
  markdown: string | null;
  status: SaveStatus;
  statusLabel: string;        // translated
  handleChange: (next: string) => void;
  flush: () => Promise<void>;  // flush current markdown if dirty
  isLoading: boolean;
  error: unknown;
}
```

`statusLabel` translation stays in the hook so both surfaces render the same
text.

### 2. Routing — `?doc=<nodeId>` search param

`StoragePage` reads `doc` from `useSearchParams`. When `doc` is present and
resolves to an **editable text node**, render `<StorageDocumentEditorPage>`
instead of the rail + `StorageMainPane`. Otherwise render the normal grid.

- The left nav is part of the app shell wrapping the route, so it stays visible
  for free.
- "Back"/close removes the `doc` param (preserving `view`/`folder`), returning
  to the grid in the same folder.
- If `doc` resolves to a missing or non-editable node, fall back to the grid
  (and clear the param).

### 3. `StorageDocumentEditorPage` — `modules/storage/components/`

The Google-Docs surface. Consumes `useDocumentEditorSession`.

- **Doc header (slim bar):** back-to-storage button, inline-renameable title
  (filename, via existing rename mutation), live save-status text.
- **Body:** centered "paper" canvas — `max-w-[816px]`, `bg-card`, soft shadow,
  generous padding — on a tinted wash background, with a sticky formatting
  toolbar. Reuses `MarkdownEditor` directly (passes `className` /
  `contentClassName` / `minHeightClassName`); no new editor logic.
- Loading / load-error states mirror the modal's.

### 4. "Open in full page" button on `StorageDocumentEditorModal`

Add an expand-icon button to the modal header. On click: `flush()` any pending
save, set `?doc=<currentNodeId>` (preserving other params), and close the modal
(`onClose`). Hand-off is seamless because the full page reads the same node and
content from the cache.

The modal itself is refactored to consume `useDocumentEditorSession`, removing
its inlined autosave logic.

### 5. Verify "New text file" create flow

Confirm `StorageMainPane.createTextFile` → `uploadFile(client,
markdownToFile(name, ''), folderId)` → `invalidate()` →
`setEditingNodeId(node.id)` actually creates the file and opens the modal.
Fix if broken; entry point unchanged.

## Data Flow

```
context menu "New text file"
  └─ createTextFile() → upload empty .md → setEditingNodeId(id) → modal opens

click editable text file (StorageMainPane.onOpen)
  └─ isEditableTextFile → setEditingNodeId(id) → modal opens

modal "open in full page"
  └─ flush() → setSearchParams(doc=id) + onClose() → StoragePage renders editor page

editor page "back"
  └─ remove doc param → grid

both surfaces:
  useDocumentEditorSession → debounced flush → useSaveTextFile
    → node-id remap → onNodeIdChange / setSearchParams(doc=newId)
```

## Components & Boundaries

| Unit                         | Purpose                                   | Depends on                                                |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| `useDocumentEditorSession`   | Autosave engine + status + remap          | `useStorageNode`, `useFileTextContent`, `useSaveTextFile` |
| `StorageDocumentEditorModal` | Quick modal edit + expand button          | hook, `MarkdownEditor`, router                            |
| `StorageDocumentEditorPage`  | Full-page Docs surface                    | hook, `MarkdownEditor`, rename mutation, router           |
| `StoragePage`                | Routes grid vs editor page on `doc` param | `useSearchParams`                                         |

## Error Handling

- Save failure → `status = 'error'`, `appToast.fromApiError`, content kept
  locally so the user can retry. (Unchanged behavior, now in the hook.)
- `doc` param pointing at a missing/non-editable node → clear param, show grid.
- Pending save + tab close → `beforeunload` guard.

## Testing

- **`useDocumentEditorSession`:** dirty→saving→saved transitions, debounce,
  node-id remap fires `onNodeIdChange`, no re-hydration while dirty.
- **`StorageDocumentEditorPage`:** renders for a `doc` param, back clears param,
  inline rename calls the mutation, loading/error states.
- **`StorageDocumentEditorModal`:** expand button sets `doc` param + closes;
  existing autosave tests still pass after the refactor.
- **`StoragePage`:** `doc` present → editor page; absent/invalid → grid.
- Follow existing storage test patterns (pre-seeded react-query, router
  wrappers).

## Out of Scope / Future

- Real-time collaboration, comments, version history.
- Toolbar parity beyond the current `MarkdownEditor` (links, tables, images).
