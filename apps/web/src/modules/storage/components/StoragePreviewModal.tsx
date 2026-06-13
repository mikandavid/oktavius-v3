import { Button, Dialog, DialogContent, DialogTitle } from '@oktavius/base-ui';
import { useMemo } from 'react';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type { PreviewDocument } from '@/components/documents/documentPreviewTypes';
import { useTranslation } from '@/core/i18n';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '@/lib/icons';

import type { StorageNode } from '../data/types';
import { useFilePreviewUrl } from '../data/useStorageData';

export function StoragePreviewModal({
  nodes,
  currentId,
  onNavigate,
  onClose,
  onDownload,
}: {
  nodes: StorageNode[];
  currentId: string | null;
  onNavigate: (id: string) => void;
  onClose: () => void;
  onDownload: (node: StorageNode) => void;
}) {
  const { t } = useTranslation();
  const files = useMemo(() => nodes.filter((node) => node.nodeType === 'file'), [nodes]);
  const index = files.findIndex((node) => node.id === currentId);
  const node = index >= 0 ? files[index] : null;
  const previewQuery = useFilePreviewUrl(node?.id ?? null);

  const document: PreviewDocument | null = node
    ? {
        name: node.name,
        mimeType: node.mimeType,
        fileExtension: node.fileExtension,
        sourceUrl: previewQuery.data ?? null,
      }
    : null;

  return (
    <Dialog open={Boolean(node)} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <DialogContent className="flex h-[85vh] w-[85vw] max-w-[1100px] flex-col gap-3 p-4">
        {node && (
          <>
            <div className="flex items-center gap-2">
              <DialogTitle className="min-w-0 flex-1 truncate text-sm">{node.name}</DialogTitle>
              <Button
                variant="outline"
                size="icon"
                aria-label={t('storage.actions.download')}
                onClick={() => onDownload(node)}
              >
                <DownloadIcon size={16} />
              </Button>
            </div>
            <div className="relative min-h-0 flex-1">
              <DocumentPreview
                document={document}
                isLoading={previewQuery.isLoading}
                errorMessage={previewQuery.isError ? t('storage.errors.load') : null}
                className="h-full"
              />
              {index > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => onNavigate(files[index - 1]!.id)}
                >
                  <ChevronLeftIcon size={18} />
                </Button>
              )}
              {index < files.length - 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => onNavigate(files[index + 1]!.id)}
                >
                  <ChevronRightIcon size={18} />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
