import type { ReactNode } from 'react';

import type { PermissionRequirement } from '@/lib/permissions';

export type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  href: string;
  groupId: string;
};

export type SearchProvider = {
  id: string;
  label: string;
  search: (query: string, signal: AbortSignal) => Promise<SearchResult[]>;
  permission?: PermissionRequirement;
};
