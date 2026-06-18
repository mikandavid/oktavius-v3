# Storage Full-Page Document Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-page, "Google Docs"-style document editor for Storage text files, reachable from the existing modal via an "open in full page" button, while keeping the quick modal editor.

**Architecture:** Extract the modal's autosave logic into a shared `useDocumentEditorSession` hook so the modal and a new `StorageDocumentEditorPage` save identically. Drive the full page off a `?doc=<nodeId>` search param resolved in `StoragePage` (the app shell's left nav stays; a doc-focused header replaces the `ModulePage` header). The page reuses the existing `MarkdownEditor` inside a centered paper canvas.

**Tech Stack:** React 19, react-router-dom (`useSearchParams`), @tanstack/react-query, `@oktavius/base-ui` (`MarkdownEditor`, `Dialog`), Vitest + raw `createRoot`/`act` tests, `@oktavius/i18n`.

## Global Constraints

- **No native dialogs** except `beforeunload` (the existing save guard). Never `window.confirm/alert/prompt`.
- **No cross-module imports** — stay within `apps/web/src/modules/storage`, plus shared `@/` infra and `@oktavius/base-ui`.
- **Icons** come only from `@/lib/icons` (which re-exports `@phosphor-icons/react`), never the library directly.
- **i18n** strings live in `packages/i18n/locales/{en,de}/storage.json`; add EN and DE for every new key. Access via `useTranslation()` → `t('storage.…')`.
- **Tests** follow the existing storage pattern: raw `createRoot` + `act`, `QueryClientProvider`, `TestI18nProvider`, `MemoryRouter` where routing is involved; mock `../data/useStorageData` and `MarkdownEditor` as needed.
- Autosave debounce constant is `AUTOSAVE_DELAY_MS = 1500`.

---

### Task 1: Extract `useDocumentEditorSession` hook and refactor the modal onto it

**Files:**

- Create: `apps/web/src/modules/storage/data/useDocumentEditorSession.ts`
- Modify: `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx`
- Test (existing, must stay green): `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx`

**Interfaces:**

- Consumes: `useStorageNode(id)`, `useFileTextContent(node)`, `useSaveTextFile()` from `../data/useStorageData`; `useTranslation` from `@/core/i18n`; `appToast` from `@/lib/toast`; `StorageNode` from `../data/types`.
- Produces (used by Tasks 2 & 3):

  ```ts
  export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
  export function useDocumentEditorSession(opts: {
    nodeId: string | null;
    onNodeIdChange: (id: string) => void;
  }): {
    node: StorageNode | null;
    markdown: string | null;
    status: SaveStatus;
    statusLabel: string;
    handleChange: (next: string) => void;
    flush: () => Promise<string | null>; // resolves to the (possibly remapped) node id
    isLoading: boolean;
    error: unknown;
  };
  ```

- [ ] **Step 1: Run the existing modal tests to confirm the baseline is green**

Run: `cd /Users/huti/Desktop/Projects/OktaviusV3/oktavius-v3 && pnpm --filter @oktavius/web test -- StorageDocumentEditorModal --run`
Expected: 4 tests PASS (this is the behavior the refactor must preserve).

- [ ] **Step 2: Create the hook**

Create `apps/web/src/modules/storage/data/useDocumentEditorSession.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { StorageNode } from './types';
import { useFileTextContent, useSaveTextFile, useStorageNode } from './useStorageData';

const AUTOSAVE_DELAY_MS = 1500;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function useDocumentEditorSession({
  nodeId,
  onNodeIdChange,
}: {
  nodeId: string | null;
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
  const markdownRef = useRef<string | null>(null);
  const nodeRef = useRef<StorageNode | null>(null);
  nodeRef.current = node;

  // Load text into local state once it arrives (and when switching files).
  // Skip while the user has unsaved edits or a save is in flight, so a refetch
  // triggered by the post-save node-id remap can't stomp in-progress keystrokes.
  useEffect(() => {
    if (contentQuery.data === undefined) return;
    if (dirtyRef.current || status === 'saving') return;
    setMarkdown(contentQuery.data);
    markdownRef.current = contentQuery.data;
    setStatus('idle');
  }, [contentQuery.data, status]);

  const flush = useCallback(async (): Promise<string | null> => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const activeNode = nodeRef.current;
    const current = markdownRef.current;
    if (!activeNode) return null;
    if (!dirtyRef.current || current === null) return activeNode.id;
    setStatus('saving');
    try {
      const saved = await saveMutation.mutateAsync({ node: activeNode, markdown: current });
      dirtyRef.current = false;
      setStatus('saved');
      if (saved.id !== activeNode.id) onNodeIdChange(saved.id);
      return saved.id;
    } catch (error) {
      setStatus('error');
      appToast.fromApiError(error, t('storage.editor.saveFailed'));
      return activeNode.id;
    }
  }, [onNodeIdChange, saveMutation, t]);

  const handleChange = useCallback(
    (next: string) => {
      setMarkdown(next);
      markdownRef.current = next;
      dirtyRef.current = true;
      setStatus('dirty');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  // Cancel any pending autosave if the consumer unmounts.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

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
          : status === 'error'
            ? t('storage.editor.saveFailed')
            : '';

  return {
    node,
    markdown,
    status,
    statusLabel,
    handleChange,
    flush,
    isLoading: contentQuery.isLoading || markdown === null,
    error: contentQuery.error,
  };
}
```

- [ ] **Step 3: Refactor the modal to consume the hook**

Replace the entire body of `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx` with:

```tsx
import { Dialog, DialogContent, DialogTitle, MarkdownEditor } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { CloseIcon } from '@/lib/icons';

import { useDocumentEditorSession } from '../data/useDocumentEditorSession';

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
  const { node, markdown, statusLabel, handleChange, flush, isLoading, error } =
    useDocumentEditorSession({ nodeId, onNodeIdChange });

  const handleClose = () => {
    void flush();
    onClose();
  };

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
            data-testid="editor-close"
            aria-label={t('storage.editor.close')}
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('storage.editor.loading')}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{t('storage.editor.loadFailed')}</p>
        ) : (
          <MarkdownEditor
            value={markdown ?? ''}
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

(The "open in full page" button is added in Task 2; this step is the pure refactor.)

- [ ] **Step 4: Run the modal tests to verify behavior is preserved**

Run: `pnpm --filter @oktavius/web test -- StorageDocumentEditorModal --run`
Expected: all 4 tests PASS (autosave + remap, flush-on-close, no-save-when-unedited, no-overwrite-while-dirty).

- [ ] **Step 5: Typecheck the package**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/storage/data/useDocumentEditorSession.ts apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx
git commit -m "refactor(storage): extract useDocumentEditorSession from editor modal"
```

---

### Task 2: Add `doc` route state + "open in full page" button on the modal

**Files:**

- Modify: `apps/web/src/modules/storage/useStorageViewState.ts`
- Modify: `apps/web/src/lib/icons.ts` (add `ExpandIcon`)
- Modify: `packages/i18n/locales/en/storage.json`, `packages/i18n/locales/de/storage.json` (add `editor.openFullPage`)
- Modify: `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx` (wire `onOpenFullPage`)
- Test: `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx` (add expand-button test)
- Modify (type fix): `apps/web/src/modules/storage/components/StorageMainPane.test.tsx` (extend `makeState`)

**Interfaces:**

- Consumes: `flush()` from Task 1's hook (returns the resolved node id).
- Produces (used by Task 3):

  ```ts
  // added to StorageViewState
  documentNodeId: string | null;
  openDocument: (id: string) => void;
  closeDocument: () => void;
  // added to the modal
  onOpenFullPage?: (nodeId: string) => void;
  ```

- [ ] **Step 1: Add the `ExpandIcon` export**

In `apps/web/src/lib/icons.ts`, in the export block that already contains `ArrowsOutLineHorizontal as FullWidthIcon`, add an alias on its own line:

```ts
  ArrowsOut as ExpandIcon,
```

- [ ] **Step 2: Add the i18n key (EN + DE)**

In `packages/i18n/locales/en/storage.json`, inside the `"editor"` object, after `"close": "Close"` add a comma and:

```json
    "openFullPage": "Open in full page",
    "backToStorage": "Back to storage",
    "titleLabel": "Document title"
```

In `packages/i18n/locales/de/storage.json`, inside the `"editor"` object, after `"close": "Schließen"` add a comma and:

```json
    "openFullPage": "In Vollbild öffnen",
    "backToStorage": "Zurück zum Speicher",
    "titleLabel": "Dokumenttitel"
```

(`backToStorage`/`titleLabel` are used in Task 3; added here so both locale files change once.)

- [ ] **Step 3: Add `documentNodeId` / `openDocument` / `closeDocument` to the view state**

In `apps/web/src/modules/storage/useStorageViewState.ts`:

Add to the `StorageViewState` interface (after `editingNodeId`/`setEditingNodeId`):

```ts
  documentNodeId: string | null;
  openDocument: (id: string) => void;
  closeDocument: () => void;
```

In the hook body, after the `currentFolderId` line add:

```ts
const documentNodeId = searchParams.get('doc');
```

Add these callbacks (next to `openFolder`):

```ts
const openDocument = useCallback(
  (id: string) => {
    setSearchParams((params) => {
      params.set('doc', id);
      return params;
    });
  },
  [setSearchParams],
);

const closeDocument = useCallback(() => {
  setSearchParams((params) => {
    params.delete('doc');
    return params;
  });
}, [setSearchParams]);
```

Add `documentNodeId`, `openDocument`, `closeDocument` to the returned object.

- [ ] **Step 4: Add the expand button + `onOpenFullPage` prop to the modal**

In `apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx`:

Update the import to include `ExpandIcon`:

```tsx
import { CloseIcon, ExpandIcon } from '@/lib/icons';
```

Add `onOpenFullPage` to the props:

```tsx
export function StorageDocumentEditorModal({
  nodeId,
  onClose,
  onNodeIdChange,
  onOpenFullPage,
}: {
  nodeId: string | null;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
  onOpenFullPage?: (nodeId: string) => void;
}) {
```

Add the handler (below `handleClose`):

```tsx
const handleOpenFullPage = async () => {
  const id = await flush();
  if (id) onOpenFullPage?.(id);
};
```

In the header row, insert the expand button just before the close button:

```tsx
{
  onOpenFullPage ? (
    <button
      type="button"
      data-testid="editor-open-full-page"
      aria-label={t('storage.editor.openFullPage')}
      className="text-muted-foreground hover:text-foreground"
      onClick={() => void handleOpenFullPage()}
    >
      <ExpandIcon size={18} />
    </button>
  ) : null;
}
```

- [ ] **Step 5: Wire `onOpenFullPage` in StorageMainPane**

In `apps/web/src/modules/storage/components/StorageMainPane.tsx`, update the rendered modal (currently around line 332):

```tsx
<StorageDocumentEditorModal
  nodeId={state.editingNodeId}
  onClose={() => state.setEditingNodeId(null)}
  onNodeIdChange={(id) => state.setEditingNodeId(id)}
  onOpenFullPage={(id) => {
    state.setEditingNodeId(null);
    state.openDocument(id);
  }}
/>
```

- [ ] **Step 6: Fix the `makeState` helper in StorageMainPane.test**

In `apps/web/src/modules/storage/components/StorageMainPane.test.tsx`, add to the object returned by `makeState` (next to `setEditingNodeId: vi.fn()`):

```tsx
    documentNodeId: null,
    openDocument: vi.fn(),
    closeDocument: vi.fn(),
```

- [ ] **Step 7: Write the failing expand-button test**

In `apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx`, add inside the `describe` block:

```tsx
it('opens the current document in full page after flushing', async () => {
  const onOpenFullPage = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <TestI18nProvider>
          <StorageDocumentEditorModal
            nodeId="n1"
            onClose={vi.fn()}
            onNodeIdChange={vi.fn()}
            onOpenFullPage={onOpenFullPage}
          />
        </TestI18nProvider>
      </QueryClientProvider>,
    );
  });

  const expandBtn = document.querySelector<HTMLButtonElement>(
    '[data-testid="editor-open-full-page"]',
  )!;
  await act(async () => {
    expandBtn.click();
  });

  // No edits were made, so flush resolves to the current node id without saving.
  expect(save).not.toHaveBeenCalled();
  expect(onOpenFullPage).toHaveBeenCalledWith('n1');
});
```

- [ ] **Step 8: Run the modal tests**

Run: `pnpm --filter @oktavius/web test -- StorageDocumentEditorModal --run`
Expected: 5 tests PASS (the 4 original + the new expand test).

- [ ] **Step 9: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors (confirms `makeState` and `StorageViewState` are consistent).

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/lib/icons.ts packages/i18n/locales/en/storage.json packages/i18n/locales/de/storage.json apps/web/src/modules/storage/useStorageViewState.ts apps/web/src/modules/storage/components/StorageDocumentEditorModal.tsx apps/web/src/modules/storage/components/StorageDocumentEditorModal.test.tsx apps/web/src/modules/storage/components/StorageMainPane.tsx apps/web/src/modules/storage/components/StorageMainPane.test.tsx
git commit -m "feat(storage): add open-in-full-page button and doc route state"
```

---

### Task 3: Build `StorageDocumentEditorPage` and route to it from `StoragePage`

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageDocumentEditorPage.tsx`
- Create: `apps/web/src/modules/storage/components/StorageDocumentEditorPage.test.tsx`
- Modify: `apps/web/src/modules/storage/StoragePage.tsx`
- Modify: `apps/web/src/modules/storage/StoragePage.test.tsx` (add routing test)

**Interfaces:**

- Consumes: `useDocumentEditorSession` (Task 1); `documentNodeId`/`openDocument`/`closeDocument` (Task 2); `useStorageMutations().rename` and `isEditableTextFile` from existing storage code; `MODULE_PAGE_FILL_CLASS` from `@/components/common/pageChrome`; `useRegisterFillHeightPage` from `@/components/layout/AppShellLayoutContext`; `BackIcon` from `@/lib/icons`.
- Produces:

  ```tsx
  export function StorageDocumentEditorPage(props: {
    nodeId: string;
    onClose: () => void;
    onNodeIdChange: (id: string) => void;
  }): JSX.Element;
  ```

- [ ] **Step 1: Create the editor page component**

Create `apps/web/src/modules/storage/components/StorageDocumentEditorPage.tsx`:

```tsx
import { MarkdownEditor, cn } from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { MODULE_PAGE_FILL_CLASS } from '@/components/common/pageChrome';
import { useRegisterFillHeightPage } from '@/components/layout/AppShellLayoutContext';
import { useTranslation } from '@/core/i18n';
import { BackIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { useDocumentEditorSession } from '../data/useDocumentEditorSession';
import { isEditableTextFile } from '../data/textFiles';
import { useStorageMutations } from '../data/useStorageData';

export function StorageDocumentEditorPage({
  nodeId,
  onClose,
  onNodeIdChange,
}: {
  nodeId: string;
  onClose: () => void;
  onNodeIdChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  useRegisterFillHeightPage(true);

  const { node, markdown, statusLabel, handleChange, isLoading, error } = useDocumentEditorSession({
    nodeId,
    onNodeIdChange,
  });
  const { rename } = useStorageMutations();
  const [title, setTitle] = useState('');

  // Keep the title input in sync with the loaded/renamed node.
  useEffect(() => {
    if (node) setTitle(node.name);
  }, [node?.id, node?.name]);

  // Bounce back to the grid if the doc param points at a non-editable node.
  useEffect(() => {
    if (node && !isEditableTextFile(node)) onClose();
  }, [node, onClose]);

  const commitTitle = () => {
    const next = title.trim();
    if (!node || !next || next === node.name) {
      if (node) setTitle(node.name);
      return;
    }
    rename.mutate(
      { id: node.id, name: next },
      { onError: (err) => appToast.fromApiError(err, t('storage.editor.saveFailed')) },
    );
  };

  return (
    <div
      className={cn(MODULE_PAGE_FILL_CLASS, 'min-w-0 max-w-full')}
      data-testid="storage-document-editor"
    >
      <header className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          data-testid="editor-back"
          aria-label={t('storage.editor.backToStorage')}
          className="flex h-9 w-9 items-center justify-center rounded-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={onClose}
        >
          <BackIcon size={18} />
        </button>
        <input
          aria-label={t('storage.editor.titleLabel')}
          className="min-w-0 flex-1 truncate bg-transparent text-base font-semibold text-foreground outline-none focus:rounded-card focus:bg-muted/40 focus:px-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={commitTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape' && node) {
              setTitle(node.name);
              event.currentTarget.blur();
            }
          }}
        />
        <span className="shrink-0 text-xs text-muted-foreground" data-testid="save-status">
          {statusLabel}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-card bg-muted/30 px-4 py-8 [scrollbar-gutter:stable]">
        {isLoading ? (
          <p className="mx-auto max-w-[816px] text-sm text-muted-foreground">
            {t('storage.editor.loading')}
          </p>
        ) : error ? (
          <p className="mx-auto max-w-[816px] text-sm text-destructive">
            {t('storage.editor.loadFailed')}
          </p>
        ) : (
          <div className="mx-auto w-full max-w-[816px] rounded-card bg-card px-10 py-12 shadow-sm md:px-14">
            <MarkdownEditor
              value={markdown ?? ''}
              onChange={handleChange}
              aria-label={node?.name}
              minHeightClassName="min-h-[55vh]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Route to the editor page from `StoragePage`**

In `apps/web/src/modules/storage/StoragePage.tsx`, add the import:

```tsx
import { StorageDocumentEditorPage } from './components/StorageDocumentEditorPage';
```

After the `if (!ready) return null;` line, add the doc branch (before the `return <ModulePage …>`):

```tsx
if (state.documentNodeId) {
  return (
    <StorageDocumentEditorPage
      nodeId={state.documentNodeId}
      onClose={() => state.closeDocument()}
      onNodeIdChange={(id) => state.openDocument(id)}
    />
  );
}
```

- [ ] **Step 3: Write the failing editor-page test**

Create `apps/web/src/modules/storage/components/StorageDocumentEditorPage.test.tsx`:

```tsx
import type * as BaseUi from '@oktavius/base-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';
import { StorageDocumentEditorPage } from './StorageDocumentEditorPage';

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

const rename = vi.fn();

vi.mock('@/components/layout/AppShellLayoutContext', () => ({
  useRegisterFillHeightPage: vi.fn(),
}));

vi.mock('@oktavius/base-ui', async (importOriginal) => {
  const actual = await importOriginal<typeof BaseUi>();
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
  useSaveTextFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useStorageMutations: () => ({ rename: { mutate: rename } }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  rename.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderPage(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() => {
    root.render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <TestI18nProvider>
            <StorageDocumentEditorPage nodeId="n1" onClose={onClose} onNodeIdChange={vi.fn()} />
          </TestI18nProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  });
}

describe('StorageDocumentEditorPage', () => {
  it('renders the document title and editor surface', () => {
    renderPage();
    expect(container.querySelector('[data-testid="storage-document-editor"]')).not.toBeNull();
    const title = container.querySelector<HTMLInputElement>('input[aria-label]')!;
    expect(title.value).toBe('Notes.md');
  });

  it('calls onClose when the back button is clicked', () => {
    const onClose = vi.fn();
    renderPage(onClose);
    const back = container.querySelector<HTMLButtonElement>('[data-testid="editor-back"]')!;
    act(() => back.click());
    expect(onClose).toHaveBeenCalled();
  });

  it('renames via the mutation when the title is committed', () => {
    renderPage();
    const title = container.querySelector<HTMLInputElement>('input[aria-label]')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(title, 'Renamed.md');
      title.dispatchEvent(new Event('input', { bubbles: true }));
      title.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    expect(rename).toHaveBeenCalledWith({ id: 'n1', name: 'Renamed.md' }, expect.anything());
  });
});
```

- [ ] **Step 4: Run the editor-page test**

Run: `pnpm --filter @oktavius/web test -- StorageDocumentEditorPage --run`
Expected: 3 tests PASS.

- [ ] **Step 5: Add a routing test to StoragePage.test**

In `apps/web/src/modules/storage/StoragePage.test.tsx`, the storage queries return `[]` via the stubbed `fetch`, so `useStorageNode('n1')` resolves to an empty/undefined node and the editor page renders its loading state (still mounting the `storage-document-editor` container). Add this test inside the `describe('StoragePage', …)` block:

```tsx
it('renders the full-page document editor when the doc param is set', async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/storage?doc=n1']}>
        <QueryClientProvider client={queryClient}>
          <TestI18nProvider>
            <StoragePage />
          </TestI18nProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );
  });
  expect(container.querySelector('[data-testid="storage-document-editor"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="storage-main"]')).toBeNull();
});
```

- [ ] **Step 6: Run the StoragePage tests**

Run: `pnpm --filter @oktavius/web test -- StoragePage --run`
Expected: 2 tests PASS (the original rail/main test + the new routing test).

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter @oktavius/web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/modules/storage/components/StorageDocumentEditorPage.tsx apps/web/src/modules/storage/components/StorageDocumentEditorPage.test.tsx apps/web/src/modules/storage/StoragePage.tsx apps/web/src/modules/storage/StoragePage.test.tsx
git commit -m "feat(storage): full-page document editor reachable via ?doc route"
```

---

### Task 4: Verify the "New text file" create flow end to end

This addresses the original complaint that "New text file" seemed to do nothing. The entry point stays the right-click context menu (per the spec decision); this task confirms the create → open flow actually works and fixes it if not.

**Files:**

- Inspect: `apps/web/src/modules/storage/components/StorageMainPane.tsx:136-150` (`createTextFile`)
- Inspect: `apps/web/src/modules/storage/data/uploadFile.ts`

- [ ] **Step 1: Run the full storage test suite**

Run: `pnpm --filter @oktavius/web test -- storage --run`
Expected: all storage tests PASS (regression guard for Tasks 1–3).

- [ ] **Step 2: Launch the app and exercise the flow**

Use the `run` skill (or `pnpm --filter @oktavius/web dev`) to open the app, navigate to **Storage**, right-click empty pane space → **New text file**.

Expected observable behavior:

1. A new `Untitled.md` (or `Untitled-N.md`) appears in the current folder.
2. The editor **modal** opens immediately on the new file.
3. Clicking the **expand** icon in the modal header opens the full-page editor at `…/storage?doc=<id>`.
4. Typing autosaves (status goes `Unsaved changes` → `Saving…` → `Saved`); the back arrow returns to the grid.

- [ ] **Step 3: If the flow is broken, debug with systematic-debugging**

If "New text file" produces no file or no editor, inspect `createTextFile` and `uploadFile`:

- Confirm `uploadFile(client, markdownToFile(name, ''), folderId)` resolves and returns `{ node }` with a real `node.id`.
- Confirm `state.setEditingNodeId(node.id)` runs after `invalidate()`.
- Confirm `appToast.fromApiError` isn't swallowing an error silently (check the network tab / console).

Apply the minimal fix, re-run Step 1, and re-verify Step 2. Use the `superpowers:systematic-debugging` skill.

- [ ] **Step 4: Commit any fix (only if changes were needed)**

```bash
git add -A apps/web/src/modules/storage
git commit -m "fix(storage): ensure New text file creates and opens the editor"
```

---

## Self-Review

**Spec coverage:**

- Goal 1 (full-page editor reachable via button) → Tasks 2 (button) + 3 (page/route). ✓
- Goal 2 (keep modal; identical saving) → Task 1 (shared `useDocumentEditorSession`). ✓
- Goal 3 (verify New text file) → Task 4. ✓
- Decision: modal + expand button → Task 2. ✓
- Decision: keep left nav, doc-focused header → Task 3 (`useRegisterFillHeightPage`, custom header, no `ModulePage`). ✓
- Decision: New text file keeps opening the modal → unchanged `createTextFile`; verified in Task 4. ✓
- Decision: inline-renameable title → Task 3 (`commitTitle` via `rename` mutation). ✓
- Error handling: save failure toast (hook), non-editable `doc` bounces to grid (page effect), `beforeunload` guard (hook). ✓
- Testing: hook behavior via modal tests; expand button; page render/back/rename; StoragePage routing. ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code; every command has an expected result. ✓

**Type consistency:** `useDocumentEditorSession` signature matches its consumers in Tasks 2/3; `flush(): Promise<string | null>` consumed in modal expand handler; `documentNodeId`/`openDocument`/`closeDocument` added to `StorageViewState` and mirrored in `makeState` (Task 2 Step 6); `onOpenFullPage?: (nodeId: string) => void` consistent between modal and StorageMainPane. ✓
