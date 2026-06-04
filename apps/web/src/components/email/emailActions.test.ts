import { describe, expect, it } from 'vitest';

import { queueEmailSend } from './emailActions';
import type { EmailDraft, EmailThread } from './types';

const thread: EmailThread = {
  id: 'eml_1',
  subject: 'Existing subject',
  preview: 'Can you confirm?',
  participants: ['Eva Bruckner'],
  updatedAt: '10:42',
  account: 'markus@example.test',
  status: 'Unread',
  folderId: 'inbox',
  messages: [
    {
      id: 'msg_1',
      direction: 'inbound',
      from: 'eva@example.test',
      to: ['markus@example.test'],
      sentAt: 'Today, 10:42',
      bodyHtml: '<p>Can you confirm?</p>',
    },
  ],
};

const draft: EmailDraft = {
  to: ['eva@example.test'],
  cc: ['legal@example.test'],
  subject: 'Re: Existing subject',
  bodyHtml: '<p>Confirmed for Friday.</p>',
};

describe('email actions', () => {
  it('appends an outbound message and marks the thread sent', () => {
    const result = queueEmailSend({
      threads: [thread],
      threadId: thread.id,
      draft,
      sentAt: 'Today, 11:02',
    });

    expect(result.thread.messages).toHaveLength(2);
    expect(result.thread.messages.at(-1)).toMatchObject({
      direction: 'outbound',
      from: 'markus@example.test',
      to: ['eva@example.test'],
      cc: ['legal@example.test'],
      sentAt: 'Today, 11:02',
      bodyHtml: '<p>Confirmed for Friday.</p>',
    });
    expect(result.thread).toMatchObject({
      subject: 'Re: Existing subject',
      preview: 'Confirmed for Friday.',
      status: 'Sent',
      updatedAt: 'Today, 11:02',
    });
  });

  it('rejects incomplete drafts before changing threads', () => {
    expect(() =>
      queueEmailSend({
        threads: [thread],
        threadId: thread.id,
        draft: { ...draft, to: [], bodyHtml: '<p> </p>' },
        sentAt: 'Today, 11:02',
      }),
    ).toThrow('Add at least one recipient before sending.');
  });
});
