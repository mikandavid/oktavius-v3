import { Button, cn, InlineEmptyState, Skeleton } from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { CrudTableBulkActionBar } from '@/components/data/CrudTableBulkActionBar';
import type { BulkAction } from '@/components/data/crudTableTypes';
import { toggleAllIds, toggleId } from '@/components/data/gridUtils';
import { useTranslation } from '@/core/i18n';
import { DeleteIcon, DownloadIcon, MoveToFolderIcon, NewFolderIcon, UploadIcon } from '@/lib/icons';
import type { PermissionSubject } from '@/lib/permissions';
import { appToast } from '@/lib/toast';
import { formatUserFacingApiError } from '@/lib/userFacingApiError';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { buildStorageZip } from '../data/downloadZip';
import { isEditableTextFile, markdownToFile, nextUntitledName } from '../data/textFiles';
import type { StorageNode } from '../data/types';
import { uploadFile } from '../data/uploadFile';
import {
  useFavorites,
  useInvalidateStorage,
  useRecent,
  useStorageClient,
  useStorageMutations,
  useStorageNodes,
  useStorageTree,
  useTrash,
} from '../data/useStorageData';
import type { StorageViewState } from '../useStorageViewState';
import { ConfirmDialog, MoveDialog, NameDialog } from './StorageDialogs';
import { StorageDocumentEditorModal } from './StorageDocumentEditorModal';
import { StorageGrid } from './StorageGrid';
import type { StorageItemActions } from './StorageItemMenu';
import { StorageList } from './StorageList';
import { StoragePaneContextMenu } from './StoragePaneContextMenu';
import { StoragePreviewModal } from './StoragePreviewModal';
import { StorageToolbar } from './StorageToolbar';
import { StorageUploadLayer } from './StorageUploadLayer';

const EMPTY_SUBJECT: PermissionSubject = { isSuperadmin: false, role: null, permissions: [] };

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
  const invalidate = useInvalidateStorage();
  const permissionSubject = useOptionalOsirisRuntime()?.permissionSubject ?? EMPTY_SUBJECT;

  const folderQuery = useStorageNodes(
    {
      folderId: state.currentFolderId,
      sortBy: state.sort.by,
      sortDir: state.sort.dir,
      search: state.search.term || undefined,
      scope: state.search.scope,
    },
    state.view === 'folder',
  );
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

  const orderedNodes = useMemo(() => {
    const direction = state.sort.dir === 'asc' ? 1 : -1;
    return [...nodes].sort((a, b) => {
      if (a.nodeType !== b.nodeType) return a.nodeType === 'folder' ? -1 : 1;
      switch (state.sort.by) {
        case 'updatedAt':
          return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * direction;
        case 'fileSizeBytes':
          return ((a.fileSizeBytes ?? 0) - (b.fileSizeBytes ?? 0)) * direction;
        default:
          return a.name.localeCompare(b.name) * direction;
      }
    });
  }, [nodes, state.sort.by, state.sort.dir]);

  const rowIds = useMemo(() => orderedNodes.map((node) => node.id), [orderedNodes]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renameNode, setRenameNode] = useState<StorageNode | null>(null);
  const [moveIds, setMoveIds] = useState<string[] | null>(null);
  const [trashIds, setTrashIds] = useState<string[] | null>(null);
  const [purgeIds, setPurgeIds] = useState<string[] | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [creatingTextFile, setCreatingTextFile] = useState(false);

  // Reset selection when the visible list changes.
  useEffect(() => {
    setSelectedIds([]);
  }, [state.view, state.currentFolderId, state.search.term]);

  useEffect(() => {
    const onRename = (event: Event) => setRenameNode((event as CustomEvent<StorageNode>).detail);
    const onMove = (event: Event) => setMoveIds([(event as CustomEvent<StorageNode>).detail.id]);
    const onTrash = (event: Event) => setTrashIds([(event as CustomEvent<StorageNode>).detail.id]);
    const onPurge = (event: Event) => setPurgeIds([(event as CustomEvent<StorageNode>).detail.id]);
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

  const onError = (error: unknown) => appToast.fromApiError(error, t('storage.errors.load'));
  const openNewFolder = () => setNewFolderOpen(true);
  const triggerUpload = () => document.dispatchEvent(new CustomEvent('storage:upload'));
  const createTextFile = async () => {
    if (creatingTextFile) return;
    setCreatingTextFile(true);
    const folderId = state.view === 'folder' ? state.currentFolderId : null;
    const name = nextUntitledName(orderedNodes.map((item) => item.name));
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
  const isFolderView = state.view === 'folder';
  const showCreateCta = isFolderView && !state.search.term;
  const nameOf = (id: string) => orderedNodes.find((node) => node.id === id)?.name ?? '';
  const confirmBody = (ids: string[], one: string, many: string) =>
    ids.length === 1 ? t(one, { name: nameOf(ids[0] ?? '') }) : t(many, { count: ids.length });

  const actions: StorageItemActions = {
    isStarred: (node) => starredIds.has(node.id),
    onOpen: (node) => {
      if (node.nodeType === 'folder') {
        state.openFolder(node.id);
      } else if (isEditableTextFile(node)) {
        state.setEditingNodeId(node.id);
      } else {
        state.setPreviewNodeId(node.id);
      }
    },
    onDownload: async (node) => {
      try {
        const url = await client.downloadUrl(node.id);
        startFileDownload(url, node.name);
      } catch (error) {
        onError(error);
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

  const bulkActions: BulkAction[] = inTrash
    ? [
        {
          key: 'restore',
          label: t('storage.actions.restore'),
          onClick: (ids) => {
            ids.forEach((id) => mutations.restore.mutate(id));
            setSelectedIds([]);
          },
        },
        {
          key: 'purge',
          label: t('storage.actions.deleteForever'),
          icon: <DeleteIcon size={16} />,
          destructive: true,
          onClick: (ids) => setPurgeIds(ids),
        },
      ]
    : [
        {
          key: 'download',
          label: t('storage.actions.download'),
          icon: <DownloadIcon size={16} />,
          onClick: async (ids) => {
            const selected = ids
              .map((id) => orderedNodes.find((node) => node.id === id))
              .filter((node): node is StorageNode => Boolean(node));
            const single = selected.length === 1 ? selected[0] : null;

            // A single file downloads directly; anything else (multiple files or
            // a folder) is bundled into a single ZIP.
            if (single && single.nodeType === 'file') {
              try {
                const url = await client.downloadUrl(single.id);
                startFileDownload(url, single.name);
              } catch (error) {
                onError(error);
              }
              return;
            }

            const zipName =
              single && single.nodeType === 'folder' ? `${single.name}.zip` : 'storage-export.zip';
            await appToast.promise(
              buildStorageZip(client, selected).then((blob) => startBlobDownload(blob, zipName)),
              {
                loading: t('storage.zip.preparing'),
                success: t('storage.zip.ready'),
                error: (error: unknown) =>
                  formatUserFacingApiError(error, { fallback: t('storage.zip.failed') }),
              },
            );
          },
        },
        {
          key: 'move',
          label: t('storage.actions.move'),
          icon: <MoveToFolderIcon size={16} />,
          onClick: (ids) => setMoveIds(ids),
        },
        {
          key: 'trash',
          label: t('storage.actions.trash'),
          icon: <DeleteIcon size={16} />,
          destructive: true,
          onClick: (ids) => setTrashIds(ids),
        },
      ];

  return (
    <section
      className={cn('flex min-h-0 flex-col overflow-hidden rounded-card bg-card', className)}
      data-testid="storage-main"
    >
      <div className="shrink-0 border-b border-border/50">
        <StorageToolbar state={state} tree={treeQuery.data ?? []} />
      </div>
      <CrudTableBulkActionBar
        selectedCount={selectedIds.length}
        actions={bulkActions}
        selectedIds={selectedIds}
        rowIds={rowIds}
        onClear={() => setSelectedIds([])}
        onToggleAll={() => setSelectedIds(toggleAllIds(rowIds, selectedIds))}
        invokeBulkAction={(action, ids) => action.onClick(ids)}
        permissionSubject={permissionSubject}
      />
      <StorageUploadLayer folderId={state.view === 'folder' ? state.currentFolderId : null}>
        <StoragePaneContextMenu
          enabled={isFolderView}
          onNewFolder={openNewFolder}
          onNewTextFile={() => void createTextFile()}
          onUpload={triggerUpload}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]"
        >
          {isLoading ? (
            <GridSkeleton />
          ) : orderedNodes.length === 0 ? (
            <InlineEmptyState
              centered
              text={t(state.search.term ? 'storage.empty.search' : `storage.empty.${state.view}`)}
              action={
                showCreateCta ? (
                  <>
                    <Button variant="outline" onClick={openNewFolder}>
                      <NewFolderIcon size={16} /> {t('storage.newFolder')}
                    </Button>
                    <Button variant="cta" onClick={triggerUpload}>
                      <UploadIcon size={16} /> {t('storage.actions.upload')}
                    </Button>
                  </>
                ) : undefined
              }
            />
          ) : state.displayMode === 'grid' ? (
            <StorageGrid
              nodes={orderedNodes}
              actions={actions}
              inTrash={inTrash}
              selectedIds={selectedIds}
              onToggleSelect={(node) => setSelectedIds(toggleId(selectedIds, node.id))}
              onOpen={actions.onOpen}
            />
          ) : (
            <StorageList
              nodes={orderedNodes}
              actions={actions}
              inTrash={inTrash}
              selectedIds={selectedIds}
              onToggleSelect={(node) => setSelectedIds(toggleId(selectedIds, node.id))}
              onToggleAll={() => setSelectedIds(toggleAllIds(rowIds, selectedIds))}
              onOpen={actions.onOpen}
            />
          )}
        </StoragePaneContextMenu>
      </StorageUploadLayer>
      <StoragePreviewModal
        nodes={orderedNodes}
        currentId={state.previewNodeId}
        onNavigate={(id) => state.setPreviewNodeId(id)}
        onClose={() => state.setPreviewNodeId(null)}
        onDownload={actions.onDownload}
        onDelete={(node) => {
          state.setPreviewNodeId(null);
          actions.onTrash(node);
        }}
      />
      <StorageDocumentEditorModal
        nodeId={state.editingNodeId}
        onClose={() => state.setEditingNodeId(null)}
        onNodeIdChange={(id) => state.setEditingNodeId(id)}
        onOpenFullPage={(id) => {
          state.setEditingNodeId(null);
          state.openDocument(id);
        }}
      />
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
            { onError },
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
          if (renameNode) mutations.rename.mutate({ id: renameNode.id, name }, { onError });
          setRenameNode(null);
        }}
      />
      <MoveDialog
        open={Boolean(moveIds)}
        tree={treeQuery.data ?? []}
        excludeIds={moveIds ?? []}
        onClose={() => setMoveIds(null)}
        onConfirm={(targetFolderId) => {
          if (moveIds) mutations.move.mutate({ nodeIds: moveIds, targetFolderId }, { onError });
          setMoveIds(null);
          setSelectedIds([]);
        }}
      />
      <ConfirmDialog
        open={Boolean(trashIds)}
        title={t('storage.dialogs.trashTitle')}
        body={confirmBody(
          trashIds ?? [],
          'storage.dialogs.trashBody',
          'storage.dialogs.trashBodyMany',
        )}
        destructive
        confirmLabel={t('storage.actions.trash')}
        onClose={() => setTrashIds(null)}
        onConfirm={() => {
          if (trashIds) mutations.trash.mutate(trashIds, { onError });
          setTrashIds(null);
          setSelectedIds([]);
        }}
      />
      <ConfirmDialog
        open={Boolean(purgeIds)}
        title={t('storage.dialogs.purgeTitle')}
        body={confirmBody(
          purgeIds ?? [],
          'storage.dialogs.purgeBody',
          'storage.dialogs.purgeBodyMany',
        )}
        destructive
        confirmLabel={t('storage.actions.deleteForever')}
        onClose={() => setPurgeIds(null)}
        onConfirm={() => {
          if (purgeIds) mutations.purge.mutate(purgeIds, { onError });
          setPurgeIds(null);
          setSelectedIds([]);
        }}
      />
    </section>
  );
}

// Forces a real download instead of opening the file in the browser. The signed
// download URL is a Supabase storage URL; appending `download` makes the server
// respond with Content-Disposition: attachment (the param is outside the token,
// so it is safe to add) and the anchor click triggers the save dialog.
function startFileDownload(url: string, filename: string) {
  const target = new URL(url);
  target.searchParams.set('download', filename);
  const anchor = document.createElement('a');
  anchor.href = target.toString();
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

// Triggers a download for an in-memory blob (e.g. a generated ZIP) via a
// temporary object URL that is revoked once the click is dispatched.
function startBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
    <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-[3.75rem] w-full rounded-card" />
      ))}
    </div>
  );
}
