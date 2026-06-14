import { Button, Checkbox, cn } from '@oktavius/base-ui';

import { CRUD_TABLE_SELECTION_CHECKBOX_CLASS } from '@/components/data/crudTableDensity';
import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { type StorageItemActions, StorageItemMenu } from './StorageItemMenu';

function formatModified(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function StorageGrid({
  nodes,
  actions,
  inTrash,
  selectedIds,
  onToggleSelect,
  onOpen,
}: {
  nodes: StorageNode[];
  actions: StorageItemActions;
  inTrash: boolean;
  selectedIds: string[];
  onToggleSelect: (node: StorageNode) => void;
  onOpen: (node: StorageNode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {nodes.map((node) => {
        const Icon = fileIcon(node);
        const kind = getFileKind(node);
        const isFolder = node.nodeType === 'folder';
        const selected = selectedIds.includes(node.id);
        const meta = isFolder
          ? formatModified(node.updatedAt)
          : `${formatModified(node.updatedAt)} · ${formatBytes(node.fileSizeBytes)}`;

        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(node)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onOpen(node);
              else if (event.key === ' ') {
                event.preventDefault();
                onToggleSelect(node);
              }
            }}
            className={cn(
              'group relative flex items-center gap-3 rounded-card border border-border/60 bg-card px-3 py-3 text-left',
              'transition-shadow hover:shadow-elevated',
              selected && 'border-cta/40 ring-2 ring-cta/25',
            )}
          >
            <div className="relative shrink-0">
              <Icon
                size={24}
                weight="duotone"
                className={cn(
                  fileAccentClass(kind),
                  selected ? 'opacity-0' : 'opacity-100 group-hover:opacity-0',
                )}
              />
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-opacity',
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
              >
                <Checkbox
                  className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
                  checked={selected}
                  aria-label={`Select ${node.name}`}
                  onClick={(event) => event.stopPropagation()}
                  onCheckedChange={() => onToggleSelect(node)}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{node.name}</div>
              <div className="truncate text-xs text-muted-foreground">{meta}</div>
            </div>

            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
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
