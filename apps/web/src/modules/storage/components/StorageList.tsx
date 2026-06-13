import { Button, cn } from '@oktavius/base-ui';
import { useEffect, useRef } from 'react';

import { useTranslation } from '@/core/i18n';
import { MoreIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';
import { type StorageItemActions, StorageItemMenu } from './StorageItemMenu';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export function StorageList({
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
  const { t } = useTranslation();

  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (clickTimer.current) clearTimeout(clickTimer.current);
    },
    [],
  );

  const handleClick = (node: StorageNode) => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      onSelect(node);
      clickTimer.current = null;
    }, 220);
  };

  const handleOpen = (node: StorageNode) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
    onOpen(node);
  };

  return (
    <div className="rounded-card bg-card">
      <div className="grid grid-cols-[1fr_120px_140px_40px] gap-3 border-b border-border/60 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>{t('storage.columns.name')}</span>
        <span>{t('storage.columns.size')}</span>
        <span>{t('storage.columns.modified')}</span>
        <span />
      </div>
      {nodes.map((node) => {
        const Icon = fileIcon(node);
        const kind = getFileKind(node);
        const isFolder = node.nodeType === 'folder';
        return (
          <div
            key={node.id}
            role="button"
            tabIndex={0}
            onClick={() => (isFolder ? handleOpen(node) : handleClick(node))}
            onDoubleClick={() => handleOpen(node)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleOpen(node);
              else if (event.key === ' ') {
                event.preventDefault();
                if (isFolder) handleOpen(node);
                else onSelect(node);
              }
            }}
            className={cn(
              'group grid grid-cols-[1fr_120px_140px_40px] items-center gap-3 px-3 py-2 text-sm',
              'hover:bg-muted',
              selectedId === node.id && 'bg-cta/5',
            )}
          >
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
                    onDoubleClick={(event) => event.stopPropagation()}
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
