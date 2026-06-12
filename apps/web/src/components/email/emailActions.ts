import type { EmailDraft, EmailMessage, EmailThread } from './types';

export type ComposerMode = 'closed' | 'reply' | 'replyAll' | 'forward' | 'new';

function prefixSubject(prefix: 'Re' | 'Fwd', subject: string): string {
  const stripped = subject.replace(/^(re|fwd):\s*/i, '').trim();
  return `${prefix}: ${stripped}`;
}

function lastInbound(thread: EmailThread): EmailMessage | undefined {
  for (let i = thread.messages.length - 1; i >= 0; i -= 1) {
    const message = thread.messages[i];
    if (message?.direction === 'inbound') return message;
  }
  return thread.messages.at(-1);
}

function quoteBlock(message: EmailMessage): string {
  const date = message.sentAt;
  return [
    '<p></p>',
    '<p></p>',
    `<blockquote style="margin:0 0 0 0.5rem;padding-left:0.75rem;border-left:2px solid #d4d4d8;color:#71717a;">`,
    `<p><em>On ${date}, ${message.from} wrote:</em></p>`,
    message.bodyHtml,
    '</blockquote>',
  ].join('');
}

export function buildReplyDraft(thread: EmailThread, replyAll = false): EmailDraft {
  const last = lastInbound(thread);
  if (!last) {
    return {
      to: [],
      cc: [],
      subject: prefixSubject('Re', thread.subject),
      bodyHtml: '<p></p>',
      attachments: [],
    };
  }
  const to = [last.from];
  const cc = replyAll
    ? Array.from(new Set([...last.to, ...(last.cc ?? [])])).filter(
        (addr) => addr !== last.from && addr !== thread.account,
      )
    : [];
  return {
    to,
    cc,
    subject: prefixSubject('Re', thread.subject),
    bodyHtml: quoteBlock(last),
    attachments: [],
  };
}

export function buildForwardDraft(thread: EmailThread): EmailDraft {
  const last = thread.messages.at(-1);
  return {
    to: [],
    cc: [],
    subject: prefixSubject('Fwd', thread.subject),
    bodyHtml: last ? quoteBlock(last) : '<p></p>',
    attachments: [],
  };
}

type QueueEmailSendOptions = {
  threads: EmailThread[];
  threadId: string;
  draft: EmailDraft;
  sentAt: string;
};

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateDraft(draft: EmailDraft) {
  if (draft.to.length === 0) {
    throw new Error('Add at least one recipient before sending.');
  }
  if (!draft.subject.trim()) {
    throw new Error('Add a subject before sending.');
  }
  if (!stripHtml(draft.bodyHtml)) {
    throw new Error('Write a message before sending.');
  }
}

export function queueEmailSend({ threads, threadId, draft, sentAt }: QueueEmailSendOptions) {
  validateDraft(draft);
  const thread = threads.find((item) => item.id === threadId);
  if (!thread) {
    throw new Error('Email thread not found.');
  }

  const message: EmailMessage = {
    id: `msg_${Date.now()}`,
    direction: 'outbound',
    from: thread.account,
    to: draft.to,
    cc: draft.cc.length > 0 ? draft.cc : undefined,
    sentAt,
    bodyHtml: draft.bodyHtml,
  };
  const preview = stripHtml(draft.bodyHtml);
  const updatedThread: EmailThread = {
    ...thread,
    subject: draft.subject.trim(),
    preview,
    status: 'Sent',
    updatedAt: sentAt,
    participants: Array.from(new Set([...thread.participants, ...draft.to])),
    messages: [...thread.messages, message],
  };
  const nextThreads = threads.map((item) => (item.id === threadId ? updatedThread : item));

  return {
    threads: nextThreads,
    thread: updatedThread,
    message,
  };
}
