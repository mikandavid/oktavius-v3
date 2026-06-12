import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';

import {
  ArchiveIcon,
  DeleteIcon,
  EmailForwardIcon,
  FlagIcon,
  MarkUnreadIcon,
  MoreIcon,
  MoveToFolderIcon,
  PrintIcon,
  RefreshIcon,
  ReplyAllIcon,
  ReplyIcon,
} from '@/lib/icons';

import type { ComposerMode } from './emailActions';
import { EmailMessageAttachments } from './EmailMessageAttachments';
import { EmailMessageBodyHtml } from './EmailMessageBodyHtml';
import { EmailMessageHeader } from './EmailMessageHeader';
import { LinkedEntityPill } from './LinkedEntityPill';
import type { EmailMessage, EmailThread } from './types';

type EmailThreadDetailProps = {
  thread: EmailThread;
  resolveHref?: (href: string) => string;
  onOpenComposer: (mode: Exclude<ComposerMode, 'closed'>) => void;
  onArchive?: (threadIds: string[]) => void;
  onDelete?: (threadIds: string[]) => void;
  onMarkUnread?: (threadIds: string[]) => void;
  onFlag?: (threadIds: string[]) => void;
};

function MessageRow({ message, isFirst }: { message: EmailMessage; isFirst: boolean }) {
  return (
    <article className={cn('min-w-0 py-4', !isFirst && 'border-t border-border/40')}>
      <EmailMessageHeader message={message} />
      <div className="mt-2 pl-7">
        <EmailMessageBodyHtml bodyHtml={message.bodyHtml} />
        {message.attachments?.length ? (
          <EmailMessageAttachments attachments={message.attachments} className="mt-2 pt-2" />
        ) : null}
      </div>
    </article>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function EmailThreadDetail({
  thread,
  resolveHref = (href) => href,
  onOpenComposer,
  onArchive,
  onDelete,
  onMarkUnread,
  onFlag,
}: EmailThreadDetailProps) {
  const linkedEntityHref = thread.linkedEntity ? resolveHref(thread.linkedEntity.href) : null;
  const threadIds = [thread.id];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/50 px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
              {thread.subject}
            </h2>
            {thread.linkedEntity ? (
              <LinkedEntityPill
                label={thread.linkedEntity.label}
                href={linkedEntityHref ?? thread.linkedEntity.href}
              />
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ToolbarIconButton label="Reply" onClick={() => onOpenComposer('reply')}>
              <ReplyIcon size={14} />
            </ToolbarIconButton>
            <ToolbarIconButton label="Reply all" onClick={() => onOpenComposer('replyAll')}>
              <ReplyAllIcon size={14} />
            </ToolbarIconButton>
            <ToolbarIconButton label="Forward" onClick={() => onOpenComposer('forward')}>
              <EmailForwardIcon size={14} />
            </ToolbarIconButton>
            <div className="mx-1 h-4 w-px bg-border/60" aria-hidden />
            <ToolbarIconButton label="Archive" onClick={() => onArchive?.(threadIds)}>
              <ArchiveIcon size={14} />
            </ToolbarIconButton>
            <ToolbarIconButton label="Sync">
              <RefreshIcon size={14} />
            </ToolbarIconButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="More actions"
                  title="More actions"
                >
                  <MoreIcon size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onMarkUnread?.(threadIds)}>
                  <MarkUnreadIcon size={14} />
                  Mark as unread
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onFlag?.(threadIds)}>
                  <FlagIcon size={14} />
                  Flag
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => undefined}>
                  <MoveToFolderIcon size={14} />
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.print()}>
                  <PrintIcon size={14} />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => onDelete?.(threadIds)}
                  className="text-destructive focus:text-destructive"
                >
                  <DeleteIcon size={14} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 [scrollbar-gutter:stable]">
        <div className="mx-auto max-w-3xl">
          {thread.messages.map((message, index) => (
            <MessageRow key={message.id} message={message} isFirst={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
