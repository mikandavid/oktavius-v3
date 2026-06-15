import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type {
  CreateTicketInput,
  ListTicketsParams,
  SupportAttachment,
  SupportAttachmentNodeType,
  SupportAttachmentUploadStatus,
  SupportCategory,
  SupportComment,
  SupportPriority,
  SupportSource,
  SupportStats,
  SupportStatus,
  SupportTicket,
  TicketListResult,
} from './types';

export type SupportClientOptions = { baseUrl?: string };

const CATEGORIES: readonly SupportCategory[] = ['bug', 'feature_request', 'other'];
const STATUSES: readonly SupportStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: readonly SupportPriority[] = ['low', 'normal', 'high', 'urgent'];
const SOURCES: readonly SupportSource[] = ['web', 'agent', 'email'];
const ATTACHMENT_NODE_TYPES: readonly SupportAttachmentNodeType[] = ['folder', 'file'];
const ATTACHMENT_UPLOAD_STATUSES: readonly SupportAttachmentUploadStatus[] = [
  'pending',
  'uploading',
  'ready',
  'failed',
];

function readNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeTicket(row: unknown): SupportTicket {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    orgName: readStringOrNull(v.org_name ?? v.orgName),
    userId: readString(v.user_id ?? v.userId),
    userEmail: readString(v.user_email ?? v.userEmail),
    userName: readStringOrNull(v.user_name ?? v.userName),
    subject: readString(v.subject),
    message: readString(v.message),
    category: oneOf(CATEGORIES, v.category, 'other'),
    status: oneOf(STATUSES, v.status, 'open'),
    priority: oneOf(PRIORITIES, v.priority, 'normal'),
    tags: Array.isArray(v.tags) ? v.tags.filter((t): t is string => typeof t === 'string') : [],
    source: oneOf(SOURCES, v.source, 'web'),
    resolutionMessage: readStringOrNull(v.resolution_message ?? v.resolutionMessage),
    resolvedAt: readStringOrNull(v.resolved_at ?? v.resolvedAt),
    resolvedBy: readStringOrNull(v.resolved_by ?? v.resolvedBy),
    currentPageUrl: readStringOrNull(v.current_page_url ?? v.currentPageUrl),
    agentConversationId: readStringOrNull(v.agent_conversation_id ?? v.agentConversationId),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function normalizeComment(row: unknown): SupportComment {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    ticketId: readString(v.ticket_id ?? v.ticketId),
    userId: readString(v.user_id ?? v.userId),
    userName: readStringOrNull(v.user_name ?? v.userName),
    userEmail: readStringOrNull(v.user_email ?? v.userEmail),
    message: readString(v.message),
    isInternal: Boolean(v.is_internal ?? v.isInternal),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function normalizeAttachment(row: unknown): SupportAttachment {
  const v = readRecord(row);
  const nodeType = ATTACHMENT_NODE_TYPES.includes(
    (v.node_type ?? v.nodeType) as SupportAttachmentNodeType,
  )
    ? ((v.node_type ?? v.nodeType) as SupportAttachmentNodeType)
    : 'file';
  const uploadStatus = ATTACHMENT_UPLOAD_STATUSES.includes(
    (v.upload_status ?? v.uploadStatus) as SupportAttachmentUploadStatus,
  )
    ? ((v.upload_status ?? v.uploadStatus) as SupportAttachmentUploadStatus)
    : 'ready';
  return {
    id: readString(v.id),
    parentId: readStringOrNull(v.parent_id ?? v.parentId),
    nodeType,
    name: readString(v.name),
    mimeType: readStringOrNull(v.mime_type ?? v.mimeType),
    fileExtension: readStringOrNull(v.file_extension ?? v.fileExtension),
    fileSizeBytes: readNumberOrNull(v.file_size_bytes ?? v.fileSizeBytes),
    uploadStatus,
    trashedAt: readStringOrNull(v.trashed_at ?? v.trashedAt),
    purgeAfterAt: readStringOrNull(v.purge_after_at ?? v.purgeAfterAt),
    createdBy: readStringOrNull(v.created_by ?? v.createdBy),
    createdAt: readString(v.created_at ?? v.createdAt),
    updatedAt: readString(v.updated_at ?? v.updatedAt),
  };
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const SCAFFOLD = 'NOT_IMPLEMENTED: backend REST not yet exposed';

export function createSupportClient(options: SupportClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function postJson(path: string, body: unknown, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listTickets(params: ListTicketsParams = {}): Promise<TicketListResult> {
      const payload = readRecord(
        await getJson(
          `/support/tickets${buildQuery({ ...params })}`,
          'Tickets could not be loaded.',
        ),
      );
      const data = Array.isArray(payload.data) ? payload.data.map(normalizeTicket) : [];
      return {
        data,
        total: readNumber(payload.total, data.length),
        page: readNumber(payload.page, 1),
        pageSize: readNumber(payload.page_size ?? payload.pageSize, data.length),
      };
    },
    async getStats(): Promise<SupportStats> {
      const v = readRecord(await getJson('/support/tickets/stats', 'Stats could not be loaded.'));
      return {
        total: readNumber(v.total),
        open: readNumber(v.open),
        inProgress: readNumber(v.inProgress ?? v.in_progress),
        resolved: readNumber(v.resolved),
        closed: readNumber(v.closed),
      };
    },
    async getTicket(id: string): Promise<SupportTicket> {
      return normalizeTicket(
        await getJson(`/support/tickets/${encodeURIComponent(id)}`, 'Ticket could not be loaded.'),
      );
    },
    async listComments(ticketId: string): Promise<SupportComment[]> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/comments`,
          'Comments could not be loaded.',
        ),
      );
      return Array.isArray(v.data) ? v.data.map(normalizeComment) : [];
    },
    async listAttachments(ticketId: string): Promise<SupportAttachment[]> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/attachments`,
          'Attachments could not be loaded.',
        ),
      );
      return Array.isArray(v.data) ? v.data.map(normalizeAttachment) : [];
    },
    async createTicket(input: CreateTicketInput): Promise<SupportTicket> {
      return normalizeTicket(
        await postJson('/support/tickets', input, 'Ticket could not be created.'),
      );
    },
    async addComment(ticketId: string, message: string): Promise<SupportComment> {
      return normalizeComment(
        await postJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/comments`,
          { message },
          'Reply could not be sent.',
        ),
      );
    },
    async uploadAttachments(ticketId: string, files: File[]): Promise<void> {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const response = await fetch(
        url(`/support/tickets/${encodeURIComponent(ticketId)}/attachments`),
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        },
      );
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Attachments could not be uploaded.'));
    },
    async attachmentDownloadUrl(ticketId: string, nodeId: string): Promise<string> {
      const v = readRecord(
        await getJson(
          `/support/tickets/${encodeURIComponent(ticketId)}/attachments/${encodeURIComponent(nodeId)}/download`,
          'Download unavailable.',
        ),
      );
      return readString(v.url);
    },

    // --- Scaffold mutations: no backend REST yet. Keep signatures stable for later wiring. ---
    async updateStatus(_ticketId: string, _status: SupportStatus): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async updatePriority(_ticketId: string, _priority: SupportPriority): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async assign(_ticketId: string, _assigneeUserId: string | null): Promise<never> {
      throw new Error(SCAFFOLD);
    },
    async resolve(_ticketId: string, _resolutionMessage: string): Promise<never> {
      throw new Error(SCAFFOLD);
    },
  };
}

export type SupportClient = ReturnType<typeof createSupportClient>;
