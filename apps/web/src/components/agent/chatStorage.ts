import type { AgentMessage, AgentMessageRole } from './types';

export type StoredChatConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: AgentMessage[];
};

export const CHAT_STORAGE_KEY = 'oktavius.agent.conversations';
export const MAX_STORED_CHAT_CONVERSATIONS = 25;

const VALID_MESSAGE_ROLES = new Set<AgentMessageRole>([
  'user',
  'assistant',
  'tool',
  'confirmation',
  'card',
  'system',
]);

function isValidAgentMessage(value: unknown): value is AgentMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AgentMessage>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.createdAt === 'string' &&
    candidate.createdAt.length > 0 &&
    !!candidate.role &&
    VALID_MESSAGE_ROLES.has(candidate.role)
  );
}

function toStoredChatConversation(value: unknown): StoredChatConversation | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StoredChatConversation>;
  if (
    typeof candidate.id !== 'string' ||
    candidate.id.length === 0 ||
    typeof candidate.title !== 'string' ||
    candidate.title.length === 0 ||
    typeof candidate.updatedAt !== 'string' ||
    candidate.updatedAt.length === 0 ||
    !Array.isArray(candidate.messages)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    updatedAt: candidate.updatedAt,
    messages: candidate.messages.filter(isValidAgentMessage),
  };
}

export function trimChatConversations(
  conversations: StoredChatConversation[],
  maxConversations = MAX_STORED_CHAT_CONVERSATIONS,
) {
  return conversations.slice(0, maxConversations);
}

export function loadStoredChatConversations(
  storage: Storage | undefined,
): StoredChatConversation[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return trimChatConversations(
      parsed
        .map((item) => toStoredChatConversation(item))
        .filter((item): item is StoredChatConversation => item !== null),
    );
  } catch {
    return [];
  }
}

export function storeChatConversations(
  storage: Storage | undefined,
  conversations: StoredChatConversation[],
) {
  if (!storage) return;
  storage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimChatConversations(conversations)));
}
