import { Button, Checkbox, cn } from '@oktavius/base-ui';

import { CRUD_TABLE_SELECTION_CHECKBOX_CLASS } from '@/components/data/crudTableDensity';
import { useTranslation } from '@/core/i18n';
import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { type StorageItemActions, StorageItemMenu } from './StorageItemMenu';

const COLUMNS = 'grid-cols-[36px_1fr_120px_140px_40px]';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function StorageList({
  nodes,
  actions,
  inTrash,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onOpen,
}: {
  nodes: StorageNode[];
  actions: StorageItemActions;
  inTrash: boolean;
  selectedIds: string[];
  onToggleSelect: (node: StorageNode) => void;
  onToggleAll: () => void;
  onOpen: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  const allSelected = nodes.length > 0 && nodes.every((node) => selectedIds.includes(node.id));
  const someSelected = !allSelected && nodes.some((node) => selectedIds.includes(node.id));

  return (
    <div className="rounded-card bg-card">
      <div
        className={cn(
          'grid items-center gap-3 border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground',
          COLUMNS,
        )}
      >
        <Checkbox
          className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          aria-label="Select all"
          onCheckedChange={onToggleAll}
        />
        <span>{t('storage.columns.name')}</span>
        <span>{t('storage.columns.size')}</span>
        <span>{t('storage.columns.modified')}</span>
        <span />
      </div>
      {nodes.map((node) => {
        const Icon = fileIcon(node);
        const kind = getFileKind(node);
        const selected = selectedIds.includes(node.id);
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
              'group grid items-center gap-3 px-3 py-2 text-sm',
              COLUMNS,
              'hover:bg-muted',
              selected && 'bg-cta/5',
            )}
          >
            <Checkbox
              className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
              checked={selected}
              aria-label={`Select ${node.name}`}
              onClick={(event) => event.stopPropagation()}
              onCheckedChange={() => onToggleSelect(node)}
            />
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
