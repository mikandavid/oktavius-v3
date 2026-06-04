import type { EmailMessage, EmailThread, EmailThreadStatus } from '@/components/email/types';

export const EMAIL_THREADS_STORAGE_KEY = 'oktavius.email.threads';

const VALID_THREAD_STATUSES = new Set<EmailThreadStatus>([
  'Unread',
  'Linked',
  'Draft',
  'Failed',
  'Sent',
]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isEmailMessage(value: unknown): value is EmailMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<EmailMessage>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    (candidate.direction === 'inbound' || candidate.direction === 'outbound') &&
    typeof candidate.from === 'string' &&
    candidate.from.length > 0 &&
    isStringArray(candidate.to) &&
    (candidate.cc === undefined || isStringArray(candidate.cc)) &&
    typeof candidate.sentAt === 'string' &&
    candidate.sentAt.length > 0 &&
    typeof candidate.bodyHtml === 'string'
  );
}

function toEmailThread(value: unknown): EmailThread | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<EmailThread>;
  if (
    typeof candidate.id !== 'string' ||
    candidate.id.length === 0 ||
    typeof candidate.subject !== 'string' ||
    candidate.subject.length === 0 ||
    typeof candidate.preview !== 'string' ||
    !isStringArray(candidate.participants) ||
    typeof candidate.updatedAt !== 'string' ||
    candidate.updatedAt.length === 0 ||
    typeof candidate.account !== 'string' ||
    candidate.account.length === 0 ||
    !candidate.status ||
    !VALID_THREAD_STATUSES.has(candidate.status) ||
    !Array.isArray(candidate.messages)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    subject: candidate.subject,
    preview: candidate.preview,
    participants: candidate.participants,
    updatedAt: candidate.updatedAt,
    account: candidate.account,
    status: candidate.status,
    folderId:
      typeof candidate.folderId === 'string' && candidate.folderId.length > 0
        ? candidate.folderId
        : 'inbox',
    linkedEntity: candidate.linkedEntity,
    messages: candidate.messages.filter(isEmailMessage),
  };
}

export function loadStoredEmailThreads(
  storage: Storage | undefined,
  fallbackThreads: EmailThread[],
): EmailThread[] {
  if (!storage) return fallbackThreads;

  try {
    const raw = storage.getItem(EMAIL_THREADS_STORAGE_KEY);
    if (!raw) return fallbackThreads;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallbackThreads;
    const threads = parsed
      .map((item) => toEmailThread(item))
      .filter((item): item is EmailThread => item !== null);
    return threads.length > 0 ? threads : fallbackThreads;
  } catch {
    return fallbackThreads;
  }
}

export function storeEmailThreads(storage: Storage | undefined, threads: EmailThread[]) {
  if (!storage) return;
  storage.setItem(EMAIL_THREADS_STORAGE_KEY, JSON.stringify(threads));
}
