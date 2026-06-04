import { AttachmentList, cn } from '@oktavius/base-ui';

import { PaperclipIcon } from '@/lib/icons';

import type { EmailAttachment } from './types';

type EmailMessageAttachmentsProps = {
  attachments: EmailAttachment[];
  className?: string;
};

export function EmailMessageAttachments({ attachments, className }: EmailMessageAttachmentsProps) {
  if (!attachments.length) return null;
  const total = attachments.length;
  return (
    <div className={cn('space-y-1 border-t border-border/40 pt-2', className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <PaperclipIcon size={12} />
        {total} attachment{total === 1 ? '' : 's'}
      </p>
      <AttachmentList
        attachments={attachments.map((a) => ({ id: a.id, name: a.name, size: a.size }))}
      />
    </div>
  );
}
