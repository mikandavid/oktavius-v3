import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from '@/runtime/osiris/osirisClientUtils';

import type {
  FinalizeUploadResult,
  ListNodesParams,
  NodeListResult,
  StorageNode,
  StorageNodeType,
  StorageTreeNode,
  StorageUsage,
  UploadSession,
  UploadStatus,
} from './types';

export type OsirisStorageClientOptions = { baseUrl?: string };

const NODE_TYPES: readonly StorageNodeType[] = ['folder', 'file'];
const UPLOAD_STATUSES: readonly UploadStatus[] = ['pending', 'uploading', 'ready', 'failed'];

function readNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeNode(row: unknown): StorageNode {
  const v = readRecord(row);
  const nodeType = NODE_TYPES.includes((v.node_type ?? v.nodeType) as StorageNodeType)
    ? ((v.node_type ?? v.nodeType) as StorageNodeType)
    : 'file';
  const uploadStatus = UPLOAD_STATUSES.includes((v.upload_status ?? v.uploadStatus) as UploadStatus)
    ? ((v.upload_status ?? v.uploadStatus) as UploadStatus)
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

function normalizeTreeNode(row: unknown): StorageTreeNode {
  const base = normalizeNode(row);
  const children = readRecord(row).children;
  return { ...base, children: Array.isArray(children) ? children.map(normalizeTreeNode) : [] };
}

function normalizeList(payload: unknown): NodeListResult {
  const v = readRecord(payload);
  const data = Array.isArray(v.data) ? v.data.map(normalizeNode) : [];
  return {
    data,
    total: readNumber(v.total, data.length),
    page: readNumber(v.page, 1),
    pageSize: readNumber(v.page_size ?? v.pageSize, data.length),
    totalPages: readNumber(v.total_pages ?? v.totalPages, 1),
    hasMore: Boolean(v.has_more ?? v.hasMore),
  };
}

function normalizeUsage(payload: unknown): StorageUsage {
  const v = readRecord(payload);
  return {
    usedBytes: readNumber(v.used_bytes ?? v.usedBytes),
    reservedBytes: readNumber(v.reserved_bytes ?? v.reservedBytes),
    limitBytes: readNumber(v.limit_bytes ?? v.limitBytes),
    availableBytes: readNumber(v.available_bytes ?? v.availableBytes),
    usagePercent: readNumber(v.usage_percent ?? v.usagePercent),
  };
}

function normalizeSession(payload: unknown): UploadSession {
  const v = readRecord(payload);
  return {
    sessionId: readString(v.session_id ?? v.sessionId),
    nodeId: readString(v.node_id ?? v.nodeId),
    signedUrl: readString(v.signed_url ?? v.signedUrl),
    bucket: readString(v.bucket),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    mimeType: readString(v.mime_type ?? v.mimeType),
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

export function createOsirisStorageClient(options: OsirisStorageClientOptions = {}) {
  const url = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);

  async function getJson(path: string, fallback: string): Promise<unknown> {
    const response = await fetch(url(path), { credentials: 'include' });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    return response.json();
  }

  async function send(
    path: string,
    method: string,
    body: unknown,
    fallback: string,
  ): Promise<unknown> {
    const response = await fetch(url(path), {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw new Error(await readErrorMessage(response, fallback));
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listTree(): Promise<StorageTreeNode[]> {
      const payload = await getJson('/storage/tree', 'Folders could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeTreeNode) : [];
    },
    async listNodes(params: ListNodesParams = {}): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage${buildQuery({ ...params })}`,
        'Files could not be loaded.',
      );
      return normalizeList(payload);
    },
    async search(params: {
      q: string;
      folderId?: string | null;
      scope?: string;
      page?: number;
      pageSize?: number;
    }): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage/search${buildQuery({ ...params })}`,
        'Search failed.',
      );
      return normalizeList(payload);
    },
    async getNode(id: string): Promise<StorageNode> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}`,
        'File could not be loaded.',
      );
      return normalizeNode(payload);
    },
    async previewUrl(id: string): Promise<string> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}/preview-url`,
        'Preview unavailable.',
      );
      return readString(readRecord(payload).url);
    },
    async downloadUrl(id: string): Promise<string> {
      const payload = await getJson(
        `/storage/${encodeURIComponent(id)}/download-url`,
        'Download unavailable.',
      );
      return readString(readRecord(payload).url);
    },
    async createFolder(input: { name: string; parentId?: string | null }): Promise<StorageNode> {
      const payload = await send(
        '/storage/folders',
        'POST',
        { name: input.name, parentId: input.parentId ?? null },
        'Folder could not be created.',
      );
      return normalizeNode(payload);
    },
    async rename(id: string, name: string): Promise<StorageNode> {
      const payload = await send(
        `/storage/${encodeURIComponent(id)}/name`,
        'PATCH',
        { name },
        'Rename failed.',
      );
      return normalizeNode(payload);
    },
    async move(nodeIds: string[], targetFolderId: string | null): Promise<void> {
      await send('/storage/bulk/move', 'POST', { nodeIds, targetFolderId }, 'Move failed.');
    },
    async trash(nodeIds: string[]): Promise<void> {
      await send('/storage/bulk/trash', 'POST', { nodeIds }, 'Move to trash failed.');
    },
    async restore(id: string): Promise<void> {
      await send(`/storage/${encodeURIComponent(id)}/restore`, 'POST', {}, 'Restore failed.');
    },
    async purge(nodeIds: string[]): Promise<void> {
      await send('/storage/bulk/purge', 'POST', { nodeIds }, 'Delete failed.');
    },
    async listFavorites(): Promise<StorageNode[]> {
      const payload = await getJson('/storage/favorites', 'Favorites could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeNode) : [];
    },
    async addFavorite(id: string): Promise<void> {
      await send(
        `/storage/favorites/${encodeURIComponent(id)}`,
        'POST',
        {},
        'Could not star file.',
      );
    },
    async removeFavorite(id: string): Promise<void> {
      await send(
        `/storage/favorites/${encodeURIComponent(id)}`,
        'DELETE',
        undefined,
        'Could not unstar file.',
      );
    },
    async listRecent(): Promise<StorageNode[]> {
      const payload = await getJson('/storage/recent', 'Recent files could not be loaded.');
      return Array.isArray(payload) ? payload.map(normalizeNode) : [];
    },
    async listTrash(params: { page?: number; pageSize?: number } = {}): Promise<NodeListResult> {
      const payload = await getJson(
        `/storage/trash${buildQuery({ ...params })}`,
        'Trash could not be loaded.',
      );
      return normalizeList(payload);
    },
    async usage(): Promise<StorageUsage> {
      const payload = await getJson('/storage/usage', 'Usage could not be loaded.');
      return normalizeUsage(payload);
    },
    async initiateUpload(input: {
      folderId?: string | null;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }): Promise<UploadSession> {
      const payload = await send(
        '/storage/uploads/initiate',
        'POST',
        {
          folderId: input.folderId ?? null,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
        },
        'Upload could not be started.',
      );
      return normalizeSession(payload);
    },
    async finalizeUpload(input: {
      sessionId: string;
      contentSha256?: string;
    }): Promise<FinalizeUploadResult> {
      const payload = await send(
        '/storage/uploads/finalize',
        'POST',
        { sessionId: input.sessionId, contentSha256: input.contentSha256 },
        'Upload could not be finalized.',
      );
      const v = readRecord(payload);
      return {
        node: normalizeNode(v.node),
        duplicateOfNodeId: readStringOrNull(v.duplicate_of_node_id ?? v.duplicateOfNodeId),
      };
    },
    async refreshUpload(input: { sessionId: string }): Promise<UploadSession> {
      const payload = await send(
        '/storage/uploads/refresh',
        'POST',
        { sessionId: input.sessionId },
        'Upload session could not be refreshed.',
      );
      return normalizeSession(payload);
    },
  };
}

export type OsirisStorageClient = ReturnType<typeof createOsirisStorageClient>;
