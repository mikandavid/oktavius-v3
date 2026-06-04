import { cn } from '@oktavius/base-ui';

import { CloseIcon, DocumentIcon, PaperclipIcon } from '@/lib/icons';

type AgentFileAttachmentChipProps = {
  fileName: string;
  onRemove?: () => void;
  className?: string;
};

/** Compact attachment chip for the chat composer. */
export function AgentFileAttachmentChip({
  fileName,
  onRemove,
  className,
}: AgentFileAttachmentChipProps) {
  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <div
      className={cn(
        'group inline-flex max-w-[180px] items-center gap-1.5 rounded-control bg-muted/40 py-0.5 pl-2 pr-1 text-xs text-foreground/80 transition-colors hover:bg-muted/60',
        className,
      )}
    >
      {isPdf ? (
        <DocumentIcon size={12} className="shrink-0 text-muted-foreground" />
      ) : (
        <PaperclipIcon size={12} className="shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{fileName}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-control p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground"
          aria-label={`Remove ${fileName}`}
        >
          <CloseIcon size={12} />
        </button>
      ) : null}
    </div>
  );
}
