import { Button, cn } from '@oktavius/base-ui';

import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { type StorageItemActions, StorageItemMenu } from './StorageItemMenu';

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
            onKeyDown={(event) => {
              if (event.key === 'Enter') onOpen(node);
              else if (event.key === ' ') {
                event.preventDefault();
                onSelect(node);
              }
            }}
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
