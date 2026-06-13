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
