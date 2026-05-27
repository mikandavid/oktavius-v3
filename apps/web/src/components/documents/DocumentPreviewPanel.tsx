import { useMemo } from 'react';

import { ListRow, ScrollArea, SplitView, cn } from '@oktavius/base-ui';

import { PdfPreviewPanel } from '@/components/documents/PdfPreviewPanel';
import type { PreviewDocument } from '@/components/documents/documentPreviewTypes';
import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { DocumentIcon } from '@/lib/icons';

const DEMO_SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const DEMO_SAMPLE_CSV = `Product,Quantity,Amount
License,12,14400
Support hours,48,7200
Implementation,1,8500`;

const DEMO_FILES: Array<
  PreviewDocument & { id: string; size: string; updated: string; demoText?: string }
> = [
  {
    id: 'f1',
    name: 'death_certificate.pdf',
    size: '248 KB',
    updated: '2024-04-02',
    mimeType: 'application/pdf',
    sourceUrl: DEMO_SAMPLE_PDF,
    downloadUrl: DEMO_SAMPLE_PDF,
  },
  {
    id: 'f2',
    name: 'contract_signed.docx',
    size: '112 KB',
    updated: '2024-04-10',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileExtension: 'docx',
  },
  {
    id: 'f3',
    name: 'invoice_march.csv',
    size: '2 KB',
    updated: '2024-03-28',
    mimeType: 'text/csv',
    demoText: DEMO_SAMPLE_CSV,
  },
];

const DEMO_CSV_FILE = (() => {
  const blob = new Blob([DEMO_SAMPLE_CSV], { type: 'text/csv' });
  return new File([blob], 'invoice_march.csv', { type: blob.type });
})();

type DocumentPreviewPanelProps = {
  className?: string;
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export function DocumentPreviewPanel({
  className,
  selectedId = DEMO_FILES[0].id,
  onSelect,
}: DocumentPreviewPanelProps) {
  const selected = DEMO_FILES.find((file) => file.id === selectedId) ?? DEMO_FILES[0];

  const previewDocument = useMemo((): PreviewDocument | null => {
    if (selected.demoText) {
      return {
        name: selected.name,
        mimeType: selected.mimeType,
        fileExtension: selected.name.split('.').pop(),
        file: DEMO_CSV_FILE,
      };
    }

    return {
      name: selected.name,
      mimeType: selected.mimeType,
      fileExtension: selected.fileExtension ?? selected.name.split('.').pop(),
      sourceUrl: selected.sourceUrl ?? null,
      downloadUrl: selected.downloadUrl ?? selected.sourceUrl ?? null,
    };
  }, [selected]);

  return (
    <SplitView
      className={cn('min-h-[320px] w-full rounded-card bg-card', className)}
      sidebar={
        <ScrollArea className="h-full max-h-[360px]">
          <SplitViewQueue>
            {DEMO_FILES.map((file) => (
              <ListRow
                key={file.id}
                variant="queue"
                leading={<DocumentIcon size={16} className="text-muted-foreground" />}
                title={file.name}
                subtitle={`${file.size} · ${file.updated}`}
                onClick={() => onSelect?.(file.id)}
                className={file.id === selected.id ? QUEUE_ITEM_SELECTED_CLASS : undefined}
                aria-current={file.id === selected.id ? 'true' : undefined}
              />
            ))}
          </SplitViewQueue>
        </ScrollArea>
      }
      sidebarWidth="w-[min(100%,16rem)]"
    >
      <PdfPreviewPanel document={previewDocument} embedMode bodyClassName="px-1 pb-1 pt-2" />
    </SplitView>
  );
}

export { DEMO_FILES as DOCUMENT_PREVIEW_DEMO_FILES };
