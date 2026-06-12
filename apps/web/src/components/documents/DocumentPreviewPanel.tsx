import { cn, ListRow, SplitView } from '@oktavius/base-ui';
import { useMemo } from 'react';

import { QUEUE_ITEM_SELECTED_CLASS, SplitViewQueue } from '@/components/common/SplitViewQueue';
import { DocumentIcon } from '@/lib/icons';

import type { DocumentPreviewListItem } from './documentPreviewTypes';
import { buildPreviewDocument } from './documentPreviewUtils';
import { PdfPreviewPanel } from './PdfPreviewPanel';

type DocumentPreviewPanelProps = {
  files: DocumentPreviewListItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
};

/** Split-view file queue + preview — pass real file rows from the module or demo data. */
export function DocumentPreviewPanel({
  files,
  selectedId,
  onSelect,
  className,
}: DocumentPreviewPanelProps) {
  const selected = files.find((file) => file.id === selectedId) ?? files[0] ?? null;

  const previewDocument = useMemo(
    () => (selected ? buildPreviewDocument(selected) : null),
    [selected],
  );

  if (files.length === 0) {
    return null;
  }

  return (
    <SplitView
      className={cn('min-h-0 flex-1', className)}
      persistKey="document-preview-split"
      defaultSidebarWidth={360}
      minSidebarWidth={320}
      maxSidebarWidth={640}
      sidebarScroll
      sidebar={
        <SplitViewQueue className="min-w-0">
          {files.map((file) => (
            <ListRow
              key={file.id}
              variant="queue"
              leading={<DocumentIcon size={16} className="shrink-0 text-muted-foreground" />}
              title={file.name}
              subtitle={file.subtitle}
              onClick={() => onSelect(file.id)}
              className={file.id === selected?.id ? QUEUE_ITEM_SELECTED_CLASS : undefined}
              aria-current={file.id === selected?.id ? 'true' : undefined}
            />
          ))}
        </SplitViewQueue>
      }
      contentClassName="flex min-h-0 min-w-0 flex-col overflow-hidden"
    >
      <PdfPreviewPanel
        document={previewDocument}
        embedMode
        className="min-h-0 flex-1"
        bodyClassName="min-h-0 flex-1"
      />
    </SplitView>
  );
}
