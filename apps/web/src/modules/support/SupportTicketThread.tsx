import { Button, Textarea } from '@oktavius/base-ui';
import { useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { SupportTicket } from './data/types';
import { useSupportComments, useSupportMutations } from './data/useSupportData';

interface SupportTicketThreadProps {
  ticket: SupportTicket;
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
}

export function SupportTicketThread({ ticket }: SupportTicketThreadProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');

  const commentsQuery = useSupportComments(ticket.id);
  const { addComment } = useSupportMutations();

  const initialEntry: TimelineEntry = {
    author: ticket.userName ?? ticket.userEmail,
    date: ticket.createdAt,
    body: ticket.message,
    label: t('support.initialRequest'),
  };

  const commentEntries: TimelineEntry[] = (commentsQuery.data ?? []).map((comment) => ({
    author: comment.userName ?? comment.userEmail ?? t('support.supportTeam'),
    date: comment.createdAt,
    body: comment.message,
    label: t('support.commentEntry'),
  }));

  const timeline: TimelineEntry[] = [initialEntry, ...commentEntries];

  async function handleSend() {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ ticketId: ticket.id, message: trimmed });
      setMessage('');
      appToast.success(t('support.replySent'));
    } catch {
      appToast.error(t('support.replyFailed'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {timeline.map((entry, idx) => (
        <div key={idx} className="rounded-card bg-card p-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{entry.author}</span>
              <span className="text-xs text-muted-foreground">{entry.label}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateTime(entry.date)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{entry.body}</p>
        </div>
      ))}

      {/* Reply composer */}
      <div className="flex flex-col gap-2 rounded-card border border-border bg-card p-3">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('support.replyPlaceholder')}
          rows={3}
          className="resize-none"
        />
        <div className="flex justify-end">
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
