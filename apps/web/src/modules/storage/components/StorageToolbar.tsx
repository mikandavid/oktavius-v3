import { useTranslation } from '@/core/i18n';
import { ChevronRightIcon } from '@/lib/icons';

import type { StorageTreeNode } from '../data/types';
import type { StorageViewState } from '../useStorageViewState';
import { StorageHeaderControls } from './StorageHeaderControls';

interface Crumb {
  id: string | null;
  label: string;
}

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
    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
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
                    ? 'truncate font-medium text-foreground'
                    : 'shrink-0 text-muted-foreground hover:text-foreground'
                }
              >
                {crumb.label}
              </button>
            </span>
          );
        })}
      </nav>

      <StorageHeaderControls state={state} />
    </div>
  );
}
