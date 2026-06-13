import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { DownloadIcon, EyeIcon, StarIcon } from '@/lib/icons';

import { fileAccentClass, fileIcon, formatBytes, getFileKind } from '../data/fileTypes';
import type { StorageNode } from '../data/types';

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right text-foreground">{value}</span>
    </div>
  );
}

export function StorageDetailsDrawer({
  node,
  starred,
  onClose,
  onOpen,
  onDownload,
  onToggleStar,
}: {
  node: StorageNode | null;
  starred: boolean;
  onClose: () => void;
  onOpen: (node: StorageNode) => void;
  onDownload: (node: StorageNode) => void;
  onToggleStar: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  const open = Boolean(node);
  const Icon = node ? fileIcon(node) : null;

  return (
    <Drawer open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DrawerContent side="right" className="min-w-0">
        {node && Icon && (
          <>
            <DrawerHeader className="min-w-0">
              <DrawerTitle className="truncate pr-8" title={node.name}>
                {node.name}
              </DrawerTitle>
            </DrawerHeader>
            <div className="flex min-w-0 flex-col gap-4 px-4 pb-4">
              <div className="flex h-32 items-center justify-center rounded-card bg-muted/60">
                <Icon size={56} weight="duotone" className={fileAccentClass(getFileKind(node))} />
              </div>
              <div>
                <MetaRow
                  label={t('storage.details.type')}
                  value={
                    node.nodeType === 'folder'
                      ? t('storage.details.folder')
                      : (node.mimeType ?? node.fileExtension ?? '—')
                  }
                />
                {node.nodeType === 'file' && (
                  <MetaRow
                    label={t('storage.details.size')}
                    value={formatBytes(node.fileSizeBytes)}
                  />
                )}
                <MetaRow
                  label={t('storage.details.modified')}
                  value={new Date(node.updatedAt).toLocaleString()}
                />
                <MetaRow
                  label={t('storage.details.created')}
                  value={new Date(node.createdAt).toLocaleString()}
                />
              </div>
              <div className="flex gap-2">
                {node.nodeType === 'file' && (
                  <Button variant="cta" className="flex-1" onClick={() => onOpen(node)}>
                    <EyeIcon size={16} /> {t('storage.actions.open')}
                  </Button>
                )}
                {node.nodeType === 'file' && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('storage.actions.download')}
                    onClick={() => onDownload(node)}
                  >
                    <DownloadIcon size={16} />
                  </Button>
                )}
                {node.nodeType === 'file' && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t('storage.actions.star')}
                    onClick={() => onToggleStar(node)}
                  >
                    <StarIcon size={16} weight={starred ? 'fill' : 'regular'} />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
