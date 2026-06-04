import { describe, expect, it } from 'vitest';

import {
  EMAIL_THREADS_STORAGE_KEY,
  loadStoredEmailThreads,
  storeEmailThreads,
} from './emailStorage';
import type { EmailThread } from '@/components/email';

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const fallbackThreads: EmailThread[] = [
  {
    id: 'eml_fallback',
    subject: 'Fallback',
    preview: 'Seed thread',
    participants: ['Eva'],
    updatedAt: '10:42',
    account: 'markus@example.test',
    status: 'Unread',
    folderId: 'inbox',
    messages: [],
  },
];

const storedThread: EmailThread = {
  id: 'eml_1',
  subject: 'Stored thread',
  preview: 'Stored preview',
  participants: ['Eva'],
  updatedAt: '11:02',
  account: 'markus@example.test',
  status: 'Sent',
  folderId: 'sent',
  messages: [
    {
      id: 'msg_1',
      direction: 'outbound',
      from: 'markus@example.test',
      to: ['eva@example.test'],
      sentAt: '11:02',
      bodyHtml: '<p>Hello</p>',
    },
  ],
};

describe('email storage helpers', () => {
  it('loads fallback threads when storage is empty or invalid', () => {
    expect(loadStoredEmailThreads(createStorage(), fallbackThreads)).toEqual(fallbackThreads);
    expect(
      loadStoredEmailThreads(
        createStorage({ [EMAIL_THREADS_STORAGE_KEY]: 'not-json' }),
        fallbackThreads,
      ),
    ).toEqual(fallbackThreads);
  });

  it('loads only valid stored threads and messages', () => {
    const storage = createStorage({
      [EMAIL_THREADS_STORAGE_KEY]: JSON.stringify([
        storedThread,
        { ...storedThread, id: '', subject: 'Invalid id' },
        {
          ...storedThread,
          id: 'eml_2',
          messages: [{ id: 'msg_2', direction: 'sideways', sentAt: '11:03' }],
        },
      ]),
    });

    expect(loadStoredEmailThreads(storage, fallbackThreads)).toEqual([
      storedThread,
      { ...storedThread, id: 'eml_2', messages: [] },
    ]);
  });

  it('stores threads under the email thread key', () => {
    const storage = createStorage();

    storeEmailThreads(storage, [storedThread]);

    expect(loadStoredEmailThreads(storage, fallbackThreads)).toEqual([storedThread]);
  });
});
