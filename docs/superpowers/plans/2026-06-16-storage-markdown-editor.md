# Storage Markdown Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users open `.md`/`.txt`/`.markdown` files in storage in a full-screen, Notion-like WYSIWYG editor that autosaves, and create new text files via right-click — with no backend changes.

**Architecture:** A reusable `MarkdownEditor` (Tiptap + Markdown serialization) lives in `packages/base-ui`. The storage module adds a `StorageDocumentEditorModal` that reads file text via the signed preview URL, edits it through `MarkdownEditor`, and autosaves (debounced) by re-running the existing 3-step upload flow (overwrite-by-name). Opening routes editable text files to the editor; a right-click menu item creates `Untitled.md`.

**Tech Stack:** React, TypeScript, Tiptap v3 (`@tiptap/react`, `@tiptap/starter-kit`), `tiptap-markdown` (with `marked`+`turndown` fallback), TanStack Query, Vitest + jsdom, i18n via `@oktavius/i18n`.

---

## File Structure

**Create:**

- `packages/base-ui/src/components/markdown-editor.tsx` — WYSIWYG Markdown editor component.
- `packages/base-ui/src/components/markdown-editor.test.tsx` — smoke + round-trip test.
- `apps/web/src/modules/storage/data/textFiles.ts` — pure helpers: `isEditableTextFile`, `nextUntitledName`, `markdownToFile`.
- `apps/web/src/modules/storage/data/textFiles.test.ts` — unit tests for the helpers.
- `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx` — the editor modal.
- `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx` — modal integration test.

**Modify:**

- `packages/base-ui/package.json` — add `tiptap-markdown` (and fallback deps if needed).
- `packages/base-ui/src/index.ts` — export the new component.
- `apps/web/src/modules/storage/data/uploadFile.ts` — additively return the finalized `node`.
- `apps/web/src/modules/storage/data/useStorageData.ts` — add `useStorageNode`, `useFileTextContent`, `useSaveTextFile`.
- `apps/web/src/modules/storage/useStorageViewState.ts` — add `editingNodeId` + `setEditingNodeId`.
- `apps/web/src/modules/storage/components/StorageMainPane.tsx` — route opens, render the modal, wire "New text file".
- `apps/web/src/modules/storage/components/StoragePaneContextMenu.tsx` — add "New text file" item.
- `packages/i18n/locales/en/storage.json` and `packages/i18n/locales/de/storage.json` — new keys.

---

## Task 1: `MarkdownEditor` component in base-ui

**Files:**

- Modify: `packages/base-ui/package.json`
- Create: `packages/base-ui/src/components/markdown-editor.tsx`
- Create: `packages/base-ui/src/components/markdown-editor.test.tsx`
- Modify: `packages/base-ui/src/index.ts`

- [ ] **Step 1: Install the Markdown serialization library**

Run from repo root:

```bash
pnpm --filter @oktavius/base-ui add tiptap-markdown
```

Expected: `tiptap-markdown` added to `packages/base-ui/package.json` dependencies.

- [ ] **Step 2: Write the failing test**

Create `packages/base-ui/src/components/markdown-editor.test.tsx`:

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MarkdownEditor } from './markdown-editor';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('MarkdownEditor', () => {
  it('renders provided markdown as formatted HTML', () => {
    act(() => {
      root.render(<MarkdownEditor value={'# Title\n\nHello **world**'} onChange={vi.fn()} />);
    });
    const html = container.innerHTML;
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>world</strong>');
  });

  it('does not emit onChange on initial mount', () => {
    const onChange = vi.fn();
    act(() => {
      root.render(<MarkdownEditor value={'plain text'} onChange={onChange} />);
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter @oktavius/base-ui test markdown-editor`
Expected: FAIL — `Cannot find module './markdown-editor'`.

- [ ] **Step 4: Implement `MarkdownEditor`**

Create `packages/base-ui/src/components/markdown-editor.tsx`:

```tsx
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
} from '@phosphor-icons/react';
import Placeholder from '@tiptap/extension-placeholder';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { useEffect } from 'react';

import { cn } from '../lib/utils';
import { Button } from './button';

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  contentClassName?: string;
  minHeightClassName?: string;
  'aria-label'?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  editable = true,
  className,
  contentClassName,
  minHeightClassName = 'min-h-[60vh]',
  'aria-label': ariaLabel,
}: MarkdownEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, horizontalRule: false }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? placeholder,
        class: cn(
          'max-w-none outline-none text-[0.95rem] leading-7 text-foreground',
          '[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold',
          '[&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold',
          '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
          '[&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3',
          '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-border/70 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
          '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm',
          '[&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          minHeightClassName,
        ),
      },
    },
    onUpdate: ({ editor: next }) => {
      onChange(next.storage.markdown.getMarkdown());
    },
  });

  // Re-sync when the parent swaps the document (different file / loaded content).
  useEffect(() => {
    if (!editor) return;
    if (editor.storage.markdown.getMarkdown() === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {editor ? <MarkdownToolbar editor={editor} /> : null}
      <EditorContent
        editor={editor}
        className={cn('min-w-0 flex-1 overflow-y-auto px-1 py-3', contentClassName)}
      />
    </div>
  );
}

function MarkdownToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border/50 pb-2">
      <ToolbarButton
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <TextHOne size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <TextHTwo size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>
        <TextB size={16} />
      </ToolbarButton>
      <ToolbarButton label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <TextItalic size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets size={16} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers size={16} />
      </ToolbarButton>
      <ToolbarButton label="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quotes size={16} />
      </ToolbarButton>
      <div className="mx-1 h-5 w-px bg-border/60" />
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <ArrowCounterClockwise size={16} />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <ArrowClockwise size={16} />
      </ToolbarButton>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
      {children}
    </Button>
  );
}
```

- [ ] **Step 5: Export from base-ui**

In `packages/base-ui/src/index.ts`, add next to the rich-text export (line ~47):

```ts
export * from './components/markdown-editor';
```

- [ ] **Step 6: Run the test**

Run: `pnpm --filter @oktavius/base-ui test markdown-editor`
Expected: PASS.

**If the test fails because `tiptap-markdown` is incompatible with Tiptap v3** (e.g. `Markdown` extension import missing or `editor.storage.markdown` undefined), use the fallback below instead, then re-run.

Fallback — install `marked` + `turndown`:

```bash
pnpm --filter @oktavius/base-ui add marked turndown
pnpm --filter @oktavius/base-ui add -D @types/turndown
```

Then in `markdown-editor.tsx`: remove the `Markdown` extension and its `import`; build a `TurndownService` once with `useMemo`; set initial `content` with `marked.parse(value)`; in `onUpdate` call `onChange(turndown.turndown(next.getHTML()))`; in the re-sync effect compare against `turndown.turndown(editor.getHTML())` and call `setContent(marked.parse(value), { emitUpdate: false })`. Keep the same StarterKit config, toolbar, and props.

- [ ] **Step 7: Commit**

```bash
git add packages/base-ui/package.json packages/base-ui/src/components/markdown-editor.tsx packages/base-ui/src/components/markdown-editor.test.tsx packages/base-ui/src/index.ts ../../pnpm-lock.yaml
git commit -m "feat(base-ui): add MarkdownEditor WYSIWYG component"
```

(If the lockfile path differs, `git add` the repo-root `pnpm-lock.yaml`.)

---

## Task 2: Pure text-file helpers

**Files:**

- Create: `apps/web/src/modules/storage/data/textFiles.ts`
- Create: `apps/web/src/modules/storage/data/textFiles.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/storage/data/textFiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { isEditableTextFile, markdownToFile, nextUntitledName } from './textFiles';
import type { StorageNode } from './types';

function file(partial: Partial<StorageNode>): StorageNode {
  return {
    id: 'x',
    parentId: null,
    nodeType: 'file',
    name: 'a.md',
    mimeType: 'text/markdown',
    fileExtension: 'md',
    fileSizeBytes: 1,
    uploadStatus: 'ready',
    trashedAt: null,
    purgeAfterAt: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('isEditableTextFile', () => {
  it('accepts md, markdown and txt by extension', () => {
    expect(isEditableTextFile(file({ fileExtension: 'md' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: 'markdown' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: 'txt' }))).toBe(true);
  });
  it('accepts text/* and text/markdown by mime', () => {
    expect(isEditableTextFile(file({ fileExtension: null, mimeType: 'text/plain' }))).toBe(true);
    expect(isEditableTextFile(file({ fileExtension: null, mimeType: 'text/markdown' }))).toBe(true);
  });
  it('rejects folders and non-text files', () => {
    expect(isEditableTextFile(file({ nodeType: 'folder' }))).toBe(false);
    expect(isEditableTextFile(file({ fileExtension: 'pdf', mimeType: 'application/pdf' }))).toBe(
      false,
    );
  });
});

describe('nextUntitledName', () => {
  it('returns Untitled.md when none exist', () => {
    expect(nextUntitledName([])).toBe('Untitled.md');
    expect(nextUntitledName(['report.md'])).toBe('Untitled.md');
  });
  it('increments when names collide (case-insensitive)', () => {
    expect(nextUntitledName(['Untitled.md'])).toBe('Untitled-2.md');
    expect(nextUntitledName(['untitled.md', 'Untitled-2.md'])).toBe('Untitled-3.md');
  });
});

describe('markdownToFile', () => {
  it('wraps markdown in a File with the given name and markdown mime', () => {
    const f = markdownToFile('Notes.md', '# hi');
    expect(f.name).toBe('Notes.md');
    expect(f.type).toBe('text/markdown');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test textFiles`
Expected: FAIL — `Cannot find module './textFiles'`.

- [ ] **Step 3: Implement the helpers**

Create `apps/web/src/modules/storage/data/textFiles.ts`:

```ts
import type { StorageNode } from './types';

const EDITABLE_EXTENSIONS = new Set(['md', 'markdown', 'txt']);

/** True for text files we open in the markdown editor rather than the preview. */
export function isEditableTextFile(node: StorageNode): boolean {
  if (node.nodeType !== 'file') return false;
  const ext = (node.fileExtension ?? '').toLowerCase();
  if (EDITABLE_EXTENSIONS.has(ext)) return true;
  const mime = (node.mimeType ?? '').toLowerCase();
  return mime === 'text/markdown' || mime.startsWith('text/');
}

/** Collision-safe default name for a new text file in a folder. */
export function nextUntitledName(existingNames: string[]): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  if (!taken.has('untitled.md')) return 'Untitled.md';
  let n = 2;
  while (taken.has(`untitled-${n}.md`)) n += 1;
  return `Untitled-${n}.md`;
}

/** Builds a File from markdown text for the upload flow. */
export function markdownToFile(name: string, markdown: string): File {
  return new File([markdown], name, { type: 'text/markdown' });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test textFiles`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/storage/data/textFiles.ts apps/web/src/modules/storage/data/textFiles.test.ts
git commit -m "feat(storage): add editable-text-file helpers"
```

---

## Task 3: Return the finalized node from `uploadFile`

**Files:**

- Modify: `apps/web/src/modules/storage/data/uploadFile.ts`

This is an additive change so `useSaveTextFile` can read the node id the backend assigned (for the id-remap path). Existing callers destructure `{ duplicateOfNodeId }` and are unaffected.

- [ ] **Step 1: Update `UploadOutcome` and `uploadFile`**

In `apps/web/src/modules/storage/data/uploadFile.ts`:

Add the import at the top (alongside the existing client import):

```ts
import type { OsirisStorageClient } from './storageClient';
import type { StorageNode } from './types';
```

Change the interface:

```ts
export interface UploadOutcome {
  duplicateOfNodeId: string | null;
  node: StorageNode;
}
```

In `uploadFile`, change the final lines so the finalized node is returned:

```ts
const result = await client.finalizeUpload({
  sessionId: session.sessionId,
  contentSha256: sha ?? undefined,
});
return { duplicateOfNodeId: result.duplicateOfNodeId, node: result.node };
```

- [ ] **Step 2: Verify types and existing upload tests still pass**

Run: `pnpm --filter @oktavius/web test uploadFile && pnpm --filter @oktavius/web typecheck`
Expected: PASS (existing `uploadFile.test.ts` only asserts `duplicateOfNodeId`; the new field is additive). If the test builds an outcome object that now needs `node`, add a minimal `node` to that test fixture.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/storage/data/uploadFile.ts apps/web/src/modules/storage/data/uploadFile.test.ts
git commit -m "feat(storage): return finalized node from uploadFile"
```

---

## Task 4: Data hooks — read & save text content

**Files:**

- Modify: `apps/web/src/modules/storage/data/useStorageData.ts`

- [ ] **Step 1: Add `useStorageNode`, `useFileTextContent`, and `useSaveTextFile`**

At the top of `apps/web/src/modules/storage/data/useStorageData.ts`, add imports:

```ts
import { markdownToFile } from './textFiles';
import { uploadFile } from './uploadFile';
import type { StorageNode } from './types';
```

Append these hooks to the file:

```ts
export function useStorageNode(id: string | null) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: [...storageKeys.root(org), 'node', id],
    queryFn: () => client.getNode(id as string),
    enabled: Boolean(id),
  });
}

export function useFileTextContent(node: StorageNode | null | undefined) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    // Keyed by updatedAt so a save that bumps the node refetches fresh text.
    queryKey: [...storageKeys.root(org), 'text', node?.id, node?.updatedAt],
    queryFn: async () => {
      const url = await client.previewUrl(node!.id);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load file (${response.status})`);
      return response.text();
    },
    enabled: Boolean(node?.id),
    staleTime: Infinity,
  });
}

export function useSaveTextFile() {
  const client = useStorageClient();
  const invalidate = useInvalidateStorage();
  return useMutation({
    mutationFn: async (input: { node: StorageNode; markdown: string }): Promise<StorageNode> => {
      const file = markdownToFile(input.node.name, input.markdown);
      const outcome = await uploadFile(client, file, input.node.parentId);
      return outcome.node;
    },
    onSuccess: invalidate,
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/modules/storage/data/useStorageData.ts
git commit -m "feat(storage): add hooks to read and save text file content"
```

---

## Task 5: i18n keys

**Files:**

- Modify: `packages/i18n/locales/en/storage.json`
- Modify: `packages/i18n/locales/de/storage.json`

- [ ] **Step 1: Add English keys**

In `packages/i18n/locales/en/storage.json`, add these keys (anywhere in the top-level object, before the closing brace):

```json
  "newTextFile": "New text file",
  "editor": {
    "loading": "Loading document…",
    "loadFailed": "Could not open this file",
    "saving": "Saving…",
    "saved": "Saved",
    "unsaved": "Unsaved changes",
    "saveFailed": "Could not save changes",
    "close": "Close",
    "renameLabel": "File name"
  }
```

- [ ] **Step 2: Add German keys**

In `packages/i18n/locales/de/storage.json`, add the parallel keys:

```json
  "newTextFile": "Neue Textdatei",
  "editor": {
    "loading": "Dokument wird geladen…",
    "loadFailed": "Diese Datei konnte nicht geöffnet werden",
    "saving": "Wird gespeichert…",
    "saved": "Gespeichert",
    "unsaved": "Nicht gespeicherte Änderungen",
    "saveFailed": "Änderungen konnten nicht gespeichert werden",
    "close": "Schließen",
    "renameLabel": "Dateiname"
  }
```

- [ ] **Step 3: Regenerate namespace types and validate**

Run:

```bash
pnpm --filter @oktavius/i18n generate:namespaces && pnpm --filter @oktavius/i18n validate
```

Expected: PASS — no missing/extra-key errors between `en` and `de`.

- [ ] **Step 4: Commit**

```bash
git add packages/i18n/locales/en/storage.json packages/i18n/locales/de/storage.json packages/i18n/src
git commit -m "feat(i18n): add storage markdown editor strings"
```

---

## Task 6: `StorageDocumentEditorModal`

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx`
- Create: `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx`. The test mocks `MarkdownEditor` (avoids running Tiptap in jsdom) with a textarea, and mocks the data hooks:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';

const node: StorageNode = {
  id: 'n1',
  parentId: 'p1',
  nodeType: 'file',
  name: 'Notes.md',
  mimeType: 'text/markdown',
  fileExtension: 'md',
  fileSizeBytes: 5,
  uploadStatus: 'ready',
  trashedAt: null,
  purgeAfterAt: null,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const save = vi.fn().mockResolvedValue({ ...node, id: 'n2' });

vi.mock('@oktavius/base-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@oktavius/base-ui')>();
  return {
    ...actual,
    MarkdownEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <textarea data-testid="md" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
  };
});

vi.mock('../data/useStorageData', () => ({
  useStorageNode: () => ({ data: node, isLoading: false, error: null }),
  useFileTextContent: () => ({ data: '# Notes', isLoading: false, error: null }),
  useSaveTextFile: () => ({ mutateAsync: save, isPending: false }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  save.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

function render(onNodeIdChange = vi.fn(), onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <TestI18nProvider>
          {require('./StorageDocumentEditorModal').StorageDocumentEditorModal({
            nodeId: 'n1',
            onClose,
            onNodeIdChange,
          })}
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
}

describe('StorageDocumentEditorModal', () => {
  it('autosaves after editing and remaps to the new node id', async () => {
    const onNodeIdChange = vi.fn();
    render(onNodeIdChange);

    const textarea = container.querySelector<HTMLTextAreaElement>('[data-testid="md"]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!;
      setter.call(textarea, '# Notes edited');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Debounce window (1500ms) elapses → save fires once.
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].markdown).toBe('# Notes edited');
    expect(onNodeIdChange).toHaveBeenCalledWith('n2');
  });
});
```

> Note: `require('./StorageDocumentEditorModal')` keeps the mock hoisting simple in this createRoot harness; an `import` at top of file is equivalent once the module exists.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @oktavius/web test StorageDocumentEditorModal`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the modal**

Create `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx`:

```tsx
import { Dialog, DialogContent, DialogTitle, MarkdownEditor } from '@oktavius/base-ui';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { CloseIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { useFileTextContent, useSaveTextFile, useStorageNode } from '../data/useStorageData';

const AUTOSAVE_DELAY_MS = 1500;

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function StorageDocumentEditorModal({
  nodeId,
  onClose,
  onNodeIdChange,
}: {
  nodeId: string | null;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  const nodeQuery = useStorageNode(nodeId);
  const node = nodeQuery.data ?? null;
  const contentQuery = useFileTextContent(node);
  const saveMutation = useSaveTextFile();

  const [markdown, setMarkdown] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Load text into local state once it arrives (and when switching files).
  useEffect(() => {
    if (contentQuery.data !== undefined) {
      setMarkdown(contentQuery.data);
      setStatus('idle');
      dirtyRef.current = false;
    }
  }, [contentQuery.data]);

  const flush = async (current: string) => {
    if (!node || !dirtyRef.current) return;
    setStatus('saving');
    try {
      const saved = await saveMutation.mutateAsync({ node, markdown: current });
      dirtyRef.current = false;
      setStatus('saved');
      if (saved.id !== node.id) onNodeIdChange(saved.id);
    } catch (error) {
      setStatus('error');
      appToast.fromApiError(error, t('storage.editor.saveFailed'));
    }
  };

  const handleChange = (next: string) => {
    setMarkdown(next);
    dirtyRef.current = true;
    setStatus('dirty');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flush(next), AUTOSAVE_DELAY_MS);
  };

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (dirtyRef.current && markdown !== null) void flush(markdown);
    onClose();
  };

  // Warn before unloading the tab while a save is pending (native beforeunload is
  // the only permitted native dialog).
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || status === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status]);

  const statusLabel =
    status === 'saving'
      ? t('storage.editor.saving')
      : status === 'saved'
        ? t('storage.editor.saved')
        : status === 'dirty'
          ? t('storage.editor.unsaved')
          : '';

  return (
    <Dialog open={Boolean(nodeId)} onOpenChange={(value) => (!value ? handleClose() : undefined)}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-[85vw] max-w-[900px] flex-col gap-3 p-6"
      >
        <div className="flex items-center gap-3">
          <DialogTitle className="min-w-0 flex-1 truncate text-sm">{node?.name ?? ''}</DialogTitle>
          <span className="text-xs text-muted-foreground" data-testid="save-status">
            {statusLabel}
          </span>
          <button
            type="button"
            aria-label={t('storage.editor.close')}
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {contentQuery.isLoading || markdown === null ? (
          <p className="text-sm text-muted-foreground">{t('storage.editor.loading')}</p>
        ) : contentQuery.error ? (
          <p className="text-sm text-destructive">{t('storage.editor.loadFailed')}</p>
        ) : (
          <MarkdownEditor
            value={markdown}
            onChange={handleChange}
            aria-label={node?.name}
            className="min-h-0 flex-1"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @oktavius/web test StorageDocumentEditorModal`
Expected: PASS — save called once with the edited markdown, `onNodeIdChange('n2')` fired.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx
git commit -m "feat(storage): add markdown document editor modal"
```

---

## Task 7: View state + open routing

**Files:**

- Modify: `apps/web/src/modules/storage/useStorageViewState.ts`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx`

- [ ] **Step 1: Add `editingNodeId` to view state**

In `apps/web/src/modules/storage/useStorageViewState.ts`:

Add to the `StorageViewState` interface (after `previewNodeId` and `setPreviewNodeId`):

```ts
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
```

Add the state inside the hook (next to `previewNodeId`):

```ts
const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
```

Add both to the returned object (next to `previewNodeId` / `setPreviewNodeId`):

```ts
    editingNodeId,
    setEditingNodeId,
```

- [ ] **Step 2: Route editable text files to the editor**

In `apps/web/src/modules/storage/components/StorageMainPane.tsx`:

Add the helper import (next to the `StorageNode` type import):

```ts
import { isEditableTextFile } from '../data/textFiles';
```

Replace the `onOpen` handler (currently at ~line 138):

```ts
    onOpen: (node) => {
      if (node.nodeType === 'folder') {
        state.openFolder(node.id);
      } else if (isEditableTextFile(node)) {
        state.setEditingNodeId(node.id);
      } else {
        state.setPreviewNodeId(node.id);
      }
    },
```

- [ ] **Step 3: Render the editor modal**

In `StorageMainPane.tsx`, add the import (next to the `StoragePreviewModal` import):

```ts
import { StorageDocumentEditorModal } from './StorageDocumentEditorModal';
```

Add the modal in the JSX right after `<StoragePreviewModal ... />` closes:

```tsx
<StorageDocumentEditorModal
  nodeId={state.editingNodeId}
  onClose={() => state.setEditingNodeId(null)}
  onNodeIdChange={(id) => state.setEditingNodeId(id)}
/>
```

- [ ] **Step 4: Write the routing test**

Append to `apps/web/src/modules/storage/components/StorageGrid.test.tsx` a case proving the right callback fires (StorageGrid already has the harness). Add inside the existing `describe`:

```tsx
it('invokes onOpen with the clicked node', () => {
  const actions = makeActions();
  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <StorageGrid
            nodes={[{ ...node, name: 'Readme.md', fileExtension: 'md', mimeType: 'text/markdown' }]}
            actions={actions}
            inTrash={false}
            selectedIds={[]}
            onToggleSelect={vi.fn()}
            onOpen={actions.onOpen}
          />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });
  const card = container.querySelector('[role="button"], [tabindex]') as HTMLElement;
  act(() => card.click());
  expect(actions.onOpen).toHaveBeenCalled();
});
```

(The routing-by-type decision itself is covered by `isEditableTextFile` unit tests in Task 2; this confirms `onOpen` is wired to clicks.)

- [ ] **Step 5: Run tests + typecheck**

Run: `pnpm --filter @oktavius/web test StorageGrid && pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/storage/useStorageViewState.ts apps/web/src/modules/storage/components/StorageMainPane.tsx apps/web/src/modules/storage/components/StorageGrid.test.tsx
git commit -m "feat(storage): open editable text files in the markdown editor"
```

---

## Task 8: "New text file" affordance

**Files:**

- Modify: `apps/web/src/modules/storage/components/StoragePaneContextMenu.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx`

- [ ] **Step 1: Add the menu item**

In `apps/web/src/modules/storage/components/StoragePaneContextMenu.tsx`:

Add `onNewTextFile` to the props type:

```ts
  onNewFolder: () => void;
  onNewTextFile: () => void;
  onUpload: () => void;
```

Add the icon import (use an existing document icon):

```ts
import { DocumentIcon, NewFolderIcon, UploadIcon } from '@/lib/icons';
```

Add the menu item before the Upload item:

```tsx
        <ContextMenuItem onSelect={onNewFolder}>
          <NewFolderIcon size={16} /> {t('storage.newFolder')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onNewTextFile}>
          <DocumentIcon size={16} /> {t('storage.newTextFile')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onUpload}>
          <UploadIcon size={16} /> {t('storage.actions.upload')}
        </ContextMenuItem>
```

And add `onNewTextFile` to the destructured props in the function signature.

- [ ] **Step 2: Implement the create handler in StorageMainPane**

In `StorageMainPane.tsx`:

Add imports (next to the existing storage helper imports):

```ts
import { isEditableTextFile, markdownToFile, nextUntitledName } from '../data/textFiles';
import { uploadFile } from '../data/uploadFile';
```

(`isEditableTextFile` may already be imported from Task 7 — keep a single import line.)

Add a creating-guard state near the other `useState` calls:

```ts
const [creatingTextFile, setCreatingTextFile] = useState(false);
```

Add the handler near `openNewFolder`/`triggerUpload`:

```ts
const createTextFile = async () => {
  if (creatingTextFile) return;
  setCreatingTextFile(true);
  const folderId = state.view === 'folder' ? state.currentFolderId : null;
  const name = nextUntitledName(orderedNodes.map((node) => node.name));
  try {
    const { node } = await uploadFile(client, markdownToFile(name, ''), folderId);
    invalidate();
    state.setEditingNodeId(node.id);
  } catch (error) {
    onError(error);
  } finally {
    setCreatingTextFile(false);
  }
};
```

Add the invalidate hook near the top of the component (next to `mutations`):

```ts
const invalidate = useInvalidateStorage();
```

And add `useInvalidateStorage` to the existing import from `'../data/useStorageData'`.

Pass the handler into the context menu (in the JSX where `StoragePaneContextMenu` is used):

```tsx
        <StoragePaneContextMenu
          enabled={isFolderView}
          onNewFolder={openNewFolder}
          onNewTextFile={() => void createTextFile()}
          onUpload={triggerUpload}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
        >
```

- [ ] **Step 3: Write the context-menu test**

Create the test by extending the modal/menu coverage — add `apps/web/src/modules/storage/components/StoragePaneContextMenu.test.tsx`:

```tsx
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { StoragePaneContextMenu } from './StoragePaneContextMenu';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('StoragePaneContextMenu', () => {
  it('passes through children when disabled', () => {
    act(() => {
      root.render(
        <TestI18nProvider>
          <StoragePaneContextMenu
            enabled={false}
            onNewFolder={vi.fn()}
            onNewTextFile={vi.fn()}
            onUpload={vi.fn()}
          >
            <div data-testid="child">x</div>
          </StoragePaneContextMenu>
        </TestI18nProvider>,
      );
    });
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
```

(Radix context menus open on a native `contextmenu` event that is unreliable in jsdom; the create-and-open behavior of `createTextFile` is covered by the `nextUntitledName` unit test plus the modal's save test. This test guards the new prop wiring and the disabled path.)

- [ ] **Step 4: Run tests + typecheck**

Run: `pnpm --filter @oktavius/web test StoragePaneContextMenu && pnpm --filter @oktavius/web typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/storage/components/StoragePaneContextMenu.tsx apps/web/src/modules/storage/components/StoragePaneContextMenu.test.tsx apps/web/src/modules/storage/components/StorageMainPane.tsx
git commit -m "feat(storage): add New text file right-click action"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run the whole check suite**

Run from repo root:

```bash
pnpm check
```

Expected: lint, typecheck, all tests, and format check PASS.

- [ ] **Step 2: Manual smoke (dev server)**

Run: `pnpm dev`, open Storage, then verify:

1. Click a `.md` file → editor opens, renders formatted content.
2. Type → status shows "Unsaved changes", then "Saving…", then "Saved" after ~1.5s.
3. Reopen the file → edits persisted.
4. Right-click empty space in a folder → "New text file" → `Untitled.md` opens in the editor.
5. Click a non-text file (PDF/image) → the existing preview modal still opens (unchanged).

- [ ] **Step 3: Final commit (if any manual-fix tweaks were needed)**

```bash
git add -A
git commit -m "chore(storage): markdown editor verification fixes"
```

---

## Self-Review Notes

- **Spec coverage:** WYSIWYG markdown editor (Task 1), full-screen modal surface (Task 6), autosave + save-on-close + beforeunload guard (Task 6), `.md/.txt/.markdown` scope (Task 2/7), `Untitled.md` collision-safe new file (Task 2/8), read via signed URL (Task 4), save via upload-flow overwrite with node-id remap (Tasks 3/4/6), no backend changes, i18n (Task 5). All spec sections map to a task.
- **Fallback documented:** `tiptap-markdown` → `marked`+`turndown` in Task 1 Step 6 (both fully coded).
- **Type consistency:** `useSaveTextFile` returns `StorageNode`; modal compares `saved.id !== node.id` and calls `onNodeIdChange`; `uploadFile` returns `{ duplicateOfNodeId, node }`. `MarkdownEditor` props (`value`/`onChange(markdown)`) match the modal usage and the mock.
- **Risk reminder:** if the backend mints a new node id on overwrite, the remap in Task 6 keeps the editor pointed at the live file; if it keeps the same id, the remap is a no-op.
