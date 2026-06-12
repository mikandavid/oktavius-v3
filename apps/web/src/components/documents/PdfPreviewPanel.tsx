import { Button, cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { DocumentPreview } from '@/components/documents/DocumentPreview';
import type {
  PdfPreviewFitMode,
  PreviewDocument,
} from '@/components/documents/documentPreviewTypes';
import { downloadPreviewDocument } from '@/components/documents/documentPreviewUtils';
import { DocumentIcon, DownloadIcon } from '@/lib/icons';

export interface PdfPreviewPanelProps {
  document: PreviewDocument | null;
  bodyClassName?: string;
  embedMode?: boolean;
  className?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  pdfFitMode?: PdfPreviewFitMode;
}

/** File toolbar + DocumentPreview — use on detail tabs, storage side panels, and split views. */
export function PdfPreviewPanel({
  document,
  bodyClassName,
  embedMode = false,
  className,
  isLoading = false,
  errorMessage = null,
  pdfFitMode,
}: PdfPreviewPanelProps) {
  const resolvedBodyClassName = cn(
    embedMode ? 'flex min-h-0 flex-1 flex-col' : 'min-h-[240px]',
    bodyClassName,
  );

  const frame = (children: ReactNode) =>
    embedMode ? (
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>{children}</div>
    ) : (
      <div className={cn('w-full rounded-card bg-card', className)}>{children}</div>
    );

  const canDownload = Boolean(document?.sourceUrl || document?.downloadUrl || document?.file);

  const toolbar =
    document && canDownload ? (
      <div
        className={cn(
          'flex shrink-0 items-center justify-between gap-2 border-b border-border/50',
          embedMode
            ? 'px-3 py-2'
            : 'flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <DocumentIcon size={14} className="shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{document.name}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => downloadPreviewDocument(document)}
        >
          <DownloadIcon size={14} className="mr-1.5" />
          Download
        </Button>
      </div>
    ) : null;

  return frame(
    <>
      {toolbar}
      <DocumentPreview
        document={document}
        bodyClassName={resolvedBodyClassName}
        isLoading={isLoading}
        errorMessage={errorMessage}
        pdfFitMode={pdfFitMode}
      />
    </>,
  );
}
