import { Badge, Button, SectionCard } from '@oktavius/base-ui';

import { DocumentIcon, DownloadIcon } from '@/lib/icons';

import type { AgentGeneratedDocumentCardPayload } from '../types';

type AgentGeneratedDocumentCardProps = AgentGeneratedDocumentCardPayload & {
  onDownload?: (format: 'pdf' | 'docx') => void;
  onOpen?: () => void;
  className?: string;
};

export function AgentGeneratedDocumentCard({
  title,
  status,
  generationId,
  formats = ['pdf'],
  onDownload,
  onOpen,
  className,
}: AgentGeneratedDocumentCardProps) {
  const statusVariant =
    status === 'completed' ? 'success' : status === 'failed' ? 'destructive' : 'info';

  return (
    <SectionCard
      className={className}
      title={title}
      meta={`#${generationId.slice(0, 8)}`}
      actions={
        <Badge variant={statusVariant}>{status === 'generating' ? 'Generating…' : status}</Badge>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <DocumentIcon size={16} className="text-muted-foreground" />
        {formats.map((format) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            disabled={status !== 'completed'}
            onClick={() => onDownload?.(format)}
          >
            <DownloadIcon size={14} className="mr-1.5" />
            {format.toUpperCase()}
          </Button>
        ))}
        {onOpen ? (
          <Button variant="ghost" size="sm" disabled={status !== 'completed'} onClick={onOpen}>
            Open in documents
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}
