import { cn, InlineEmptyState, Skeleton } from '@oktavius/base-ui';
import { useMemo } from 'react';

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
import { StorageGrid } from './StorageGrid';
import type { StorageItemActions } from './StorageItemMenu';
import { StorageList } from './StorageList';
import { StoragePreviewModal } from './StoragePreviewModal';
import { StorageToolbar } from './StorageToolbar';

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

  const orderedNodes = useMemo(
    () =>
      [...nodes].sort((a, b) => {
        if (a.nodeType !== b.nodeType) return a.nodeType === 'folder' ? -1 : 1;
        return 0;
      }),
    [nodes],
  );

  const selectedNode = orderedNodes.find((node) => node.id === state.selectedNodeId) ?? null;

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
