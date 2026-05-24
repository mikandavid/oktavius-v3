import { Button, ListRow, ScrollArea, SectionCard, SplitView, cn } from '@oktavius/base-ui';

import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { DocumentIcon, DownloadIcon } from '@/lib/icons';

const DEMO_FILES = [
  { id: 'f1', name: 'death_certificate.pdf', size: '248 KB', updated: '2024-04-02' },
  { id: 'f2', name: 'contract_signed.docx', size: '112 KB', updated: '2024-04-10' },
  { id: 'f3', name: 'invoice_march.xlsx', size: '64 KB', updated: '2024-03-28' },
] as const;

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

  return (
    <SplitView
      className={cn('min-h-[280px] w-full rounded-card bg-card', className)}
      sidebar={
        <ScrollArea className="h-full max-h-[320px]">
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
      <SectionCard
        title={selected.name}
        meta="Preview"
        actions={
          <Button variant="outline" size="sm">
            <DownloadIcon size={14} className="mr-1.5" />
            Download
          </Button>
        }
        className="h-full border-0 shadow-none"
      >
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-control border border-dashed border-border/60 bg-muted/15 px-6 text-center">
          <DocumentIcon size={32} className="text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">Document preview</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Static placeholder for PDF/DOCX viewer integration. List + preview split matches entity
            document tabs.
          </p>
        </div>
      </SectionCard>
    </SplitView>
  );
}
