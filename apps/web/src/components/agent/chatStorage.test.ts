import { describe, expect, it } from 'vitest';

import {
  CHAT_STORAGE_KEY,
  MAX_STORED_CHAT_CONVERSATIONS,
  loadStoredChatConversations,
  storeChatConversations,
  trimChatConversations,
  type StoredChatConversation,
} from './chatStorage';

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

const validConversation: StoredChatConversation = {
  id: 'chat_1',
  title: 'Client follow-up',
  updatedAt: '2026-01-01T10:00:00.000Z',
  messages: [
    {
      id: 'message_1',
      role: 'user',
      content: 'Summarize this account.',
      createdAt: '2026-01-01T10:00:00.000Z',
    },
  ],
};

describe('chat storage helpers', () => {
  it('loads an empty list when storage is empty or invalid', () => {
    expect(loadStoredChatConversations(createStorage())).toEqual([]);
    expect(loadStoredChatConversations(createStorage({ [CHAT_STORAGE_KEY]: 'not-json' }))).toEqual(
      [],
    );
    expect(loadStoredChatConversations(createStorage({ [CHAT_STORAGE_KEY]: '{}' }))).toEqual([]);
  });

  it('loads only valid conversations and messages', () => {
    const storage = createStorage({
      [CHAT_STORAGE_KEY]: JSON.stringify([
        validConversation,
        { id: '', title: 'Invalid id', updatedAt: '2026-01-01T10:00:00.000Z', messages: [] },
        {
          id: 'chat_2',
          title: 'Invalid message is dropped',
          updatedAt: '2026-01-01T10:00:00.000Z',
          messages: [{ id: 'message_2', role: 'unknown', createdAt: '2026-01-01T10:00:00.000Z' }],
        },
      ]),
    });

    expect(loadStoredChatConversations(storage)).toEqual([
      validConversation,
      {
        id: 'chat_2',
        title: 'Invalid message is dropped',
        updatedAt: '2026-01-01T10:00:00.000Z',
        messages: [],
      },
    ]);
  });

  it('stores conversations under the agent chat key', () => {
    const storage = createStorage();

    storeChatConversations(storage, [validConversation]);

    expect(loadStoredChatConversations(storage)).toEqual([validConversation]);
  });

  it('trims conversations to the most recent storage budget', () => {
    const conversations = Array.from({ length: MAX_STORED_CHAT_CONVERSATIONS + 2 }, (_, index) => ({
      ...validConversation,
      id: `chat_${index}`,
    }));

    const trimmed = trimChatConversations(conversations);

    expect(trimmed).toHaveLength(MAX_STORED_CHAT_CONVERSATIONS);
    expect(trimmed[0]?.id).toBe('chat_0');
    expect(trimmed.at(-1)?.id).toBe(`chat_${MAX_STORED_CHAT_CONVERSATIONS - 1}`);
  });
});
