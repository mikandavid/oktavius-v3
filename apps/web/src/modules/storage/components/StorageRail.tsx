import { Button, cn, Skeleton } from '@oktavius/base-ui';
import type { ComponentType } from 'react';

import { useTranslation } from '@/core/i18n';
import {
  DeleteIcon,
  DocumentIcon,
  HistoryIcon,
  type IconProps,
  PlusIcon,
  StarIcon,
} from '@/lib/icons';

import type { StorageView } from '../data/types';
import { useStorageTree } from '../data/useStorageData';
import type { StorageViewState } from '../useStorageViewState';
import { StorageFolderTree } from './StorageFolderTree';
import { StorageUsageMeter } from './StorageUsageMeter';

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
      className={cn('flex min-h-0 flex-col gap-4 self-stretch rounded-card bg-card p-3', className)}
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

      <StorageUsageMeter />
    </aside>
  );
}
