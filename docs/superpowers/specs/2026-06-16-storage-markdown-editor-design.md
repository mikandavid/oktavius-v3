# Storage Markdown Editor — Design

**Date:** 2026-06-16
**Branch:** FE
**Status:** Approved, frontend-only (no backend changes)

## Goal

Let users edit text/markdown files directly in the storage module. Clicking a
`.md` / `.txt` / `.markdown` file opens a full-screen, Notion-like WYSIWYG editor.
Content is stored as Markdown. Edits autosave (debounced) through the existing
upload flow. Right-clicking empty space in a folder offers **New text file**,
which creates `Untitled.md` in the current folder and opens it for editing.

## Constraints

- **No backend changes.** Read uses the existing signed preview URL; write reuses
  the existing 3-step upload flow (`initiate` → `PUT` with `x-upsert: true` →
  `finalize`). Saving is "overwrite by name in folder."
- Reuse the existing Tiptap stack already in `packages/base-ui`
  (`@tiptap/react` + `@tiptap/starter-kit` v3.23). Do not modify the existing
  HTML-based `RichTextEditor`.
- Follow existing storage-module patterns (react-query hooks, `useStorageViewState`,
  base-ui dialogs, i18n, `appToast`).

## Decisions (from brainstorming)

| Question       | Decision                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Editor type    | WYSIWYG (Notion-like), content stored as Markdown                                                         |
| Editor surface | Full-screen modal (reuse preview-modal Dialog pattern), editable                                          |
| Save model     | Autosave, debounced (~1.5s) + save on close                                                               |
| File scope     | `.md`, `.txt`, `.markdown`                                                                                |
| New file       | Right-click empty space → **New text file** → `Untitled.md` (collision-safe) in current folder, then open |

## Architecture

### Component 1 — `MarkdownEditor` (in `packages/base-ui`)

A controlled WYSIWYG component.

- **Props:** `value: string` (Markdown), `onChange(markdown: string)`,
  `editable?: boolean`, `placeholder?`, `className?`, `aria-label?`.
- **Internals:** Tiptap `StarterKit` plus a Markdown serialization layer so the
  editor round-trips Markdown rather than HTML. Notion-style typography and a
  minimal basic toolbar (bold/italic/strike, headings, lists, quote, undo/redo).
- The existing `RichTextEditor` (HTML I/O) stays untouched. `MarkdownEditor` is a
  separate component so the two value models never get confused.

**Markdown library:** Plan to add `tiptap-markdown` (provides
`editor.storage.markdown.getMarkdown()` and Markdown parsing for `setContent`).
First implementation step must confirm it is compatible with Tiptap v3.23.
**Fallback** if incompatible: `marked` (Markdown → HTML on load) + `turndown`
(HTML → Markdown on save), accepting lossier round-trips.

### Component 2 — `StorageDocumentEditorModal` (storage module)

Full-screen modal reusing the preview-modal `Dialog` pattern.

- Fetches the file's text via `useFileTextContent(nodeId)`.
- Renders `MarkdownEditor` with the loaded Markdown.
- Editable filename title (rename via existing `rename` mutation).
- Save-status indicator: `Saving… / Saved / Unsaved`.
- Autosaves on a ~1.5s debounce after typing stops, and once more on close if
  dirty. Skips saving when not dirty.
- Loading and error states (fetch failure, save failure → `appToast`).

### Component 3 — Open routing

- New helper `isEditableTextFile(node)` in the existing `data/fileTypes.ts`
  (matches `.md` / `.markdown` / `.txt`, and/or `text/markdown` / `text/plain`).
- New `editingNodeId` state (+ `setEditingNodeId`) in `useStorageViewState`,
  parallel to `previewNodeId`.
- In `StorageMainPane`'s `onOpen`: folders → `openFolder`; editable text files →
  `setEditingNodeId`; everything else → `setPreviewNodeId` (unchanged).

### Component 4 — New-file affordance

- Extend `StoragePaneContextMenu` with a **New text file** item (only in folder
  view, like the existing New Folder / Upload items).
- Handler creates `Untitled.md` in the current folder via the upload flow with
  initial empty content; collision-safe naming (`Untitled.md`, `Untitled-2.md`, …)
  computed from the current folder's node list.
- On success, open the new node in the editor.

## Data flow

### Read — `useFileTextContent(nodeId)`

1. Resolve the signed preview URL (reuse `client.previewUrl` / existing query).
2. `fetch` the URL and read the body as text.
3. Return `{ text, isLoading, error }`. Keyed by node id + `updatedAt` so a save
   that changes the node invalidates cleanly.

### Save — `useSaveTextFile`

1. `const file = new File([markdown], node.name, { type: 'text/markdown' })`.
2. `uploadFile(client, file, node.parentId)` — existing 3-step flow.
3. From the `finalize` result, read the returned node. **If the node id changed**
   (backend minted a new node/version), re-point `editingNodeId` to the new id and
   invalidate the folder list. **If unchanged**, just invalidate the list.
4. Update save-status indicator accordingly.

> This frontend-side id remap is how we tolerate whatever the current backend does
> on overwrite, without any backend change.

## Error handling

- Read failure: editor shows an error state with a retry; no blank-content save.
- Save failure: status shows `Unsaved`, surface an `appToast` error, retry on next
  debounce tick; do not lose editor content.
- Unsaved changes on close: flush a final save; `beforeunload` guard while a save
  is in flight (native `beforeunload` is the only permitted native dialog per house
  rules — no `window.confirm`).

## Testing

Follow existing storage-module test patterns (vitest + RTL, pre-seeded react-query):

- `isEditableTextFile` unit tests (extensions + mime types, negative cases).
- Collision-safe new-file naming unit test.
- `StorageDocumentEditorModal`: loads content, edits mark dirty, debounced autosave
  calls the upload flow, save-status transitions, node-id remap path, save-on-close.
- Routing: clicking a `.md` opens the editor, clicking a non-text file opens the
  preview (existing behavior preserved).
- Context menu: **New text file** creates and opens `Untitled.md`.

## Open risks (accepted / mitigated)

1. **Overwrite semantics (node id stability).** Accepted via frontend id-remap in
   the save flow (see Data flow step 3). No backend change.
2. **`tiptap-markdown` v3.23 compatibility.** Validate first; `marked` + `turndown`
   fallback documented above.
3. **`.txt` through a Markdown WYSIWYG.** Plain text is valid Markdown so it loads
   fine; applying formatting to a `.txt` injects Markdown syntax on save. Accepted
   given the WYSIWYG-for-all-text decision.

## Out of scope

- Backend endpoints for direct text read/write or versioning.
- Slash commands, embeds, images, tables, real-time collaboration.
- Conflict resolution for concurrent editors of the same file.
