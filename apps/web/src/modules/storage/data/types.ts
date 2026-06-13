export type StorageNodeType = 'folder' | 'file';
export type UploadStatus = 'pending' | 'uploading' | 'ready' | 'failed';

export interface StorageNode {
  id: string;
  parentId: string | null;
  nodeType: StorageNodeType;
  name: string;
  mimeType: string | null;
  fileExtension: string | null;
  fileSizeBytes: number | null;
  uploadStatus: UploadStatus;
  trashedAt: string | null;
  purgeAfterAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageTreeNode extends StorageNode {
  children: StorageTreeNode[];
}

export interface StorageUsage {
  usedBytes: number;
  reservedBytes: number;
  limitBytes: number;
  availableBytes: number;
  usagePercent: number;
}

export interface NodeListResult {
  data: StorageNode[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UploadSession {
  sessionId: string;
  nodeId: string;
  signedUrl: string;
  bucket: string;
  expiresAt: string | null;
  mimeType: string;
}

export interface FinalizeUploadResult {
  node: StorageNode;
  duplicateOfNodeId: string | null;
}

export type StorageView = 'folder' | 'recent' | 'starred' | 'trash';
export type StorageSortBy = 'name' | 'updatedAt' | 'fileSizeBytes';
export type StorageSortDir = 'asc' | 'desc';
export type StorageDisplayMode = 'grid' | 'list';
export type StorageSearchScope = 'current' | 'global';

export interface StorageSort {
  by: StorageSortBy;
  dir: StorageSortDir;
}

export interface ListNodesParams {
  folderId?: string | null;
  search?: string;
  scope?: StorageSearchScope;
  nodeType?: StorageNodeType;
  sortBy?: StorageSortBy;
  sortDir?: StorageSortDir;
  page?: number;
  pageSize?: number;
  trashed?: boolean;
  favoritesOnly?: boolean;
}
