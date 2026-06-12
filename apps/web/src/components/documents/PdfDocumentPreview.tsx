import { cn } from '@oktavius/base-ui';

import { type PdfPreviewFitMode, withPdfFitMode } from './documentPreviewTypes';
import { PREVIEW_SURFACE_CLASS } from './documentPreviewUtils';

type PdfDocumentPreviewProps = {
  sourceUrl: string;
  title: string;
  className?: string;
  fitMode?: PdfPreviewFitMode;
};

/** Browser-native PDF preview via iframe — uses PDF open parameters for fit mode. */
export function PdfDocumentPreview({
  sourceUrl,
  title,
  className,
  fitMode = 'page-width',
}: PdfDocumentPreviewProps) {
  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <iframe
        title={title}
        src={withPdfFitMode(sourceUrl, fitMode)}
        className={cn('min-h-[min(420px,60vh)] w-full flex-1 border-0', PREVIEW_SURFACE_CLASS)}
        sandbox="allow-same-origin"
      />
    </div>
  );
}
