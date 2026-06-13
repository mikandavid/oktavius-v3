import type { ListNodesParams } from './types';

type OrgId = string | null;

export const storageKeys = {
  root: (org: OrgId) => ['storage', org] as const,
  tree: (org: OrgId) => ['storage', org, 'tree'] as const,
  nodes: (org: OrgId, params: ListNodesParams) => ['storage', org, 'nodes', params] as const,
  favorites: (org: OrgId) => ['storage', org, 'favorites'] as const,
  recent: (org: OrgId) => ['storage', org, 'recent'] as const,
  trash: (org: OrgId, page: number) => ['storage', org, 'trash', page] as const,
  usage: (org: OrgId) => ['storage', org, 'usage'] as const,
  previewUrl: (org: OrgId, id: string) => ['storage', org, 'preview-url', id] as const,
  downloadUrl: (org: OrgId, id: string) => ['storage', org, 'download-url', id] as const,
};
