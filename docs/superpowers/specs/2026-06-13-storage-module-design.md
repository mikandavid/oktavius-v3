# Storage Module — Design Spec

**Date:** 2026-06-13
**Branch:** FE
**Status:** Approved (pending implementation plan)

## Goal

Build a Storage module for the oktavius-v3 frontend that replaces the osiris ERP
storage frontend. It should feel like a clean, modern OS file explorer / Google
Drive: fast to navigate, pleasant to use, and fully aligned with the V3 design
system. This build targets the **core explorer experience**, done to a high
polish; advanced ERP features are explicitly deferred (see Out of Scope).

## Decisions (from brainstorming)

- **Data layer:** wire the **real osiris storage backend** (not demo/local data).
- **Scope:** **core explorer**, done beautifully.
- **Layout:** persistent **folder-tree rail** + main pane (Drive/Finder classic).
- **File interaction:** single-click → **side details drawer**; double-click →
  **full-screen preview modal**. No separate detail route.

## In Scope

Browse folder tree, list folder contents, upload, download, create folder,
rename, move, trash + restore (+ purge from trash), favorite/star, search,
grid & list views, breadcrumbs, file preview, storage-usage display.

## Out of Scope (deferred to later passes)

Tags & labels, bulk multi-select operations, entity-linking (attach files to
projects/contacts/invoices), AI folder indexing (RagFlow Q&A), permissions
matrix UI, system/virtual project-folder synthesis.

> Note: the backend `move`/`trash`/`purge` endpoints are bulk (`nodeIds[]`). This
> build uses them for single-item actions (arrays of length 1). The richer
> multi-select UX is deferred, but the client methods accept arrays so the UI can
> grow into them without a contract change.

---

## Architecture

Self-contained module at `apps/web/src/modules/storage/`, registered once in
`apps/web/src/lib/appNavModules.ts`. The router builds the `/storage` route from
that manifest entry automatically.

```
modules/storage/
  StoragePage.tsx            # shell: ModulePage + rail + main + drawer/modal orchestration
  components/
    StorageRail.tsx          # quick-nav (All/Recent/Starred/Trash) + folder tree + New folder
    StorageFolderTree.tsx    # recursive tree from /storage/tree, expand/collapse
    StorageToolbar.tsx       # breadcrumb · search · sort · grid/list toggle
    StorageGrid.tsx          # grid of tiles
    StorageList.tsx          # dense list/table view
    StorageItem.tsx          # one tile/row; hover ⋯ DropdownMenu of actions
    StorageDetailsDrawer.tsx # right Drawer on single-click (preview + metadata + actions)
    StoragePreviewModal.tsx  # full-screen Dialog on double-click (DocumentPreview + ‹ ›)
    StorageUploadLayer.tsx   # drag-drop overlay + upload progress queue
    StorageViewToggle.tsx    # small grid/list segmented control (no base-ui ToggleGroup exists)
    StorageBreadcrumb.tsx    # breadcrumb with SPA click handlers (wraps/forms base-ui Breadcrumb)
    dialogs/
      NewFolderDialog.tsx
      RenameDialog.tsx
      MoveDialog.tsx          # folder picker (reuses /storage/tree)
      ConfirmTrashDialog.tsx
      ConfirmPurgeDialog.tsx  # 30-day retention note
  data/
    storageClient.ts         # createOsirisStorageClient (mirrors membersAdminClient)
    useStorageData.ts        # react-query hooks: queries + mutations
    storageKeys.ts           # query keys scoped to activeOrgId
    types.ts                 # StorageNode, StorageTreeNode, StorageUsage, UploadSession, view state
    fileTypes.ts             # ext/mime → icon + accent; formatBytes
  StoragePage.test.tsx
```

**Module boundary:** never imports another module. Allowed cross-cutting deps:
`@oktavius/base-ui`, `@/components/common` (ModulePage, page-header buttons),
`@/components/documents/DocumentPreview`, `@/core/i18n`, `@/lib/icons`,
`@/lib/toast`, `@/runtime/osiris`.

---

## Data layer

### Client

`storageClient.ts` follows the **`membersAdminClient.ts` pattern** exactly:
`createOsirisStorageClient({ baseUrl })` returning an object of async methods,
each using `joinOsirisApiBaseUrl(baseUrl, path)`, `fetch(..., { credentials:
'include' })`, throwing `new Error(await readErrorMessage(res, fallback))` on
`!res.ok`, and normalizing responses (tolerating snake_case **or** camelCase)
into the camelCase types below.

Methods (1:1 with backend):

| Method                                                                                                    | Endpoint                                 |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `listTree()`                                                                                              | `GET /storage/tree`                      |
| `listNodes({folderId, search, scope, nodeType, sortBy, sortDir, page, pageSize, trashed, favoritesOnly})` | `GET /storage`                           |
| `search({q, folderId, scope, page, pageSize})`                                                            | `GET /storage/search`                    |
| `getNode(id)`                                                                                             | `GET /storage/:id`                       |
| `previewUrl(id)`                                                                                          | `GET /storage/:id/preview-url`           |
| `downloadUrl(id)`                                                                                         | `GET /storage/:id/download-url`          |
| `createFolder({name, parentId})`                                                                          | `POST /storage/folders`                  |
| `rename(id, name)`                                                                                        | `PATCH /storage/:id/name`                |
| `move(nodeIds, targetFolderId)`                                                                           | `POST /storage/bulk/move`                |
| `trash(nodeIds)`                                                                                          | `POST /storage/bulk/trash`               |
| `restore(id)`                                                                                             | `POST /storage/:id/restore`              |
| `purge(nodeIds)`                                                                                          | `POST /storage/bulk/purge`               |
| `listFavorites()`                                                                                         | `GET /storage/favorites`                 |
| `addFavorite(id)` / `removeFavorite(id)`                                                                  | `POST` / `DELETE /storage/favorites/:id` |
| `listRecent()`                                                                                            | `GET /storage/recent`                    |
| `listTrash({page, pageSize})`                                                                             | `GET /storage/trash`                     |
| `usage()`                                                                                                 | `GET /storage/usage`                     |
| `initiateUpload({folderId, fileName, mimeType, fileSizeBytes})`                                           | `POST /storage/uploads/initiate`         |
| `finalizeUpload({sessionId, contentSha256?})`                                                             | `POST /storage/uploads/finalize`         |
| `refreshUpload({sessionId})`                                                                              | `POST /storage/uploads/refresh`          |

### Types (camelCase, frontend-facing)

```ts
type StorageNodeType = 'folder' | 'file';
type UploadStatus = 'pending' | 'uploading' | 'ready' | 'failed';

interface StorageNode {
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
interface StorageTreeNode extends StorageNode {
  children: StorageTreeNode[];
}
interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercent: number;
}
interface NodeListResult {
  data: StorageNode[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
interface UploadSession {
  sessionId: string;
  nodeId: string;
  signedUrl: string;
  bucket: string;
  expiresAt: string | null;
  mimeType: string;
}
```

(`tags`, `metadata`, `customFields`, `contentSha256`, `duplicateOfNodeId`,
`storageBucket`, `storagePath`, `orgId`, `normalizedName`, `deletedAt` exist in
the backend payload but are unused by this build; the normalizer ignores them.)

### React-query wiring

Hooks in `useStorageData.ts`. `activeOrgId` comes from
`useOptionalOsirisRuntime()`; the client is memoized per render-tree.

Query keys (in `storageKeys.ts`), all prefixed with `['storage', activeOrgId, …]`:
`tree`, `nodes(folderId, sort, search, scope)`, `favorites`, `recent`,
`trash(page)`, `usage`, `node(id)`, `previewUrl(id)`, `downloadUrl(id)`.

- Preview/download URL queries use short `staleTime` (preview ~9 min, download
  ~55 min) to stay inside backend TTLs.
- Mutations (createFolder, rename, move, trash, restore, purge, upload)
  invalidate `tree` + the active `nodes` key + `usage`. **Favorite toggle is
  optimistic** against the active list and `favorites`.

### Upload flow

1. `initiateUpload` → returns `{ sessionId, signedUrl, mimeType, … }`.
2. **XHR `PUT`** to `signedUrl` with `Content-Type: <mimeType>` and
   `x-upsert: true`; report progress via `xhr.upload.onprogress`.
3. Compute SHA-256 client-side via `crypto.subtle` (skip when file > 50 MB →
   send no `contentSha256`).
4. `finalizeUpload({ sessionId, contentSha256? })` → `{ node, duplicateOfNodeId }`.
   If `duplicateOfNodeId` set, show a non-blocking info toast (upload still
   succeeds). Then invalidate.
5. On expiry/`refresh` need, call `refreshUpload` for a fresh signed URL.

Each in-flight upload is tracked in local component state (name, %, status) and
rendered in the upload progress queue.

---

## UI & interaction

### Shell

`ModulePage` with `title = t('storage.pageTitle')`, `icon = storagePageIcon()`
(new helper added to `modulePageIcons.tsx` using `FolderIcon`), optional
subtitle, and **one CTA** in `actions`: an "Upload" button (`variant="cta"`).
`fillHeight` so the explorer fills the viewport.

Body layout: left **folder-tree rail** (fixed width, hidden below `lg`) + main
pane (flex-1). The **details drawer** is a right `Drawer`; the **preview modal**
is a `Dialog`.

### Rail (`StorageRail`)

- Quick-nav buttons: **All files**, **Recent**, **Starred**, **Trash** (icons
  from `@/lib/icons`); active item gets the tinted-selected treatment.
- Divider, then the **folder tree** (`StorageFolderTree`) from `/storage/tree`:
  expand/collapse chevrons, `FolderIcon`/open-folder, selected folder highlighted.
- "New folder" affordance (opens `NewFolderDialog`, parent = current folder).

### Main pane

- `StorageToolbar`: **breadcrumb** (Home › … › current), **search** input,
  **sort** control (name / modified / size, asc·desc), **grid/list** toggle
  (`StorageViewToggle`).
- Content: `StorageGrid` (default) or `StorageList`. **Folders sort above
  files.** Search default scope = current folder, with a toggle for org-wide
  ("everywhere"). Recent/Starred/Trash views reuse the same grid/list.
- `StorageItem`: tile (grid) or row (list). Image files render a real thumbnail
  via `previewUrl`; others show a file-type icon + accent. Hover reveals a ⋯
  `DropdownMenu`: **Open, Download, Rename, Move, Star/Unstar, Trash**. In the
  Trash view, actions become **Restore** and **Delete forever**.
- **Double-click a folder** → navigate into it (updates `currentFolderId`).

### Details drawer (`StorageDetailsDrawer`)

Single-click a file opens it: small preview/thumbnail, metadata (size, type,
modified, created-by, containing folder), and quick actions (Open, Download,
Star, Rename, Move, Trash). Single-clicking a different file updates the drawer
in place; closing it clears `selectedNodeId`.

### Preview modal (`StoragePreviewModal`)

Double-click a file opens a full-screen `Dialog` using the shared
`DocumentPreview` component (images, PDFs, text, spreadsheets). Header shows the
file name + Download/Star; ‹ › arrows flip through the **files in the current
view** (folders skipped). Esc / overlay closes.

### Upload (`StorageUploadLayer`)

The header CTA opens a file picker; additionally the main pane is a drag-and-drop
target with a drop overlay. Selected/dropped files enter the upload queue and run
the 3-step flow with inline progress bars. Errors (network, quota 413) surface as
toasts; the queue entry shows failed state.

### State model

Held in `StoragePage` (with light URL sync):

```
view: 'folder' | 'recent' | 'starred' | 'trash'
currentFolderId: string | null
selectedNodeId: string | null   // drives drawer
previewNodeId: string | null     // drives modal
displayMode: 'grid' | 'list'     // persisted in localStorage
sort: { by: 'name'|'updatedAt'|'fileSizeBytes', dir: 'asc'|'desc' }
search: { term: string, scope: 'current'|'global' }
```

`view` and `currentFolderId` sync to URL query params (`?view=`, `?folder=`)
for deep-linking and refresh-safety.

---

## Aesthetic (V3 design system)

- Borderless white tiles (`bg-card`, `rounded-card`) on the `bg-muted/40` page
  wash; hover `bg-muted`; selection = brand-purple ring.
- **Brand purple reserved** for the single Upload CTA only.
- File-type icons from `@/lib/icons` (`DocumentIcon`, `ImageIcon`,
  `FileSpreadsheetIcon`, `FolderIcon`, …) with subtle per-type accent.
- Dense typography (`text-sm` / `text-xs`); no oversized headings.
- Loading → `Skeleton`; empty folders/views → `InlineEmptyState`.
- Storage-usage shown as a slim meter (turns warning color near the limit).

---

## Errors, i18n, testing

- **Errors:** mutations use `appToast.fromApiError(err, fallback)`. Friendly
  messages for quota-exceeded (413) and move-into-itself (409). Each query has
  loading / empty / error states.
- **i18n:** new `storage` namespace at
  `packages/i18n/locales/{en,de}/storage.json`; page gates on
  `usePreloadNamespaces(['storage'])` (`if (!ready) return <PageSkeleton/>`). Add
  `navigation.storage` to the navigation namespace.
- **Testing:**
  - `storageClient` normalization unit tests (snake_case + camelCase payloads).
  - Upload 3-step unit test (initiate → PUT → finalize, incl. SHA-256 skip path).
  - `StoragePage` render smoke test with mocked client + `TestI18nProvider`.
  - Interaction tests: item hover-menu actions, single-click drawer,
    double-click modal, folder navigation, view switching.
  - Lint/typecheck clean (`pnpm -w exec eslint apps/web/src`, `pnpm -w typecheck`).

---

## Open items to confirm during planning

- Exact osiris API path prefix in V3 (`/v1/storage` vs `/storage`) — resolve via
  `resolveOsirisApiBaseUrl()` like the members client.
- Whether `storage.view` / `storage.write` / `storage.delete` permission keys are
  already present in the V3 permissions enum, or need adding.
- Confirm `DocumentPreview`'s `PreviewDocument` prop shape maps cleanly from a
  `StorageNode` + signed preview URL.
