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
    // Surface lives on the wrapper with `overflow-hidden` so the rounded corners actually
    // clip the iframe — a border-radius on the iframe itself leaves square content corners.
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
        PREVIEW_SURFACE_CLASS,
        className,
      )}
    >
      <iframe
        title={title}
        src={withPdfFitMode(sourceUrl, fitMode)}
        className="min-h-[min(420px,60vh)] w-full flex-1 border-0 bg-transparent"
        // The browser's built-in PDF viewer is a scripted plugin — without `allow-scripts`
        // the frame renders blank. `allow-popups`/`allow-downloads` enable its toolbar actions.
        sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
      />
    </div>
  );
}
