import type { ListTicketsParams } from './types';

type OrgId = string | null;

export const supportKeys = {
  root: (org: OrgId) => ['support', org] as const,
  list: (org: OrgId, params: ListTicketsParams) => ['support', org, 'list', params] as const,
  stats: (org: OrgId) => ['support', org, 'stats'] as const,
  ticket: (org: OrgId, id: string) => ['support', org, 'ticket', id] as const,
  comments: (org: OrgId, id: string) => ['support', org, 'comments', id] as const,
  attachments: (org: OrgId, id: string) => ['support', org, 'attachments', id] as const,
  assignees: (org: OrgId) => ['support', org, 'assignees'] as const,
};
