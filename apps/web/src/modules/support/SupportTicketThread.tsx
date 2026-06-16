import { Button, Switch, Textarea } from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { LockIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import type { SupportTicket } from './data/types';
import { useSupportComments, useSupportMutations } from './data/useSupportData';

interface SupportTicketThreadProps {
  ticket: SupportTicket;
  admin?: boolean;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

interface TimelineEntry {
  author: string;
  date: string;
  body: string;
  label: string;
  isInternal: boolean;
}

export function SupportTicketThread({ ticket, admin = false }: SupportTicketThreadProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [internal, setInternal] = useState(false);

  const commentsQuery = useSupportComments(ticket.id);
  const { addComment } = useSupportMutations();

  const initialEntry: TimelineEntry = {
    author: ticket.userName ?? ticket.userEmail,
    date: ticket.createdAt,
    body: ticket.message,
    label: t('support.initialRequest'),
    isInternal: false,
  };

  const commentEntries: TimelineEntry[] = (commentsQuery.data ?? [])
    .filter((comment) => admin || !comment.isInternal)
    .map((comment) => ({
      author: comment.userName ?? comment.userEmail ?? t('support.supportTeam'),
      date: comment.createdAt,
      body: comment.message,
      label: t('support.commentEntry'),
      isInternal: comment.isInternal,
    }));

  const timeline: TimelineEntry[] = [initialEntry, ...commentEntries];

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, message: trimmed, isInternal: internal });
      setMessage('');
      setInternal(false);
      appToast.success(t('support.replySent'));
    } catch {
      appToast.error(t('support.replyFailed'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {timeline.map((entry, idx) => (
        <div
          key={idx}
          className={`rounded-card p-3 ${entry.isInternal ? 'bg-warning/10' : 'bg-card'}`}
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{entry.author}</span>
              <span className="text-xs text-muted-foreground">{entry.label}</span>
              {entry.isInternal && (
                <span className="inline-flex items-center gap-1 rounded-control bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
                  <LockIcon className="h-3 w-3" aria-hidden="true" />
                  {t('support.internalNoteBadge')}
                </span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(entry.date)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{entry.body}</p>
        </div>
      ))}

      {/* Reply composer */}
      <div className="flex flex-col gap-2 rounded-card bg-card p-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            internal ? t('support.internalNotePlaceholder') : t('support.replyPlaceholder')
          }
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-2">
          {admin ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={internal}
                onCheckedChange={setInternal}
                aria-label={t('support.internalNoteToggle')}
              />
              {t('support.internalNoteToggle')}
            </label>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={handleSend}
            disabled={addComment.isPending || !message.trim()}
          >
            {t('support.sendReply')}
          </Button>
        </div>
      </div>
    </div>
  );
}
