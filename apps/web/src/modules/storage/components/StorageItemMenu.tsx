import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n';
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  EyeIcon,
  MoveToFolderIcon,
  StarIcon,
} from '@/lib/icons';

import type { StorageNode } from '../data/types';

export interface StorageItemActions {
  isStarred: (node: StorageNode) => boolean;
  onOpen: (node: StorageNode) => void;
  onDownload: (node: StorageNode) => void;
  onRename: (node: StorageNode) => void;
  onMove: (node: StorageNode) => void;
  onToggleStar: (node: StorageNode) => void;
  onTrash: (node: StorageNode) => void;
  onRestore: (node: StorageNode) => void;
  onPurge: (node: StorageNode) => void;
}

export function StorageItemMenu({
  node,
  actions,
  inTrash,
  trigger,
}: {
  node: StorageNode;
  actions: StorageItemActions;
  inTrash: boolean;
  trigger: ReactNode;
}) {
  const { t } = useTranslation();
  const isFile = node.nodeType === 'file';
  const starred = actions.isStarred(node);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {inTrash ? (
          <>
            <DropdownMenuItem onSelect={() => actions.onRestore(node)}>
              <EyeIcon size={16} /> {t('storage.actions.restore')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onPurge(node)} className="text-destructive">
              <DeleteIcon size={16} /> {t('storage.actions.deleteForever')}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => actions.onOpen(node)}>
              <EyeIcon size={16} /> {t('storage.actions.open')}
            </DropdownMenuItem>
            {isFile && (
              <DropdownMenuItem onSelect={() => actions.onDownload(node)}>
                <DownloadIcon size={16} /> {t('storage.actions.download')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => actions.onRename(node)}>
              <EditIcon size={16} /> {t('storage.actions.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.onMove(node)}>
              <MoveToFolderIcon size={16} /> {t('storage.actions.move')}
            </DropdownMenuItem>
            {isFile && (
              <DropdownMenuItem onSelect={() => actions.onToggleStar(node)}>
                <StarIcon size={16} weight={starred ? 'fill' : 'regular'} />{' '}
                {starred ? t('storage.actions.unstar') : t('storage.actions.star')}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => actions.onTrash(node)} className="text-destructive">
              <DeleteIcon size={16} /> {t('storage.actions.trash')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
