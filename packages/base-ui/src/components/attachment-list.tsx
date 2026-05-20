import type { ReactNode } from 'react';

import { ArrowSquareOut, File, FileDoc, FilePdf, Image, Trash, X } from '@phosphor-icons/react';

import { cn } from '../lib/utils';
import { Button } from './button';
import { InlineEmptyState } from './inline-empty-state';

export interface Attachment {
  id: string;
  name: string;
  size?: number;
  url?: string;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  onOpen?: (attachment: Attachment) => void;
  isDeleting?: string;
  readOnly?: boolean;
  className?: string;
}

function fileIcon(name: string, mimeType?: string): ReactNode {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext))
    return <Image className="h-4 w-4" />;
  if (ext === 'pdf' || mimeType === 'application/pdf')
    return <FilePdf className="h-4 w-4" />;
  if (['doc', 'docx'].includes(ext))
    return <FileDoc className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({
  attachments,
  onDelete,
  onOpen,
  isDeleting,
  readOnly = false,
  className,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return <InlineEmptyState text="No attachments." />;
  }

  return (
    <ul className={cn('divide-y divide-border/50', className)}>
      {attachments.map((att) => (
        <li
          key={att.id}
          className="flex items-center gap-3 py-2"
        >
          <div className="shrink-0 text-muted-foreground">{fileIcon(att.name, att.mimeType)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{att.name}</p>
            <p className="text-xs text-muted-foreground">
              {att.size ? formatBytes(att.size) : null}
              {att.size && att.uploadedAt ? ' · ' : null}
              {att.uploadedAt ?? null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {att.url && onOpen ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => onOpen(att)}
                aria-label="Open attachment"
              >
                <ArrowSquareOut className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            {!readOnly && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                disabled={isDeleting === att.id}
                onClick={() => onDelete(att.id)}
                aria-label="Delete attachment"
              >
                {isDeleting === att.id ? (
                  <X className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash className="h-3.5 w-3.5" />
                )}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
