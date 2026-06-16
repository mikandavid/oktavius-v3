import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { useTranslation } from '@/core/i18n';
import { DocumentIcon, NewFolderIcon, UploadIcon } from '@/lib/icons';

/**
 * Wraps the storage file pane so right-clicking empty space (or any non-menu
 * area) offers the two create affordances. Disabled outside the folder view,
 * where creating a folder or uploading would have no meaningful destination.
 */
export function StoragePaneContextMenu({
  enabled,
  onNewFolder,
  onNewTextFile,
  onUpload,
  className,
  children,
}: {
  enabled: boolean;
  onNewFolder: () => void;
  onNewTextFile: () => void;
  onUpload: () => void;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    // base-ui ContextMenu is non-modal by default, so a right-click at a new
    // position re-anchors the menu rather than just dismissing it.
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className={className}>{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={onNewFolder}>
          <NewFolderIcon size={16} /> {t('storage.newFolder')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onNewTextFile}>
          <DocumentIcon size={16} /> {t('storage.newTextFile')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={onUpload}>
          <UploadIcon size={16} /> {t('storage.actions.upload')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
