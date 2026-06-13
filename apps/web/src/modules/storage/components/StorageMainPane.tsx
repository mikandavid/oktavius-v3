import { cn, InlineEmptyState, Skeleton } from '@oktavius/base-ui';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { StorageNode } from '../data/types';
import {
  useFavorites,
  useRecent,
  useStorageClient,
  useStorageMutations,
  useStorageNodes,
  useStorageTree,
  useTrash,
} from '../data/useStorageData';
import type { StorageViewState } from '../useStorageViewState';
import { StorageDetailsDrawer } from './StorageDetailsDrawer';
import { ConfirmDialog, MoveDialog, NameDialog } from './StorageDialogs';
import { StorageGrid } from './StorageGrid';
import type { StorageItemActions } from './StorageItemMenu';
import { StorageList } from './StorageList';
import { StoragePreviewModal } from './StoragePreviewModal';
import { StorageToolbar } from './StorageToolbar';
import { StorageUploadLayer } from './StorageUploadLayer';

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

  const orderedNodes = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        if (a.nodeType !== b.nodeType) return a.nodeType === 'folder' ? -1 : 1;
        return 0;
      }),
    [nodes],
  );

  const selectedNode = orderedNodes.find((node) => node.id === state.selectedNodeId) ?? null;

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
      <StorageUploadLayer folderId={state.view === 'folder' ? state.currentFolderId : null}>
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
      </StorageUploadLayer>
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
      <StoragePreviewModal
        nodes={orderedNodes}
        currentId={state.previewNodeId}
        onNavigate={(id) => state.setPreviewNodeId(id)}
        onClose={() => state.setPreviewNodeId(null)}
        onDownload={actions.onDownload}
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
          if (renameNode)
            mutations.rename.mutate(
              { id: renameNode.id, name },
              { onError: (error) => appToast.fromApiError(error, t('storage.errors.load')) },
            );
          setRenameNode(null);
        }}
      />
      <MoveDialog
        open={Boolean(moveNode)}
        tree={treeQuery.data ?? []}
        node={moveNode}
        onClose={() => setMoveNode(null)}
        onConfirm={(targetFolderId) => {
          if (moveNode)
            mutations.move.mutate(
              { nodeIds: [moveNode.id], targetFolderId },
              { onError: (error) => appToast.fromApiError(error, t('storage.errors.load')) },
            );
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
          state.setSelectedNodeId(null);
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
          state.setSelectedNodeId(null);
        }}
      />
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
