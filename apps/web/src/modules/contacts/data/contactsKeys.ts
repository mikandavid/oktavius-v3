import type { ListContactsParams } from './types';

type OrgId = string | null;

export const contactsKeys = {
  root: (org: OrgId) => ['contacts', org] as const,
  list: (org: OrgId, params: ListContactsParams) => ['contacts', org, 'list', params] as const,
  detail: (org: OrgId, id: string) => ['contacts', org, 'detail', id] as const,
  categories: (org: OrgId) => ['contacts', org, 'categories'] as const,
};
