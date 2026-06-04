import { Avatar, Button, Popover, PopoverContent, PopoverTrigger, cn } from '@oktavius/base-ui';

import { ChevronDownIcon } from '@/lib/icons';

import type { EmailMessage } from './types';

type EmailMessageHeaderProps = {
  message: EmailMessage;
  className?: string;
};

function senderDisplay(from: string): string {
  const trimmed = from.trim();
  if (!trimmed) return 'Unknown sender';
  return trimmed;
}

function recipientSummary(message: EmailMessage): string {
  const to = message.to.filter(Boolean);
  const cc = message.cc?.filter(Boolean) ?? [];
  const total = to.length + cc.length;
  if (total === 0) return 'No recipients';
  if (to.length === 1 && cc.length === 0) return `To ${to[0]}`;
  return `To ${to[0]}${total > 1 ? ` and ${total - 1} other${total - 1 === 1 ? '' : 's'}` : ''}`;
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value?.trim()) return null;
  return (
    <div className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-0.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-foreground">{value}</span>
    </div>
  );
}

export function EmailMessageHeader({ message, className }: EmailMessageHeaderProps) {
  const outbound = message.direction === 'outbound';
  const sender = senderDisplay(message.from);
  const summary = recipientSummary(message);
  const hasDetails = message.to.length > 0 || (message.cc?.length ?? 0) > 0;

  return (
    <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
      <Avatar label={sender} tone={outbound ? 'accent' : 'muted'} size="xs" />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">{sender}</p>
          <time className="shrink-0 text-xs text-muted-foreground">{message.sentAt}</time>
        </div>

        {hasDetails ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-0.5 h-auto min-h-0 gap-1 px-0 py-0 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                <span className="truncate">{summary}</span>
                <ChevronDownIcon size={12} className="shrink-0 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] space-y-2 p-3">
              <DetailRow label="From" value={message.from} />
              <DetailRow label="To" value={message.to.join(', ')} />
              <DetailRow label="Cc" value={message.cc?.join(', ')} />
              <DetailRow label="Date" value={message.sentAt} />
            </PopoverContent>
          </Popover>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{summary}</p>
        )}
      </div>
    </div>
  );
}
