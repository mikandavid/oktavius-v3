# Storage Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished file-explorer ("Storage") module in the oktavius-v3 web app, wired to the real osiris storage backend, replacing the osiris ERP storage frontend.

**Architecture:** A self-contained module at `apps/web/src/modules/storage/`. A typed osiris client (`storageClient.ts`, mirroring `membersAdminClient.ts`) is wrapped in react-query hooks. `StoragePage` renders a `ModulePage` shell containing a folder-tree rail + main pane (grid/list), with a right details `Drawer` on single-click and a full-screen preview `Dialog` on double-click. Scope is the **core explorer** only (see spec).

**Tech Stack:** React 19, TypeScript, react-router v7, @tanstack/react-query, Tailwind v3 + semantic tokens, `@oktavius/base-ui`, vitest.

**Spec:** `docs/superpowers/specs/2026-06-13-storage-module-design.md`

**Conventions used throughout this plan:**

- Run a single test file: `pnpm --filter @oktavius/web exec vitest run <path>`
- Typecheck: `pnpm --filter @oktavius/web typecheck`
- Lint: `pnpm --filter @oktavius/web lint`
- All imports of base-ui come from `@oktavius/base-ui`; all icons from `@/lib/icons`.
- `activeOrgId` always comes from `useOptionalOsirisRuntime()?.activeOrgId ?? null`.

---

## Task 1: Register the `storage` module (nav, route, types, icon, i18n)

This makes `/storage` reachable with a placeholder page; later tasks fill in the page body.

**Files:**

- Modify: `apps/web/src/lib/org-profiles/types.ts` (add `'storage'` to `OrgModuleId`)
- Modify: `apps/web/src/lib/org-profiles/profiles.ts` (add `'storage'` to `DEFAULT_ORG_MODULES`)
- Modify: `apps/web/src/lib/appNavModules.ts` (add nav entry + import `FolderIcon`)
- Modify: `apps/web/src/lib/modulePageIcons.tsx` (add `storagePageIcon`)
- Create: `packages/i18n/locales/en/storage.json`
- Create: `packages/i18n/locales/de/storage.json`
- Modify: `packages/i18n/locales/en/navigation.json` and `packages/i18n/locales/de/navigation.json` (add `storage` key)
- Create: `apps/web/src/modules/storage/StoragePage.tsx` (placeholder, replaced in Task 5)

- [ ] **Step 1: Add `'storage'` to the `OrgModuleId` union**

In `apps/web/src/lib/org-profiles/types.ts`, add `| 'storage'` to the union (place it after `'reports'`):

```ts
export type OrgModuleId =
  | 'dashboard'
  | 'ai-chat'
  | 'email'
  | 'calendar'
  | 'reports'
  | 'storage'
  | 'members'
  | 'settings'
  | 'showcase';
```

- [ ] **Step 2: Enable storage by default**

In `apps/web/src/lib/org-profiles/profiles.ts`, add `'storage'` to `DEFAULT_ORG_MODULES` (after `'reports'`):

```ts
const DEFAULT_ORG_MODULES: OrgModuleId[] = [
  'dashboard',
  'ai-chat',
  'email',
  'calendar',
  'reports',
  'storage',
  'members',
  'settings',
];
```

- [ ] **Step 3: Add the placeholder page**

Create `apps/web/src/modules/storage/StoragePage.tsx`:

```tsx
import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { storagePageIcon } from '@/lib/modulePageIcons';

export function StoragePage() {
  const { ready } = usePreloadNamespaces(['storage']);
  const { t } = useTranslation();

  if (!ready) return null;

  return (
    <ModulePage
      title={t('storage.pageTitle', undefined, 'Storage')}
      subtitle={t('storage.subtitle', undefined, 'Files and folders')}
      icon={storagePageIcon()}
    >
      <div className="text-sm text-muted-foreground">Storage module — coming together.</div>
    </ModulePage>
  );
}
```

- [ ] **Step 4: Add `storagePageIcon`**

In `apps/web/src/lib/modulePageIcons.tsx`, add `FolderIcon` to the icon import block and export the helper next to the other `*PageIcon` exports:

```tsx
export const storagePageIcon = () => modulePageIcon(FolderIcon);
```

(Add `FolderIcon,` to the existing `from '@/lib/icons'` import list, keeping it alphabetical.)

- [ ] **Step 5: Register the nav/route entry**

In `apps/web/src/lib/appNavModules.ts`, add `FolderIcon` to the `@/lib/icons` import block (top of file), then add this entry to `APP_NAV_MODULES` immediately after the `reports` entry:

```ts
  {
    id: 'storage',
    path: '/storage',
    label: 'Storage',
    labelKey: 'navigation.storage',
    icon: FolderIcon,
    section: 'modules',
    permission: 'storage.view',
    loadPage: () => import('@/modules/storage/StoragePage'),
    pageExport: 'StoragePage',
  },
```

- [ ] **Step 6: Add i18n namespace files**

Create `packages/i18n/locales/en/storage.json`:

```json
{
  "pageTitle": "Storage",
  "subtitle": "Files and folders",
  "nav": {
    "all": "All files",
    "recent": "Recent",
    "starred": "Starred",
    "trash": "Trash"
  },
  "folders": "Folders",
  "newFolder": "New folder",
  "actions": {
    "upload": "Upload",
    "open": "Open",
    "download": "Download",
    "rename": "Rename",
    "move": "Move",
    "star": "Add to starred",
    "unstar": "Remove from starred",
    "trash": "Move to trash",
    "restore": "Restore",
    "deleteForever": "Delete forever"
  },
  "search": {
    "placeholder": "Search files…",
    "scopeCurrent": "This folder",
    "scopeGlobal": "Everywhere"
  },
  "sort": {
    "name": "Name",
    "updatedAt": "Modified",
    "fileSizeBytes": "Size"
  },
  "columns": { "name": "Name", "size": "Size", "modified": "Modified" },
  "details": {
    "title": "Details",
    "size": "Size",
    "type": "Type",
    "modified": "Modified",
    "created": "Created",
    "folder": "Folder"
  },
  "empty": {
    "folder": "This folder is empty",
    "recent": "No recent files",
    "starred": "No starred files",
    "trash": "Trash is empty",
    "search": "No files match your search"
  },
  "upload": {
    "dropHere": "Drop files to upload",
    "uploading": "Uploading {{name}}",
    "failed": "Upload failed: {{name}}",
    "duplicate": "{{name}} already exists in storage"
  },
  "dialogs": {
    "newFolderTitle": "New folder",
    "newFolderLabel": "Folder name",
    "renameTitle": "Rename",
    "renameLabel": "New name",
    "moveTitle": "Move to",
    "trashTitle": "Move to trash?",
    "trashBody": "{{name}} will be moved to trash and can be restored within 30 days.",
    "purgeTitle": "Delete forever?",
    "purgeBody": "{{name}} will be permanently deleted. This cannot be undone.",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "create": "Create",
    "save": "Save"
  },
  "usage": "{{used}} of {{limit}} used",
  "errors": {
    "load": "Files could not be loaded.",
    "quota": "Storage limit reached. Free up space and try again."
  }
}
```

Create `packages/i18n/locales/de/storage.json` with the same keys, German values:

```json
{
  "pageTitle": "Ablage",
  "subtitle": "Dateien und Ordner",
  "nav": {
    "all": "Alle Dateien",
    "recent": "Zuletzt",
    "starred": "Favoriten",
    "trash": "Papierkorb"
  },
  "folders": "Ordner",
  "newFolder": "Neuer Ordner",
  "actions": {
    "upload": "Hochladen",
    "open": "Öffnen",
    "download": "Herunterladen",
    "rename": "Umbenennen",
    "move": "Verschieben",
    "star": "Zu Favoriten",
    "unstar": "Aus Favoriten entfernen",
    "trash": "In den Papierkorb",
    "restore": "Wiederherstellen",
    "deleteForever": "Endgültig löschen"
  },
  "search": {
    "placeholder": "Dateien suchen…",
    "scopeCurrent": "Dieser Ordner",
    "scopeGlobal": "Überall"
  },
  "sort": {
    "name": "Name",
    "updatedAt": "Geändert",
    "fileSizeBytes": "Größe"
  },
  "columns": { "name": "Name", "size": "Größe", "modified": "Geändert" },
  "details": {
    "title": "Details",
    "size": "Größe",
    "type": "Typ",
    "modified": "Geändert",
    "created": "Erstellt",
    "folder": "Ordner"
  },
  "empty": {
    "folder": "Dieser Ordner ist leer",
    "recent": "Keine zuletzt verwendeten Dateien",
    "starred": "Keine Favoriten",
    "trash": "Papierkorb ist leer",
    "search": "Keine Dateien gefunden"
  },
  "upload": {
    "dropHere": "Dateien zum Hochladen ablegen",
    "uploading": "Lädt {{name}} hoch",
    "failed": "Hochladen fehlgeschlagen: {{name}}",
    "duplicate": "{{name}} ist bereits in der Ablage vorhanden"
  },
  "dialogs": {
    "newFolderTitle": "Neuer Ordner",
    "newFolderLabel": "Ordnername",
    "renameTitle": "Umbenennen",
    "renameLabel": "Neuer Name",
    "moveTitle": "Verschieben nach",
    "trashTitle": "In den Papierkorb?",
    "trashBody": "{{name}} wird in den Papierkorb verschoben und kann 30 Tage lang wiederhergestellt werden.",
    "purgeTitle": "Endgültig löschen?",
    "purgeBody": "{{name}} wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.",
    "confirm": "Bestätigen",
    "cancel": "Abbrechen",
    "create": "Erstellen",
    "save": "Speichern"
  },
  "usage": "{{used}} von {{limit}} belegt",
  "errors": {
    "load": "Dateien konnten nicht geladen werden.",
    "quota": "Speicherlimit erreicht. Bitte Speicher freigeben und erneut versuchen."
  }
}
```

- [ ] **Step 7: Add the navigation label key**

In `packages/i18n/locales/en/navigation.json` add `"storage": "Storage",` and in `packages/i18n/locales/de/navigation.json` add `"storage": "Ablage",` (alongside the existing module keys; match the file's existing structure — if keys are flat, add a flat key, if nested under an object, match that).

- [ ] **Step 8: Typecheck + lint + smoke-run the app**

Run: `pnpm --filter @oktavius/web typecheck`
Expected: PASS (no type errors).

Run: `pnpm --filter @oktavius/web lint`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src/lib/org-profiles/types.ts apps/web/src/lib/org-profiles/profiles.ts apps/web/src/lib/appNavModules.ts apps/web/src/lib/modulePageIcons.tsx apps/web/src/modules/storage/StoragePage.tsx packages/i18n/locales/en/storage.json packages/i18n/locales/de/storage.json packages/i18n/locales/en/navigation.json packages/i18n/locales/de/navigation.json
git commit -m "feat(storage): register module, nav, route, i18n scaffolding"
```

---

## Task 2: Types and file-type helpers

**Files:**

- Create: `apps/web/src/modules/storage/data/types.ts`
- Create: `apps/web/src/modules/storage/data/fileTypes.ts`
- Test: `apps/web/src/modules/storage/data/fileTypes.test.ts`

- [ ] **Step 1: Write the types**

Create `apps/web/src/modules/storage/data/types.ts`:

```ts
export type StorageNodeType = 'folder' | 'file';
export type UploadStatus = 'pending' | 'uploading' | 'ready' | 'failed';

export interface StorageNode {
  id: string;
  parentId: string | null;
  nodeType: StorageNodeType;
  name: string;
  mimeType: string | null;
  fileExtension: string | null;
  fileSizeBytes: number | null;
  uploadStatus: UploadStatus;
  trashedAt: string | null;
  purgeAfterAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageTreeNode extends StorageNode {
  children: StorageTreeNode[];
}

export interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export interface NodeListResult {
  data: StorageNode[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UploadSession {
  sessionId: string;
  nodeId: string;
  signedUrl: string;
  bucket: string;
  expiresAt: string | null;
  mimeType: string;
}

export interface FinalizeUploadResult {
  node: StorageNode;
  duplicateOfNodeId: string | null;
}

export type StorageView = 'folder' | 'recent' | 'starred' | 'trash';
export type StorageSortBy = 'name' | 'updatedAt' | 'fileSizeBytes';
export type StorageSortDir = 'asc' | 'desc';
export type StorageDisplayMode = 'grid' | 'list';
export type StorageSearchScope = 'current' | 'global';

export interface StorageSort {
  by: StorageSortBy;
  dir: StorageSortDir;
}

export interface ListNodesParams {
  folderId?: string | null;
  search?: string;
  scope?: StorageSearchScope;
  nodeType?: StorageNodeType;
  sortBy?: StorageSortBy;
  sortDir?: StorageSortDir;
  page?: number;
  pageSize?: number;
  trashed?: boolean;
  favoritesOnly?: boolean;
}
```

- [ ] **Step 2: Write the failing test for file-type helpers**

Create `apps/web/src/modules/storage/data/fileTypes.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { formatBytes, getFileKind } from './fileTypes';
import type { StorageNode } from './types';

function node(partial: Partial<StorageNode>): StorageNode {
  return {
    id: 'n1',
    parentId: null,
    nodeType: 'file',
    name: 'file',
    mimeType: null,
    fileExtension: null,
    fileSizeBytes: null,
    uploadStatus: 'ready',
    trashedAt: null,
    purgeAfterAt: null,
    createdBy: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  };
}

describe('formatBytes', () => {
  it('formats common sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(2_400_000)).toBe('2.3 MB');
  });

  it('handles null', () => {
    expect(formatBytes(null)).toBe('—');
  });
});

describe('getFileKind', () => {
  it('detects folders', () => {
    expect(getFileKind(node({ nodeType: 'folder' }))).toBe('folder');
  });
  it('detects images by mime', () => {
    expect(getFileKind(node({ mimeType: 'image/png' }))).toBe('image');
  });
  it('detects pdf by extension', () => {
    expect(getFileKind(node({ fileExtension: 'pdf' }))).toBe('pdf');
  });
  it('detects spreadsheets', () => {
    expect(getFileKind(node({ fileExtension: 'xlsx' }))).toBe('sheet');
  });
  it('falls back to other', () => {
    expect(getFileKind(node({ fileExtension: 'bin' }))).toBe('other');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/fileTypes.test.ts`
Expected: FAIL ("Cannot find module './fileTypes'").

- [ ] **Step 4: Implement the helpers**

Create `apps/web/src/modules/storage/data/fileTypes.ts`:

```tsx
import {
  DocumentIcon,
  FileSpreadsheetIcon,
  FolderIcon,
  type IconProps,
  ImageIcon,
} from '@/lib/icons';
import type { ComponentType } from 'react';

import type { StorageNode } from './types';

export type FileKind = 'folder' | 'image' | 'pdf' | 'sheet' | 'text' | 'other';

export function getFileKind(node: StorageNode): FileKind {
  if (node.nodeType === 'folder') return 'folder';
  const mime = (node.mimeType ?? '').toLowerCase();
  const ext = (node.fileExtension ?? '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['xlsx', 'xls', 'xlsm', 'csv'].includes(ext) || mime.includes('spreadsheet')) return 'sheet';
  if (mime.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'log'].includes(ext)) return 'text';
  return 'other';
}

const KIND_ICON: Record<FileKind, ComponentType<IconProps>> = {
  folder: FolderIcon,
  image: ImageIcon,
  pdf: DocumentIcon,
  sheet: FileSpreadsheetIcon,
  text: DocumentIcon,
  other: DocumentIcon,
};

export function fileIcon(node: StorageNode): ComponentType<IconProps> {
  return KIND_ICON[getFileKind(node)];
}

/** Subtle accent color class for the icon, per kind. */
export function fileAccentClass(kind: FileKind): string {
  switch (kind) {
    case 'folder':
      return 'text-cta';
    case 'image':
      return 'text-success';
    case 'pdf':
      return 'text-destructive';
    case 'sheet':
      return 'text-success';
    case 'text':
      return 'text-info';
    default:
      return 'text-muted-foreground';
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/fileTypes.test.ts`
Expected: PASS (all assertions green).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/modules/storage/data/types.ts apps/web/src/modules/storage/data/fileTypes.ts apps/web/src/modules/storage/data/fileTypes.test.ts
git commit -m "feat(storage): node types and file-type helpers"
```

---

## Task 3: The osiris storage client

Mirrors `apps/web/src/runtime/osiris/membersAdminClient.ts` exactly (fetch + `credentials:'include'` + `readErrorMessage` + tolerant normalization).

**Files:**

- Create: `apps/web/src/modules/storage/data/storageClient.ts`
- Test: `apps/web/src/modules/storage/data/storageClient.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/modules/storage/data/storageClient.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisStorageClient } from './storageClient';

const BASE = 'https://api.example.test/v1';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createOsirisStorageClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('lists nodes and normalizes snake_case payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: 'f1',
            parent_id: null,
            node_type: 'file',
            name: 'Q3.pdf',
            mime_type: 'application/pdf',
            file_extension: 'pdf',
            file_size_bytes: 2048,
            upload_status: 'ready',
            trashed_at: null,
            purge_after_at: null,
            created_by: 'u1',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-02T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        page_size: 50,
        total_pages: 1,
        has_more: false,
      }),
    );

    const client = createOsirisStorageClient({ baseUrl: BASE });
    const result = await client.listNodes({ folderId: 'root', sortBy: 'name', sortDir: 'asc' });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`${BASE}/storage?`);
    expect(url).toContain('folderId=root');
    expect(url).toContain('sortBy=name');
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: 'f1',
      parentId: null,
      nodeType: 'file',
      name: 'Q3.pdf',
      mimeType: 'application/pdf',
      fileExtension: 'pdf',
      fileSizeBytes: 2048,
      uploadStatus: 'ready',
    });
  });

  it('also accepts camelCase payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([{ id: 'd1', nodeType: 'folder', name: 'Sales', children: [] }]),
    );
    const client = createOsirisStorageClient({ baseUrl: BASE });
    const tree = await client.listTree();
    expect(tree[0]).toMatchObject({ id: 'd1', nodeType: 'folder', name: 'Sales' });
    expect(tree[0].children).toEqual([]);
  });

  it('creates a folder via POST', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ id: 'new', node_type: 'folder', name: 'Docs', parent_id: 'p1' }, 201),
    );
    const client = createOsirisStorageClient({ baseUrl: BASE });
    const node = await client.createFolder({ name: 'Docs', parentId: 'p1' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/storage/folders`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Docs', parentId: 'p1' });
    expect(node).toMatchObject({ id: 'new', nodeType: 'folder', name: 'Docs' });
  });

  it('moves nodes via bulk endpoint', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ moved: 1 }));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    await client.move(['n1'], 'target');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE}/storage/bulk/move`);
    expect(JSON.parse(init.body as string)).toEqual({ nodeIds: ['n1'], targetFolderId: 'target' });
  });

  it('returns a signed preview url', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ url: 'https://signed/preview' }));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    expect(await client.previewUrl('n1')).toBe('https://signed/preview');
  });

  it('throws the backend error message on failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'Nope' }, 400));
    const client = createOsirisStorageClient({ baseUrl: BASE });
    await expect(client.listTree()).rejects.toThrow('Nope');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/storageClient.test.ts`
Expected: FAIL ("Cannot find module './storageClient'").

- [ ] **Step 3: Implement the client**

Create `apps/web/src/modules/storage/data/storageClient.ts`:

```ts
import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type {
  FinalizeUploadResult,
  ListNodesParams,
  NodeListResult,
  StorageNode,
  StorageNodeType,
  StorageTreeNode,
  StorageUsage,
  UploadSession,
  UploadStatus,
} from './types';

export type OsirisStorageClientOptions = { baseUrl?: string };

const NODE_TYPES: readonly StorageNodeType[] = ['folder', 'file'];
const UPLOAD_STATUSES: readonly UploadStatus[] = ['pending', 'uploading', 'ready', 'failed'];

function readNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeNode(row: unknown): StorageNode {
  const v = readRecord(row);
  const nodeType = NODE_TYPES.includes((v.node_type ?? v.nodeType) as StorageNodeType)
    ? ((v.node_type ?? v.nodeType) as StorageNodeType)
    : 'file';
  const uploadStatus = UPLOAD_STATUSES.includes((v.upload_status ?? v.uploadStatus) as UploadStatus)
    ? ((v.upload_status ?? v.uploadStatus) as UploadStatus)
    : 'ready';
  return {
    id: readString(v.id),
    parentId: readStringOrNull(v.parent_id ?? v.parentId),
    nodeType,
    name: readString(v.name),
    mimeType: readStringOrNull(v.mime_type ?? v.mimeType),
    fileExtension: readStringOrNull(v.file_extension ?? v.fileExtension),
    fileSizeBytes: readNumberOrNull(v.file_size_bytes ?? v.fileSizeBytes),
    uploadStatus,
    trashedAt: readStringOrNull(v.trashed_at ?? v.trashedAt),
    purgeAfterAt: readStringOrNull(v.purge_after_at ?? v.purgeAfterAt),
    createdBy: readStringOrNull(v.created_by ?? v.createdBy),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function normalizeTreeNode(row: unknown): StorageTreeNode {
  const base = normalizeNode(row);
  const children = readRecord(row).children;
  return {
    ...base,
    children: Array.isArray(children) ? children.map(normalizeTreeNode) : [],
  };
}

function normalizeList(payload: unknown): NodeListResult {
  const v = readRecord(payload);
  const data = Array.isArray(v.data) ? v.data.map(normalizeNode) : [];
  return {
    data,
    total: readNumber(v.total, data.length),
    page: readNumber(v.page, 1),
    pageSize: readNumber(v.page_size ?? v.pageSize, data.length),
    totalPages: readNumber(v.total_pages ?? v.totalPages, 1),
    hasMore: Boolean(v.has_more ?? v.hasMore),
  };
}

function normalizeUsage(payload: unknown): StorageUsage {
  const v = readRecord(payload);
  return {
    usedBytes: readNumber(v.used_bytes ?? v.usedBytes),
    reservedBytes: readNumber(v.reserved_bytes ?? v.reservedBytes),
    limitBytes: readNumber(v.limit_bytes ?? v.limitBytes),
    availableBytes: readNumber(v.available_bytes ?? v.availableBytes),
    usagePercent: readNumber(v.usage_percent ?? v.usagePercent),
  };
}

function normalizeSession(payload: unknown): UploadSession {
  const v = readRecord(payload);
  return {
    sessionId: readString(v.session_id ?? v.sessionId),
    nodeId: readString(v.node_id ?? v.nodeId),
    signedUrl: readString(v.signed_url ?? v.signedUrl),
    bucket: readString(v.bucket),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    mimeType: readString(v.mime_type ?? v.mimeType),
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

export function createOsirisStorageClient(options: OsirisStorageClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function send(
    path: string,
    method: string,
    body: unknown,
    fallback: string,
  ): Promise<unknown> {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listTree(): Promise<StorageTreeNode[]> {
      const payload = await getJson('/storage/tree', 'Folders could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeTreeNode) : [];
    },

    async listNodes(params: ListNodesParams = {}): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage${buildQuery({ ...params })}`,
        'Files could not be loaded.',
      );
      return normalizeList(payload);
    },

    async search(params: {
      q: string;
      folderId?: string | null;
      scope?: string;
      page?: number;
      pageSize?: number;
    }): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage/search${buildQuery({ ...params })}`,
        'Search failed.',
      );
      return normalizeList(payload);
    },

    async getNode(id: string): Promise<StorageNode> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}`,
        'File could not be loaded.',
      );
      return normalizeNode(payload);
    },

    async previewUrl(id: string): Promise<string> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}/preview-url`,
        'Preview unavailable.',
      );
      return readString(readRecord(payload).url);
    },

    async downloadUrl(id: string): Promise<string> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}/download-url`,
        'Download unavailable.',
      );
      return readString(readRecord(payload).url);
    },

    async createFolder(input: { name: string; parentId?: string | null }): Promise<StorageNode> {
      const payload = await send(
        '/storage/folders',
        'POST',
        { name: input.name, parentId: input.parentId ?? null },
        'Folder could not be created.',
      );
      return normalizeNode(payload);
    },

    async rename(id: string, name: string): Promise<StorageNode> {
      const payload = await send(
        `/storage/${encodeURIComponent(id)}/name`,
        'PATCH',
        { name },
        'Rename failed.',
      );
      return normalizeNode(payload);
    },

    async move(nodeIds: string[], targetFolderId: string | null): Promise<void> {
      await send('/storage/bulk/move', 'POST', { nodeIds, targetFolderId }, 'Move failed.');
    },

    async trash(nodeIds: string[]): Promise<void> {
      await send('/storage/bulk/trash', 'POST', { nodeIds }, 'Move to trash failed.');
    },

    async restore(id: string): Promise<void> {
      await send(`/storage/${encodeURIComponent(id)}/restore`, 'POST', {}, 'Restore failed.');
    },

    async purge(nodeIds: string[]): Promise<void> {
      await send('/storage/bulk/purge', 'POST', { nodeIds }, 'Delete failed.');
    },

    async listFavorites(): Promise<StorageNode[]> {
      const payload = await getJson('/storage/favorites', 'Favorites could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeNode) : [];
    },

    async addFavorite(id: string): Promise<void> {
      await send(
        `/storage/favorites/${encodeURIComponent(id)}`,
        'POST',
        {},
        'Could not star file.',
      );
    },

    async removeFavorite(id: string): Promise<void> {
      await send(
        `/storage/favorites/${encodeURIComponent(id)}`,
        'DELETE',
        undefined,
        'Could not unstar file.',
      );
    },

    async listRecent(): Promise<StorageNode[]> {
      const payload = await getJson('/storage/recent', 'Recent files could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeNode) : [];
    },

    async listTrash(params: { page?: number; pageSize?: number } = {}): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage/trash${buildQuery({ ...params })}`,
        'Trash could not be loaded.',
      );
      return normalizeList(payload);
    },

    async usage(): Promise<StorageUsage> {
      const payload = await getJson('/storage/usage', 'Usage could not be loaded.');
      return normalizeUsage(payload);
    },

    async initiateUpload(input: {
      folderId?: string | null;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }): Promise<UploadSession> {
      const payload = await send(
        '/storage/uploads/initiate',
        'POST',
        {
          folderId: input.folderId ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
        },
        'Upload could not be started.',
      );
      return normalizeSession(payload);
    },

    async finalizeUpload(input: {
      sessionId: string;
      contentSha256?: string;
    }): Promise<FinalizeUploadResult> {
      const payload = await send(
        '/storage/uploads/finalize',
        'POST',
        { sessionId: input.sessionId, contentSha256: input.contentSha256 },
        'Upload could not be finalized.',
      );
      const v = readRecord(payload);
      return {
        node: normalizeNode(v.node),
        duplicateOfNodeId: readStringOrNull(v.duplicate_of_node_id ?? v.duplicateOfNodeId),
      };
    },

    async refreshUpload(input: { sessionId: string }): Promise<UploadSession> {
      const payload = await send(
        '/storage/uploads/refresh',
        'POST',
        { sessionId: input.sessionId },
        'Upload session could not be refreshed.',
      );
      return normalizeSession(payload);
    },
  };
}

export type OsirisStorageClient = ReturnType<typeof createOsirisStorageClient>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/storageClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/storage/data/storageClient.ts apps/web/src/modules/storage/data/storageClient.test.ts
git commit -m "feat(storage): osiris storage API client with normalization"
```

---

## Task 4: Query keys, client hook, and react-query data hooks

**Files:**

- Create: `apps/web/src/modules/storage/data/storageKeys.ts`
- Create: `apps/web/src/modules/storage/data/useStorageData.ts`
- Test: `apps/web/src/modules/storage/data/useStorageData.test.tsx`

- [ ] **Step 1: Write the query keys**

Create `apps/web/src/modules/storage/data/storageKeys.ts`:

```ts
import type { ListNodesParams } from './types';

type OrgId = string | null;

export const storageKeys = {
  root: (org: OrgId) => ['storage', org] as const,
  tree: (org: OrgId) => ['storage', org, 'tree'] as const,
  nodes: (org: OrgId, params: ListNodesParams) => ['storage', org, 'nodes', params] as const,
  favorites: (org: OrgId) => ['storage', org, 'favorites'] as const,
  recent: (org: OrgId) => ['storage', org, 'recent'] as const,
  trash: (org: OrgId, page: number) => ['storage', org, 'trash', page] as const,
  usage: (org: OrgId) => ['storage', org, 'usage'] as const,
  previewUrl: (org: OrgId, id: string) => ['storage', org, 'preview-url', id] as const,
  downloadUrl: (org: OrgId, id: string) => ['storage', org, 'download-url', id] as const,
};
```

- [ ] **Step 2: Write the hooks**

Create `apps/web/src/modules/storage/data/useStorageData.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createOsirisStorageClient } from './storageClient';
import { storageKeys } from './storageKeys';
import type { ListNodesParams } from './types';

export function useStorageClient() {
  return useMemo(() => createOsirisStorageClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

export function useStorageTree() {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.tree(org),
    queryFn: () => client.listTree(),
  });
}

export function useStorageNodes(params: ListNodesParams) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.nodes(org, params),
    queryFn: () => client.listNodes(params),
  });
}

export function useFavorites(enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.favorites(org),
    queryFn: () => client.listFavorites(),
    enabled,
  });
}

export function useRecent(enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.recent(org),
    queryFn: () => client.listRecent(),
    enabled,
  });
}

export function useTrash(page: number, enabled: boolean) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.trash(org, page),
    queryFn: () => client.listTrash({ page }),
    enabled,
  });
}

export function useStorageUsage() {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({ queryKey: storageKeys.usage(org), queryFn: () => client.usage() });
}

export function useFilePreviewUrl(id: string | null) {
  const client = useStorageClient();
  const org = useOrgId();
  return useQuery({
    queryKey: storageKeys.previewUrl(org, id ?? ''),
    queryFn: () => client.previewUrl(id as string),
    enabled: Boolean(id),
    staleTime: 9 * 60 * 1000,
  });
}

/** Invalidate the list/tree/usage queries after a mutation. */
export function useInvalidateStorage() {
  const queryClient = useQueryClient();
  const org = useOrgId();
  return () => {
    void queryClient.invalidateQueries({ queryKey: storageKeys.root(org) });
  };
}

export function useStorageMutations() {
  const client = useStorageClient();
  const invalidate = useInvalidateStorage();

  const createFolder = useMutation({
    mutationFn: (input: { name: string; parentId: string | null }) => client.createFolder(input),
    onSuccess: invalidate,
  });
  const rename = useMutation({
    mutationFn: (input: { id: string; name: string }) => client.rename(input.id, input.name),
    onSuccess: invalidate,
  });
  const move = useMutation({
    mutationFn: (input: { nodeIds: string[]; targetFolderId: string | null }) =>
      client.move(input.nodeIds, input.targetFolderId),
    onSuccess: invalidate,
  });
  const trash = useMutation({
    mutationFn: (nodeIds: string[]) => client.trash(nodeIds),
    onSuccess: invalidate,
  });
  const restore = useMutation({
    mutationFn: (id: string) => client.restore(id),
    onSuccess: invalidate,
  });
  const purge = useMutation({
    mutationFn: (nodeIds: string[]) => client.purge(nodeIds),
    onSuccess: invalidate,
  });
  const toggleFavorite = useMutation({
    mutationFn: (input: { id: string; starred: boolean }) =>
      input.starred ? client.removeFavorite(input.id) : client.addFavorite(input.id),
    onSuccess: invalidate,
  });

  return { createFolder, rename, move, trash, restore, purge, toggleFavorite };
}
```

- [ ] **Step 3: Write a failing smoke test for a hook**

Create `apps/web/src/modules/storage/data/useStorageData.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useStorageTree } from './useStorageData';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useStorageTree', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 'r1', nodeType: 'folder', name: 'Root', children: [] }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('loads and normalizes the tree', async () => {
    const { result } = renderHook(() => useStorageTree(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ id: 'r1', name: 'Root', nodeType: 'folder' });
  });
});
```

- [ ] **Step 4: Run the test to verify it fails, then passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/useStorageData.test.tsx`
Expected first run: FAIL if `@testing-library/react` import path or hook is missing. If `@testing-library/react` is not installed, instead delete this test file and rely on the client test (the client is the logic under test); note that in the commit message. Otherwise: PASS after the hooks file exists.

> Note for implementer: confirm `@testing-library/react` is a dev dependency (`grep '@testing-library/react' apps/web/package.json`). It is used by existing `*.test.tsx` files (e.g. `Sidebar.test.tsx`), so it should be present.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/modules/storage/data/storageKeys.ts apps/web/src/modules/storage/data/useStorageData.ts apps/web/src/modules/storage/data/useStorageData.test.tsx
git commit -m "feat(storage): query keys and react-query data hooks"
```

---

## Task 5: StoragePage shell + view state

Replaces the placeholder with the real shell: rail + main pane scaffolding and the central state. Child components are stubbed inline here and extracted in later tasks.

**Files:**

- Modify: `apps/web/src/modules/storage/StoragePage.tsx`
- Create: `apps/web/src/modules/storage/useStorageViewState.ts`
- Test: `apps/web/src/modules/storage/StoragePage.test.tsx`

- [ ] **Step 1: Write the view-state hook**

Create `apps/web/src/modules/storage/useStorageViewState.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { getWindowStorage } from '@/lib/storage/safeStorage';

import type {
  StorageDisplayMode,
  StorageSearchScope,
  StorageSort,
  StorageView,
} from './data/types';

const DISPLAY_MODE_KEY = 'oktavius.storage.displayMode';
const VIEWS: StorageView[] = ['folder', 'recent', 'starred', 'trash'];

export interface StorageViewState {
  view: StorageView;
  currentFolderId: string | null;
  displayMode: StorageDisplayMode;
  sort: StorageSort;
  search: { term: string; scope: StorageSearchScope };
  selectedNodeId: string | null;
  previewNodeId: string | null;
  setView: (view: StorageView) => void;
  openFolder: (folderId: string | null) => void;
  setDisplayMode: (mode: StorageDisplayMode) => void;
  setSort: (sort: StorageSort) => void;
  setSearch: (search: { term: string; scope: StorageSearchScope }) => void;
  setSelectedNodeId: (id: string | null) => void;
  setPreviewNodeId: (id: string | null) => void;
}

export function useStorageViewState(): StorageViewState {
  const [searchParams, setSearchParams] = useSearchParams();
  const storage = getWindowStorage('localStorage');

  const view = (
    VIEWS.includes(searchParams.get('view') as StorageView) ? searchParams.get('view') : 'folder'
  ) as StorageView;
  const currentFolderId = searchParams.get('folder');

  const [displayMode, setDisplayModeState] = useState<StorageDisplayMode>(
    () => (storage?.getItem(DISPLAY_MODE_KEY) as StorageDisplayMode) || 'grid',
  );
  const [sort, setSort] = useState<StorageSort>({ by: 'name', dir: 'asc' });
  const [search, setSearch] = useState<{ term: string; scope: StorageSearchScope }>({
    term: '',
    scope: 'current',
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);

  const setDisplayMode = useCallback(
    (mode: StorageDisplayMode) => {
      setDisplayModeState(mode);
      storage?.setItem(DISPLAY_MODE_KEY, mode);
    },
    [storage],
  );

  const setView = useCallback(
    (next: StorageView) => {
      setSelectedNodeId(null);
      setSearchParams((params) => {
        params.set('view', next);
        params.delete('folder');
        return params;
      });
    },
    [setSearchParams],
  );

  const openFolder = useCallback(
    (folderId: string | null) => {
      setSelectedNodeId(null);
      setSearchParams((params) => {
        params.set('view', 'folder');
        if (folderId) params.set('folder', folderId);
        else params.delete('folder');
        return params;
      });
    },
    [setSearchParams],
  );

  // Clear search term when leaving a view.
  useEffect(() => {
    setSearch((prev) => (prev.term ? { ...prev, term: '' } : prev));
  }, [view, currentFolderId]);

  return {
    view,
    currentFolderId,
    displayMode,
    sort,
    search,
    selectedNodeId,
    previewNodeId,
    setView,
    openFolder,
    setDisplayMode,
    setSort,
    setSearch,
    setSelectedNodeId,
    setPreviewNodeId,
  };
}
```

> Implementer note: confirm the router import is `react-router` (v7). Check an existing module: `grep -rn "from 'react-router" apps/web/src/modules | head`. Use whatever the codebase uses (`react-router` or `react-router-dom`).

- [ ] **Step 2: Write the StoragePage shell**

Replace `apps/web/src/modules/storage/StoragePage.tsx` with:

```tsx
import { useMemo } from 'react';

import { PageHeaderCtaButton } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { usePreloadNamespaces, useTranslation } from '@/core/i18n';
import { UploadIcon } from '@/lib/icons';

import { StorageRail } from './components/StorageRail';
import { StorageMainPane } from './components/StorageMainPane';
import { storagePageIcon } from '@/lib/modulePageIcons';
import { useStorageViewState } from './useStorageViewState';

export function StoragePage() {
  const { ready } = usePreloadNamespaces(['storage']);
  const { t } = useTranslation();
  const state = useStorageViewState();

  const headerActions = useMemo(
    () => (
      <PageHeaderCtaButton
        onClick={() => document.dispatchEvent(new CustomEvent('storage:upload'))}
      >
        <UploadIcon size={16} />
        {t('storage.actions.upload', undefined, 'Upload')}
      </PageHeaderCtaButton>
    ),
    [t],
  );

  if (!ready) return null;

  return (
    <ModulePage
      title={t('storage.pageTitle', undefined, 'Storage')}
      subtitle={t('storage.subtitle', undefined, 'Files and folders')}
      icon={storagePageIcon()}
      actions={headerActions}
      fillHeight
    >
      <div className="flex h-full min-h-0 gap-4">
        <StorageRail state={state} className="hidden w-60 shrink-0 lg:flex" />
        <StorageMainPane state={state} className="min-w-0 flex-1" />
      </div>
    </ModulePage>
  );
}
```

> The `storage:upload` custom event is a simple decoupling between the header CTA and the upload layer (wired in Task 11). Until then, the StorageMainPane stub renders nothing for it.

- [ ] **Step 3: Create minimal stubs so the page compiles**

Create `apps/web/src/modules/storage/components/StorageRail.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';

import type { StorageViewState } from '../useStorageViewState';

export function StorageRail({ state, className }: { state: StorageViewState; className?: string }) {
  return <aside className={cn('flex-col', className)} data-testid="storage-rail" />;
}
```

Create `apps/web/src/modules/storage/components/StorageMainPane.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';

import type { StorageViewState } from '../useStorageViewState';

export function StorageMainPane({
  state,
  className,
}: {
  state: StorageViewState;
  className?: string;
}) {
  return <section className={cn('flex flex-col', className)} data-testid="storage-main" />;
}
```

> `cn` is exported from `@oktavius/base-ui` (used by `DocumentPreview`). Confirm with `grep -n "export.*cn" packages/base-ui/src/index.ts`.

- [ ] **Step 4: Write the render smoke test**

Create `apps/web/src/modules/storage/StoragePage.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import { StoragePage } from './StoragePage';

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={['/storage']}>
      <QueryClientProvider client={queryClient}>
        <TestI18nProvider>
          <StoragePage />
        </TestI18nProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('StoragePage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders the rail and main pane', async () => {
    renderPage();
    expect(await screen.findByTestId('storage-rail')).toBeInTheDocument();
    expect(screen.getByTestId('storage-main')).toBeInTheDocument();
  });
});
```

> Implementer note: confirm `TestI18nProvider` is exported from `@/core/i18n` (it is, per `core/i18n/index.ts`). If `usePreloadNamespaces` resolves async and the test sees `null`, wrap the assertion in `findBy*` (already done) and ensure `TestI18nProvider` marks namespaces ready synchronously — check `core/i18n/I18nProvider` for how existing module tests handle it (e.g. `AuthPasswordPages.test.tsx`).

- [ ] **Step 5: Run the test**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/StoragePage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck, lint, commit**

```bash
pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint
git add apps/web/src/modules/storage/
git commit -m "feat(storage): page shell, view state, rail/main stubs"
```

---

## Task 6: Folder-tree rail

**Files:**

- Modify: `apps/web/src/modules/storage/components/StorageRail.tsx`
- Create: `apps/web/src/modules/storage/components/StorageFolderTree.tsx`

- [ ] **Step 1: Implement the recursive folder tree**

Create `apps/web/src/modules/storage/components/StorageFolderTree.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from '@/lib/icons';

import type { StorageTreeNode } from '../data/types';

function TreeRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: StorageTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-control px-2 py-1.5 text-sm',
          isSelected ? 'bg-cta/10 font-medium text-cta' : 'text-foreground hover:bg-muted',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className={cn('shrink-0 text-muted-foreground', !hasChildren && 'invisible')}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
        >
          {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
        </button>
        <FolderIcon size={16} weight="duotone" className="shrink-0 text-cta" />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function StorageFolderTree({
  tree,
  selectedId,
  onSelect,
}: {
  tree: StorageTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {tree.map((node) => (
        <TreeRow key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement the rail (quick-nav + tree + new folder)**

Replace `apps/web/src/modules/storage/components/StorageRail.tsx`:

```tsx
import { Button, cn, Skeleton } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import {
  DeleteIcon,
  DocumentIcon,
  HistoryIcon,
  type IconProps,
  PlusIcon,
  StarIcon,
} from '@/lib/icons';
import type { ComponentType } from 'react';

import { useStorageTree } from '../data/useStorageData';
import type { StorageView } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageFolderTree } from './StorageFolderTree';

const NAV_ITEMS: { view: StorageView; icon: ComponentType<IconProps>; key: string }[] = [
  { view: 'folder', icon: DocumentIcon, key: 'all' },
  { view: 'recent', icon: HistoryIcon, key: 'recent' },
  { view: 'starred', icon: StarIcon, key: 'starred' },
  { view: 'trash', icon: DeleteIcon, key: 'trash' },
];

export function StorageRail({
  state,
  className,
  onNewFolder,
}: {
  state: StorageViewState;
  className?: string;
  onNewFolder?: () => void;
}) {
  const { t } = useTranslation();
  const treeQuery = useStorageTree();

  return (
    <aside
      className={cn('flex-col gap-4 rounded-card bg-card p-3', className)}
      data-testid="storage-rail"
    >
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ view, icon: Icon, key }) => {
          const active = state.view === view && (view !== 'folder' || !state.currentFolderId);
          return (
            <button
              key={key}
              type="button"
              onClick={() => (view === 'folder' ? state.openFolder(null) : state.setView(view))}
              className={cn(
                'flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm',
                active ? 'bg-cta/10 font-medium text-cta' : 'text-foreground hover:bg-muted',
              )}
            >
              <Icon size={18} weight="duotone" />
              {t(`storage.nav.${key}`)}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center justify-between px-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('storage.folders')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewFolder}
          aria-label={t('storage.newFolder')}
        >
          <PlusIcon size={14} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {treeQuery.isLoading ? (
          <div className="space-y-2 px-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        ) : (
          <StorageFolderTree
            tree={treeQuery.data ?? []}
            selectedId={state.view === 'folder' ? state.currentFolderId : null}
            onSelect={(id) => state.openFolder(id)}
          />
        )}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Typecheck + lint + run existing storage tests**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint`
Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/StoragePage.test.tsx`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/storage/components/StorageRail.tsx apps/web/src/modules/storage/components/StorageFolderTree.tsx
git commit -m "feat(storage): folder-tree rail with quick-nav"
```

---

## Task 7: Toolbar (breadcrumb, search, sort, view toggle)

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageViewToggle.tsx`
- Create: `apps/web/src/modules/storage/components/StorageToolbar.tsx`

- [ ] **Step 1: Implement the grid/list toggle**

Create `apps/web/src/modules/storage/components/StorageViewToggle.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';

import { GridIcon, ListIcon } from '@/lib/icons';
import type { StorageDisplayMode } from '../data/types';

export function StorageViewToggle({
  mode,
  onChange,
}: {
  mode: StorageDisplayMode;
  onChange: (mode: StorageDisplayMode) => void;
}) {
  return (
    <div className="flex items-center rounded-control bg-muted p-0.5" role="tablist">
      {(['grid', 'list'] as const).map((value) => {
        const Icon = value === 'grid' ? GridIcon : ListIcon;
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={value}
            onClick={() => onChange(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-[7px]',
              active ? 'bg-card text-foreground shadow-elevated' : 'text-muted-foreground',
            )}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Implement the toolbar**

Create `apps/web/src/modules/storage/components/StorageToolbar.tsx`:

```tsx
import { Input } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { ChevronRightIcon, SearchIcon } from '@/lib/icons';

import type { StorageTreeNode } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageViewToggle } from './StorageViewToggle';

interface Crumb {
  id: string | null;
  label: string;
}

/** Walk the tree to build the path from root to the current folder. */
function buildCrumbs(tree: StorageTreeNode[], folderId: string | null, homeLabel: string): Crumb[] {
  const path: Crumb[] = [{ id: null, label: homeLabel }];
  if (!folderId) return path;

  const stack: { node: StorageTreeNode; trail: Crumb[] }[] = tree.map((node) => ({
    node,
    trail: [{ id: node.id, label: node.name }],
  }));
  while (stack.length) {
    const { node, trail } = stack.pop() as { node: StorageTreeNode; trail: Crumb[] };
    if (node.id === folderId) return [...path, ...trail];
    for (const child of node.children) {
      stack.push({ node: child, trail: [...trail, { id: child.id, label: child.name }] });
    }
  }
  return path;
}

export function StorageToolbar({
  state,
  tree,
}: {
  state: StorageViewState;
  tree: StorageTreeNode[];
}) {
  const { t } = useTranslation();
  const isFolderView = state.view === 'folder';
  const crumbs = isFolderView
    ? buildCrumbs(tree, state.currentFolderId, t('storage.nav.all'))
    : [{ id: null, label: t(`storage.nav.${state.view}`) }];

  return (
    <div className="flex flex-wrap items-center gap-3 pb-3">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${crumb.id ?? 'root'}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRightIcon size={14} className="text-muted-foreground" />}
              <button
                type="button"
                disabled={isLast || !isFolderView}
                onClick={() => state.openFolder(crumb.id)}
                className={
                  isLast
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {crumb.label}
              </button>
            </span>
          );
        })}
      </nav>

      <div className="relative w-56 max-w-full">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={state.search.term}
          onChange={(event) =>
            state.setSearch({ term: event.target.value, scope: state.search.scope })
          }
          placeholder={t('storage.search.placeholder')}
          className="pl-9"
        />
      </div>

      <StorageViewToggle mode={state.displayMode} onChange={state.setDisplayMode} />
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/modules/storage/components/StorageToolbar.tsx apps/web/src/modules/storage/components/StorageViewToggle.tsx
git commit -m "feat(storage): toolbar with breadcrumb, search, view toggle"
```

---

## Task 8: Items, grid, list, and the main pane

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageItemMenu.tsx`
- Create: `apps/web/src/modules/storage/components/StorageGrid.tsx`
- Create: `apps/web/src/modules/storage/components/StorageList.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx`
- Test: `apps/web/src/modules/storage/components/StorageGrid.test.tsx`

- [ ] **Step 1: Implement the per-item action menu**

Create `apps/web/src/modules/storage/components/StorageItemMenu.tsx`:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n';
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  MoreIcon,
  MoveToFolderIcon,
  StarIcon,
} from '@/lib/icons';

import type { StorageNode } from '../data/types';

export interface StorageItemActions {
  isStarred: (node: StorageNode) => boolean;
  onOpen: (node: StorageNode) => void;
  onDownload: (node: StorageNode) => void;
  onRename: (node: StorageNode) => void;
  onMove: (node: StorageNode) => void;
  onToggleStar: (node: StorageNode) => void;
  onTrash: (node: StorageNode) => void;
  onRestore: (node: StorageNode) => void;
  onPurge: (node: StorageNode) => void;
}

export function StorageItemMenu({
  node,
  actions,
  inTrash,
  trigger,
}: {
  node: StorageNode;
  actions: StorageItemActions;
  inTrash: boolean;
  trigger: ReactNode;
}) {
  const { t } = useTranslation();
  const isFile = node.nodeType === 'file';
  const starred = actions.isStarred(node);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {inTrash ? (
          <>
            <DropdownMenuItem onSelect={() => actions.onRestore(node)}>
              <EyeIcon size={16} /> {t('storage.actions.restore')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onPurge(node)} className="text-destructive">
              <DeleteIcon size={16} /> {t('storage.actions.deleteForever')}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => actions.onOpen(node)}>
              <EyeIcon size={16} /> {t('storage.actions.open')}
            </DropdownMenuItem>
            {isFile && (
              <DropdownMenuItem onSelect={() => actions.onDownload(node)}>
                <DownloadIcon size={16} /> {t('storage.actions.download')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => actions.onRename(node)}>
              <EditIcon size={16} /> {t('storage.actions.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onMove(node)}>
              <MoveToFolderIcon size={16} /> {t('storage.actions.move')}
            </DropdownMenuItem>
            {isFile && (
              <DropdownMenuItem onSelect={() => actions.onToggleStar(node)}>
                <StarIcon size={16} weight={starred ? 'fill' : 'regular'} />{' '}
                {starred ? t('storage.actions.unstar') : t('storage.actions.star')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onTrash(node)} className="text-destructive">
              <DeleteIcon size={16} /> {t('storage.actions.trash')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: Implement the grid**

Create `apps/web/src/modules/storage/components/StorageGrid.tsx`:

```tsx
import { Button, cn } from '@oktavius/base-ui';

import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { StorageItemMenu, type StorageItemActions } from './StorageItemMenu';

export function StorageGrid({
  nodes,
  actions,
  inTrash,
  selectedId,
  onSelect,
  onOpen,
}: {
  nodes: StorageNode[];
  actions: StorageItemActions;
  inTrash: boolean;
  selectedId: string | null;
  onSelect: (node: StorageNode) => void;
  onOpen: (node: StorageNode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {nodes.map((node) => {
        const Icon = fileIcon(node);
        const kind = getFileKind(node);
        const isFolder = node.nodeType === 'folder';
        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(node)}
            onDoubleClick={() => onOpen(node)}
            className={cn(
              'group relative flex flex-col gap-2 rounded-card bg-card p-3 text-left',
              'hover:bg-muted',
              selectedId === node.id && 'ring-2 ring-cta',
            )}
          >
            <div className="flex h-16 items-center justify-center rounded-control bg-muted/60">
              <Icon size={30} weight="duotone" className={fileAccentClass(kind)} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{node.name}</div>
              <div className="text-xs text-muted-foreground">
                {isFolder ? '' : formatBytes(node.fileSizeBytes)}
              </div>
            </div>
            <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100">
              <StorageItemMenu
                node={node}
                actions={actions}
                inTrash={inTrash}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreIcon size={16} />
                  </Button>
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Implement the list**

Create `apps/web/src/modules/storage/components/StorageList.tsx`:

```tsx
import { Button, cn } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { StorageItemMenu, type StorageItemActions } from './StorageItemMenu';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function StorageList({
  nodes,
  actions,
  inTrash,
  selectedId,
  onSelect,
  onOpen,
}: {
  nodes: StorageNode[];
  actions: StorageItemActions;
  inTrash: boolean;
  selectedId: string | null;
  onSelect: (node: StorageNode) => void;
  onOpen: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-card bg-card">
      <div className="grid grid-cols-[1fr_120px_140px_40px] gap-3 border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>{t('storage.columns.name')}</span>
        <span>{t('storage.columns.size')}</span>
        <span>{t('storage.columns.modified')}</span>
        <span />
      </div>
      {nodes.map((node) => {
        const Icon = fileIcon(node);
        const kind = getFileKind(node);
        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(node)}
            onDoubleClick={() => onOpen(node)}
            className={cn(
              'group grid grid-cols-[1fr_120px_140px_40px] items-center gap-3 px-3 py-2 text-sm',
              'hover:bg-muted',
              selectedId === node.id && 'bg-cta/5',
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Icon size={18} weight="duotone" className={cn('shrink-0', fileAccentClass(kind))} />
              <span className="truncate text-foreground">{node.name}</span>
            </span>
            <span className="text-muted-foreground">
              {node.nodeType === 'folder' ? '—' : formatBytes(node.fileSizeBytes)}
            </span>
            <span className="text-muted-foreground">{formatDate(node.updatedAt)}</span>
            <span className="opacity-0 group-hover:opacity-100">
              <StorageItemMenu
                node={node}
                actions={actions}
                inTrash={inTrash}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreIcon size={16} />
                  </Button>
                }
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Write a failing interaction test**

Create `apps/web/src/modules/storage/components/StorageGrid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TestI18nProvider } from '@/core/i18n';

import type { StorageNode } from '../data/types';
import { StorageGrid } from './StorageGrid';
import type { StorageItemActions } from './StorageItemMenu';

const node: StorageNode = {
  id: 'f1',
  parentId: null,
  nodeType: 'file',
  name: 'Q3.pdf',
  mimeType: 'application/pdf',
  fileExtension: 'pdf',
  fileSizeBytes: 2048,
  uploadStatus: 'ready',
  trashedAt: null,
  purgeAfterAt: null,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function makeActions(overrides: Partial<StorageItemActions> = {}): StorageItemActions {
  return {
    isStarred: () => false,
    onOpen: vi.fn(),
    onDownload: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onToggleStar: vi.fn(),
    onTrash: vi.fn(),
    onRestore: vi.fn(),
    onPurge: vi.fn(),
    ...overrides,
  };
}

describe('StorageGrid', () => {
  it('selects on single click and opens on double click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    render(
      <TestI18nProvider>
        <StorageGrid
          nodes={[node]}
          actions={makeActions()}
          inTrash={false}
          selectedId={null}
          onSelect={onSelect}
          onOpen={onOpen}
        />
      </TestI18nProvider>,
    );

    const tile = screen.getByText('Q3.pdf').closest('[role="button"]') as HTMLElement;
    await user.click(tile);
    expect(onSelect).toHaveBeenCalledWith(node);
    await user.dblClick(tile);
    expect(onOpen).toHaveBeenCalledWith(node);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/components/StorageGrid.test.tsx`
Expected: PASS. (If `@testing-library/user-event` is not installed, replace `userEvent` with `fireEvent.click` / `fireEvent.dblClick` from `@testing-library/react`.)

- [ ] **Step 6: Wire the main pane**

Replace `apps/web/src/modules/storage/components/StorageMainPane.tsx`:

```tsx
import { cn, InlineEmptyState, Skeleton } from '@oktavius/base-ui';
import { useMemo } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import {
  useFavorites,
  useRecent,
  useStorageClient,
  useStorageMutations,
  useStorageNodes,
  useStorageTree,
  useTrash,
} from '../data/useStorageData';
import type { StorageNode } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageGrid } from './StorageGrid';
import { StorageList } from './StorageList';
import { StorageToolbar } from './StorageToolbar';
import type { StorageItemActions } from './StorageItemMenu';

export function StorageMainPane({
  state,
  className,
}: {
  state: StorageViewState;
  className?: string;
}) {
  const { t } = useTranslation();
  const client = useStorageClient();
  const treeQuery = useStorageTree();
  const mutations = useStorageMutations();

  const folderQuery = useStorageNodes({
    folderId: state.currentFolderId,
    sortBy: state.sort.by,
    sortDir: state.sort.dir,
    search: state.search.term || undefined,
    scope: state.search.scope,
  });
  const recentQuery = useRecent(state.view === 'recent');
  const starredQuery = useFavorites(state.view === 'starred');
  const trashQuery = useTrash(1, state.view === 'trash');
  const favoritesQuery = useFavorites(true);

  const starredIds = useMemo(
    () => new Set((favoritesQuery.data ?? []).map((node) => node.id)),
    [favoritesQuery.data],
  );

  const inTrash = state.view === 'trash';
  const { nodes, isLoading } = selectViewData(state.view, {
    folder: folderQuery,
    recent: recentQuery,
    starred: starredQuery,
    trash: trashQuery,
  });

  // Folders first, then files (folder/search views already sorted server-side by name).
  const orderedNodes = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        if (a.nodeType !== b.nodeType) return a.nodeType === 'folder' ? -1 : 1;
        return 0;
      }),
    [nodes],
  );

  const actions: StorageItemActions = {
    isStarred: (node) => starredIds.has(node.id),
    onOpen: (node) =>
      node.nodeType === 'folder' ? state.openFolder(node.id) : state.setPreviewNodeId(node.id),
    onDownload: async (node) => {
      try {
        const url = await client.downloadUrl(node.id);
        window.open(url, '_blank', 'noopener');
      } catch (error) {
        appToast.fromApiError(error, t('storage.errors.load'));
      }
    },
    onRename: (node) => document.dispatchEvent(new CustomEvent('storage:rename', { detail: node })),
    onMove: (node) => document.dispatchEvent(new CustomEvent('storage:move', { detail: node })),
    onToggleStar: (node) =>
      mutations.toggleFavorite.mutate({ id: node.id, starred: starredIds.has(node.id) }),
    onTrash: (node) => document.dispatchEvent(new CustomEvent('storage:trash', { detail: node })),
    onRestore: (node) => mutations.restore.mutate(node.id),
    onPurge: (node) => document.dispatchEvent(new CustomEvent('storage:purge', { detail: node })),
  };

  return (
    <section className={cn('flex flex-col', className)} data-testid="storage-main">
      <StorageToolbar state={state} tree={treeQuery.data ?? []} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <GridSkeleton />
        ) : orderedNodes.length === 0 ? (
          <InlineEmptyState
            centered
            text={t(state.search.term ? 'storage.empty.search' : `storage.empty.${state.view}`)}
          />
        ) : state.displayMode === 'grid' ? (
          <StorageGrid
            nodes={orderedNodes}
            actions={actions}
            inTrash={inTrash}
            selectedId={state.selectedNodeId}
            onSelect={(node) => state.setSelectedNodeId(node.id)}
            onOpen={actions.onOpen}
          />
        ) : (
          <StorageList
            nodes={orderedNodes}
            actions={actions}
            inTrash={inTrash}
            selectedId={state.selectedNodeId}
            onSelect={(node) => state.setSelectedNodeId(node.id)}
            onOpen={actions.onOpen}
          />
        )}
      </div>
    </section>
  );
}

function selectViewData(
  view: StorageViewState['view'],
  queries: {
    folder: { data?: { data: StorageNode[] }; isLoading: boolean };
    recent: { data?: StorageNode[]; isLoading: boolean };
    starred: { data?: StorageNode[]; isLoading: boolean };
    trash: { data?: { data: StorageNode[] }; isLoading: boolean };
  },
): { nodes: StorageNode[]; isLoading: boolean } {
  switch (view) {
    case 'recent':
      return { nodes: queries.recent.data ?? [], isLoading: queries.recent.isLoading };
    case 'starred':
      return { nodes: queries.starred.data ?? [], isLoading: queries.starred.isLoading };
    case 'trash':
      return { nodes: queries.trash.data?.data ?? [], isLoading: queries.trash.isLoading };
    default:
      return { nodes: queries.folder.data?.data ?? [], isLoading: queries.folder.isLoading };
  }
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-card" />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Typecheck, lint, run storage tests**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint`
Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/modules/storage/components/
git commit -m "feat(storage): grid, list, item menu, main pane data wiring"
```

---

## Task 9: Details drawer

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageDetailsDrawer.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx` (render the drawer)

- [ ] **Step 1: Implement the drawer**

Create `apps/web/src/modules/storage/components/StorageDetailsDrawer.tsx`:

```tsx
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { DownloadIcon, EyeIcon, StarIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-foreground">{value}</span>
    </div>
  );
}

export function StorageDetailsDrawer({
  node,
  starred,
  onClose,
  onOpen,
  onDownload,
  onToggleStar,
}: {
  node: StorageNode | null;
  starred: boolean;
  onClose: () => void;
  onOpen: (node: StorageNode) => void;
  onDownload: (node: StorageNode) => void;
  onToggleStar: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  const open = Boolean(node);
  const Icon = node ? fileIcon(node) : null;

  return (
    <Drawer open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DrawerContent side="right">
        {node && Icon && (
          <>
            <DrawerHeader>
              <DrawerTitle className="truncate">{node.name}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="flex h-32 items-center justify-center rounded-card bg-muted/60">
                <Icon size={56} weight="duotone" className={fileAccentClass(getFileKind(node))} />
              </div>
              <div>
                <MetaRow
                  label={t('storage.details.type')}
                  value={node.mimeType ?? node.fileExtension ?? '—'}
                />
                {node.nodeType === 'file' && (
                  <MetaRow
                    label={t('storage.details.size')}
                    value={formatBytes(node.fileSizeBytes)}
                  />
                )}
                <MetaRow
                  label={t('storage.details.modified')}
                  value={new Date(node.updatedAt).toLocaleString()}
                />
                <MetaRow
                  label={t('storage.details.created')}
                  value={new Date(node.createdAt).toLocaleString()}
                />
              </div>
              <div className="flex gap-2">
                {node.nodeType === 'file' && (
                  <Button variant="cta" className="flex-1" onClick={() => onOpen(node)}>
                    <EyeIcon size={16} /> {t('storage.actions.open')}
                  </Button>
                )}
                {node.nodeType === 'file' && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('storage.actions.download')}
                    onClick={() => onDownload(node)}
                  >
                    <DownloadIcon size={16} />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={t('storage.actions.star')}
                  onClick={() => onToggleStar(node)}
                >
                  <StarIcon size={16} weight={starred ? 'fill' : 'regular'} />
                </Button>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Render the drawer from the main pane**

In `apps/web/src/modules/storage/components/StorageMainPane.tsx`, add the import:

```tsx
import { StorageDetailsDrawer } from './StorageDetailsDrawer';
```

Compute the selected node from the currently displayed nodes, and render the drawer just before the closing `</section>`:

```tsx
const selectedNode = orderedNodes.find((node) => node.id === state.selectedNodeId) ?? null;
```

```tsx
<StorageDetailsDrawer
  node={selectedNode}
  starred={selectedNode ? starredIds.has(selectedNode.id) : false}
  onClose={() => state.setSelectedNodeId(null)}
  onOpen={(node) => {
    state.setSelectedNodeId(null);
    actions.onOpen(node);
  }}
  onDownload={actions.onDownload}
  onToggleStar={actions.onToggleStar}
/>
```

- [ ] **Step 3: Typecheck, lint, run storage tests, commit**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: PASS.

```bash
git add apps/web/src/modules/storage/components/
git commit -m "feat(storage): single-click details drawer"
```

---

## Task 10: Full-screen preview modal

**Files:**

- Create: `apps/web/src/modules/storage/components/StoragePreviewModal.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx` (render the modal)

- [ ] **Step 1: Implement the preview modal**

Create `apps/web/src/modules/storage/components/StoragePreviewModal.tsx`:

```tsx
import { Button, Dialog, DialogContent, DialogTitle } from '@oktavius/base-ui';
import { useMemo } from 'react';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type { PreviewDocument } from '@/components/documents/documentPreviewTypes';
import { useTranslation } from '@/core/i18n';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, DownloadIcon } from '@/lib/icons';

import { useFilePreviewUrl } from '../data/useStorageData';
import type { StorageNode } from '../data/types';

export function StoragePreviewModal({
  nodes,
  currentId,
  onNavigate,
  onClose,
  onDownload,
}: {
  nodes: StorageNode[];
  currentId: string | null;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onDownload: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  const files = useMemo(() => nodes.filter((node) => node.nodeType === 'file'), [nodes]);
  const index = files.findIndex((node) => node.id === currentId);
  const node = index >= 0 ? files[index] : null;
  const previewQuery = useFilePreviewUrl(node?.id ?? null);

  const document: PreviewDocument | null = node
    ? {
        name: node.name,
        mimeType: node.mimeType,
        fileExtension: node.fileExtension,
        sourceUrl: previewQuery.data ?? null,
      }
    : null;

  return (
    <Dialog open={Boolean(node)} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="flex h-[85vh] w-[85vw] max-w-[1100px] flex-col gap-3 p-4">
        {node && (
          <>
            <div className="flex items-center gap-2">
              <DialogTitle className="min-w-0 flex-1 truncate text-sm">{node.name}</DialogTitle>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('storage.actions.download')}
                onClick={() => onDownload(node)}
              >
                <DownloadIcon size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('storage.dialogs.cancel')}
                onClick={onClose}
              >
                <CloseIcon size={16} />
              </Button>
            </div>
            <div className="relative min-h-0 flex-1">
              <DocumentPreview
                document={document}
                isLoading={previewQuery.isLoading}
                errorMessage={previewQuery.isError ? t('storage.errors.load') : null}
                className="h-full"
              />
              {index > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => onNavigate(files[index - 1].id)}
                >
                  <ChevronLeftIcon size={18} />
                </Button>
              )}
              {index < files.length - 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => onNavigate(files[index + 1].id)}
                >
                  <ChevronRightIcon size={18} />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Render the modal from the main pane**

In `StorageMainPane.tsx`, add the import and render before `</section>`:

```tsx
import { StoragePreviewModal } from './StoragePreviewModal';
```

```tsx
<StoragePreviewModal
  nodes={orderedNodes}
  currentId={state.previewNodeId}
  onNavigate={(id) => state.setPreviewNodeId(id)}
  onClose={() => state.setPreviewNodeId(null)}
  onDownload={actions.onDownload}
/>
```

- [ ] **Step 3: Typecheck, lint, run storage tests, commit**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: PASS.

```bash
git add apps/web/src/modules/storage/components/
git commit -m "feat(storage): double-click full-screen preview modal"
```

---

## Task 11: Upload flow (3-step) + drag-and-drop layer

**Files:**

- Create: `apps/web/src/modules/storage/data/uploadFile.ts`
- Test: `apps/web/src/modules/storage/data/uploadFile.test.ts`
- Create: `apps/web/src/modules/storage/components/StorageUploadLayer.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx` (render the layer)

- [ ] **Step 1: Write the failing upload-flow test**

Create `apps/web/src/modules/storage/data/uploadFile.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { computeSha256, putToSignedUrl } from './uploadFile';

describe('computeSha256', () => {
  it('returns null for files larger than 50MB', async () => {
    const big = { size: 51 * 1024 * 1024 } as File;
    expect(await computeSha256(big)).toBeNull();
  });

  it('hashes small files when crypto.subtle is available', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'a.bin');
    const hash = await computeSha256(file);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('putToSignedUrl', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('PUTs the file with the correct headers', async () => {
    const file = new File(['hi'], 'a.txt', { type: 'text/plain' });
    await putToSignedUrl('https://signed/url', file);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://signed/url');
    expect(init.method).toBe('PUT');
    expect(init.headers['Content-Type']).toBe('text/plain');
    expect(init.headers['x-upsert']).toBe('true');
  });

  it('throws on non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    await expect(putToSignedUrl('https://x', new File(['x'], 'x'))).rejects.toThrow();
  });
});
```

> Note: this test uses `fetch` for the PUT (not XHR) to keep it testable in jsdom. Progress reporting is approximated. If precise progress UX requires XHR, expose an optional `onProgress` and use XHR in the browser path, but keep `putToSignedUrl` fetch-based and unit-tested as below.

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/uploadFile.test.ts`
Expected: FAIL ("Cannot find module './uploadFile'").

- [ ] **Step 3: Implement the upload helpers**

Create `apps/web/src/modules/storage/data/uploadFile.ts`:

```ts
import type { OsirisStorageClient } from './storageClient';

const SHA_SKIP_BYTES = 50 * 1024 * 1024;

export async function computeSha256(file: File): Promise<string | null> {
  if (file.size > SHA_SKIP_BYTES) return null;
  if (!globalThis.crypto?.subtle) return null;
  const buffer = await file.arrayBuffer();
  const hash = await globalThis.crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function putToSignedUrl(signedUrl: string, file: File): Promise<void> {
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}

export interface UploadOutcome {
  duplicateOfNodeId: string | null;
}

/** Full 3-step upload: initiate → PUT → finalize. */
export async function uploadFile(
  client: OsirisStorageClient,
  file: File,
  folderId: string | null,
): Promise<UploadOutcome> {
  const session = await client.initiateUpload({
    folderId,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
  });
  await putToSignedUrl(session.signedUrl, file);
  const sha = await computeSha256(file);
  const result = await client.finalizeUpload({
    sessionId: session.sessionId,
    contentSha256: sha ?? undefined,
  });
  return { duplicateOfNodeId: result.duplicateOfNodeId };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/storage/data/uploadFile.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the upload layer component**

Create `apps/web/src/modules/storage/components/StorageUploadLayer.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { SpinnerIcon, UploadIcon, WarningIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import { useInvalidateStorage, useStorageClient } from '../data/useStorageData';
import { uploadFile } from '../data/uploadFile';

interface QueueItem {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'failed';
}

export function StorageUploadLayer({
  folderId,
  children,
}: {
  folderId: string | null;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const client = useStorageClient();
  const invalidate = useInvalidateStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const counter = useRef(0);

  async function runUploads(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const id = `u${(counter.current += 1)}`;
      setQueue((items) => [...items, { id, name: file.name, status: 'uploading' }]);
      try {
        const { duplicateOfNodeId } = await uploadFile(client, file, folderId);
        setQueue((items) =>
          items.map((item) => (item.id === id ? { ...item, status: 'done' } : item)),
        );
        if (duplicateOfNodeId) {
          appToast.info(t('storage.upload.duplicate', { name: file.name }));
        }
      } catch (error) {
        setQueue((items) =>
          items.map((item) => (item.id === id ? { ...item, status: 'failed' } : item)),
        );
        appToast.fromApiError(error, t('storage.upload.failed', { name: file.name }));
      }
    }
    invalidate();
    setTimeout(
      () => setQueue((items) => items.filter((item) => item.status === 'uploading')),
      2500,
    );
  }

  // The header CTA dispatches this event (see StoragePage).
  useEffect(() => {
    const open = () => fileInputRef.current?.click();
    document.addEventListener('storage:upload', open);
    return () => document.removeEventListener('storage:upload', open);
  }, []);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length) void runUploads(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void runUploads(event.target.files);
          event.target.value = '';
        }}
      />
      {children}

      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-card border-2 border-dashed border-cta bg-cta/5">
          <div className="flex items-center gap-2 text-sm font-medium text-cta">
            <UploadIcon size={20} /> {t('storage.upload.dropHere')}
          </div>
        </div>
      )}

      {queue.length > 0 && (
        <div className="absolute bottom-4 right-4 z-20 w-72 rounded-card bg-card p-3 shadow-elevated">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1 text-sm">
              {item.status === 'uploading' && (
                <SpinnerIcon size={16} className="animate-spin text-cta" />
              )}
              {item.status === 'failed' && <WarningIcon size={16} className="text-destructive" />}
              {item.status === 'done' && <UploadIcon size={16} className="text-success" />}
              <span className={cn('truncate', item.status === 'failed' && 'text-destructive')}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Wrap the main pane content with the upload layer**

In `StorageMainPane.tsx`, import the layer:

```tsx
import { StorageUploadLayer } from './StorageUploadLayer';
```

Wrap the scrollable content region (the `<div className="min-h-0 flex-1 overflow-y-auto">…</div>`) inside `<StorageUploadLayer folderId={state.view === 'folder' ? state.currentFolderId : null}>…</StorageUploadLayer>`. Keep the toolbar above the layer and the drawer/modal after it.

- [ ] **Step 7: Typecheck, lint, run storage tests, commit**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: PASS.

```bash
git add apps/web/src/modules/storage/
git commit -m "feat(storage): upload flow with drag-and-drop and progress queue"
```

---

## Task 12: Dialogs (new folder, rename, move, trash, purge)

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageDialogs.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageMainPane.tsx` (render + wire events)
- Modify: `apps/web/src/modules/storage/components/StorageRail.tsx` (pass `onNewFolder`)
- Modify: `apps/web/src/modules/storage/StoragePage.tsx` (lift new-folder trigger)

- [ ] **Step 1: Implement the dialogs in one file**

Create `apps/web/src/modules/storage/components/StorageDialogs.tsx`:

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n';

import type { StorageNode, StorageTreeNode } from '../data/types';

export function NameDialog({
  open,
  title,
  label,
  confirmLabel,
  initialValue,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  confirmLabel: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && value.trim()) onConfirm(value.trim());
          }}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <CancelLabel />
          </Button>
          <Button variant="cta" disabled={!value.trim()} onClick={() => onConfirm(value.trim())}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelLabel() {
  const { t } = useTranslation();
  return <>{t('storage.dialogs.cancel')}</>;
}

export function ConfirmDialog({
  open,
  title,
  body,
  destructive,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  destructive?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{body}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('storage.dialogs.cancel')}
          </Button>
          <Button variant={destructive ? 'destructive' : 'cta'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MoveDialog({
  open,
  tree,
  node,
  onConfirm,
  onClose,
}: {
  open: boolean;
  tree: StorageTreeNode[];
  node: StorageNode | null;
  onConfirm: (targetFolderId: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<string | null>(null);

  function renderRow(folder: StorageTreeNode, depth: number) {
    if (folder.id === node?.id) return null; // can't move into itself
    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => setTarget(folder.id)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex w-full items-center rounded-control px-2 py-1.5 text-left text-sm ${
            target === folder.id ? 'bg-cta/10 text-cta' : 'hover:bg-muted'
          }`}
        >
          {folder.name}
        </button>
        {folder.children.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('storage.dialogs.moveTitle')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto rounded-card bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTarget(null)}
            className={`flex w-full items-center rounded-control px-2 py-1.5 text-left text-sm ${
              target === null ? 'bg-cta/10 text-cta' : 'hover:bg-muted'
            }`}
          >
            {t('storage.nav.all')}
          </button>
          {tree.map((folder) => renderRow(folder, 1))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('storage.dialogs.cancel')}
          </Button>
          <Button variant="cta" onClick={() => onConfirm(target)}>
            {t('storage.actions.move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire the dialogs and document events in the main pane**

In `StorageMainPane.tsx`:

Add imports:

```tsx
import { useEffect, useState } from 'react';
import { ConfirmDialog, MoveDialog, NameDialog } from './StorageDialogs';
```

Add local dialog state inside the component:

```tsx
const [renameNode, setRenameNode] = useState<StorageNode | null>(null);
const [moveNode, setMoveNode] = useState<StorageNode | null>(null);
const [trashNode, setTrashNode] = useState<StorageNode | null>(null);
const [purgeNode, setPurgeNode] = useState<StorageNode | null>(null);
const [newFolderOpen, setNewFolderOpen] = useState(false);

useEffect(() => {
  const onRename = (event: Event) => setRenameNode((event as CustomEvent<StorageNode>).detail);
  const onMove = (event: Event) => setMoveNode((event as CustomEvent<StorageNode>).detail);
  const onTrash = (event: Event) => setTrashNode((event as CustomEvent<StorageNode>).detail);
  const onPurge = (event: Event) => setPurgeNode((event as CustomEvent<StorageNode>).detail);
  const onNewFolder = () => setNewFolderOpen(true);
  document.addEventListener('storage:rename', onRename);
  document.addEventListener('storage:move', onMove);
  document.addEventListener('storage:trash', onTrash);
  document.addEventListener('storage:purge', onPurge);
  document.addEventListener('storage:newFolder', onNewFolder);
  return () => {
    document.removeEventListener('storage:rename', onRename);
    document.removeEventListener('storage:move', onMove);
    document.removeEventListener('storage:trash', onTrash);
    document.removeEventListener('storage:purge', onPurge);
    document.removeEventListener('storage:newFolder', onNewFolder);
  };
}, []);
```

Render the dialogs before `</section>`:

```tsx
      <NameDialog
        open={newFolderOpen}
        title={t('storage.dialogs.newFolderTitle')}
        label={t('storage.dialogs.newFolderLabel')}
        confirmLabel={t('storage.dialogs.create')}
        initialValue=""
        onClose={() => setNewFolderOpen(false)}
        onConfirm={(name) => {
          mutations.createFolder.mutate(
            { name, parentId: state.view === 'folder' ? state.currentFolderId : null },
            { onError: (error) => appToast.fromApiError(error, t('storage.errors.load')) },
          );
          setNewFolderOpen(false);
        }}
      />
      <NameDialog
        open={Boolean(renameNode)}
        title={t('storage.dialogs.renameTitle')}
        label={t('storage.dialogs.renameLabel')}
        confirmLabel={t('storage.dialogs.save')}
        initialValue={renameNode?.name ?? ''}
        onClose={() => setRenameNode(null)}
        onConfirm={(name) => {
          if (renameNode) mutations.rename.mutate({ id: renameNode.id, name });
          setRenameNode(null);
        }}
      />
      <MoveDialog
        open={Boolean(moveNode)}
        tree={treeQuery.data ?? []}
        node={moveNode}
        onClose={() => setMoveNode(null)}
        onConfirm={(targetFolderId) => {
          if (moveNode) mutations.move.mutate({ nodeIds: [moveNode.id], targetFolderId });
          setMoveNode(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(trashNode)}
        title={t('storage.dialogs.trashTitle')}
        body={t('storage.dialogs.trashBody', { name: trashNode?.name ?? '' })}
        destructive
        confirmLabel={t('storage.actions.trash')}
        onClose={() => setTrashNode(null)}
        onConfirm={() => {
          if (trashNode) mutations.trash.mutate([trashNode.id]);
          setTrashNode(null);
        }}
      />
      <ConfirmDialog
        open={Boolean(purgeNode)}
        title={t('storage.dialogs.purgeTitle')}
        body={t('storage.dialogs.purgeBody', { name: purgeNode?.name ?? '' })}
        destructive
        confirmLabel={t('storage.actions.deleteForever')}
        onClose={() => setPurgeNode(null)}
        onConfirm={() => {
          if (purgeNode) mutations.purge.mutate([purgeNode.id]);
          setPurgeNode(null);
        }}
      />
```

- [ ] **Step 3: Trigger new-folder from the rail**

In `StorageRail.tsx`, change the `onNewFolder` default so the rail always emits the event. Where `StorageRail` is rendered in `StoragePage.tsx`, pass:

```tsx
<StorageRail
  state={state}
  className="hidden w-60 shrink-0 lg:flex"
  onNewFolder={() => document.dispatchEvent(new CustomEvent('storage:newFolder'))}
/>
```

- [ ] **Step 4: Typecheck, lint, run storage tests, commit**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: PASS.

```bash
git add apps/web/src/modules/storage/
git commit -m "feat(storage): new-folder, rename, move, trash, purge dialogs"
```

---

## Task 13: Storage-usage meter + final polish

**Files:**

- Create: `apps/web/src/modules/storage/components/StorageUsageMeter.tsx`
- Modify: `apps/web/src/modules/storage/components/StorageRail.tsx` (render the meter at the bottom)

- [ ] **Step 1: Implement the usage meter**

Create `apps/web/src/modules/storage/components/StorageUsageMeter.tsx`:

```tsx
import { cn } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';

import { formatBytes } from '../data/fileTypes';
import { useStorageUsage } from '../data/useStorageData';

export function StorageUsageMeter() {
  const { t } = useTranslation();
  const usageQuery = useStorageUsage();
  const usage = usageQuery.data;
  if (!usage) return null;

  const percent = Math.min(100, Math.round(usage.usagePercent));
  const warning = percent >= 90;

  return (
    <div className="px-2.5 pt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', warning ? 'bg-destructive' : 'bg-cta')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {t('storage.usage', {
          used: formatBytes(usage.usedBytes),
          limit: formatBytes(usage.limitBytes),
        })}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Render it at the bottom of the rail**

In `StorageRail.tsx`, import and render `<StorageUsageMeter />` as the last child of the `<aside>` (after the tree scroll region):

```tsx
import { StorageUsageMeter } from './StorageUsageMeter';
```

```tsx
<StorageUsageMeter />
```

- [ ] **Step 3: Typecheck, lint, run storage tests, commit**

Run: `pnpm --filter @oktavius/web typecheck && pnpm --filter @oktavius/web lint && pnpm --filter @oktavius/web exec vitest run src/modules/storage`
Expected: PASS.

```bash
git add apps/web/src/modules/storage/components/
git commit -m "feat(storage): storage usage meter in rail"
```

---

## Task 14: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full web test suite**

Run: `pnpm --filter @oktavius/web test`
Expected: PASS (all suites, including the new storage tests).

- [ ] **Step 2: Typecheck the whole workspace**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Lint**

Run: `pnpm --filter @oktavius/web lint`
Expected: PASS (no module-boundary violations, no banned-import or raw-color violations).

- [ ] **Step 4: Manual smoke (dev server)**

Run: `pnpm dev`
In the browser, navigate to `/storage` and verify:

- Folder tree loads in the rail; clicking a folder updates the grid + breadcrumb + URL `?folder=`.
- Grid/list toggle switches layout and persists across reload.
- Single-click a file opens the details drawer; double-click opens the preview modal with ‹ › navigation.
- Quick-nav switches between All / Recent / Starred / Trash; Trash shows Restore / Delete-forever actions.
- Upload via the header CTA and via drag-and-drop both work, with progress and toast.
- New folder / rename / move / trash / purge dialogs work and the list refreshes.

> If the dev server has no backend configured (`VITE_OKTAVIUS_API_BASE_URL` unset), requests hit `/v1/...` and will 404 — that is expected without the osiris API. Verify the UI renders loading/empty/error states gracefully; full data flow requires the backend.

- [ ] **Step 5: Final commit (if any polish was needed)**

```bash
git add -A
git commit -m "chore(storage): final verification fixes"
```

---

## Self-review notes

- **Spec coverage:** tree (T6) · folder list (T8) · upload (T11) · download (T8 action) · create folder (T12) · rename (T12) · move (T12) · trash+restore+purge (T8/T12) · favorites (T8 action + T6 nav) · search (T7) · grid+list (T8) · breadcrumb (T7) · preview drawer (T9) + modal (T10) · usage (T13) · errors via `appToast.fromApiError` · i18n namespace (T1) · tests (T2/T3/T4/T5/T8/T11). All in-scope spec items map to a task.
- **Deferred (per spec):** tags/labels, multi-select bulk UI, entity-linking, AI indexing, permissions matrix, system/virtual folders — none implemented, as intended. (Bulk endpoints are used with single-element arrays.)
- **Type consistency:** `StorageItemActions`, `StorageViewState`, client method names, and query-key factory names are used identically across tasks.
- **Open items resolved during grounding:** API prefix uses `resolveOsirisApiBaseUrl()` (default `/v1`); `storage.view` is a valid `OsirisPermissionKey` (it is `string`); `PreviewDocument` maps from a node via `{ name, mimeType, fileExtension, sourceUrl }`.
- **Implementer confirmations flagged inline:** router import name (`react-router` vs `react-router-dom`), presence of `@testing-library/react` + `user-event`, `cn` export from base-ui, and exact navigation.json structure.
