import type { ReactNode } from 'react';

import type { SearchProvider, SearchResult } from '../types';
import { limitResults, matchesSearch } from './utils';

type RouteSearchItem = {
  id: string;
  label: string;
  path: string;
  group: string;
  icon?: ReactNode;
};

export function createRouteSearchProvider(items: RouteSearchItem[]): SearchProvider {
  return {
    id: 'routes',
    label: 'Routes',
    search: async (query, signal) => {
      if (signal.aborted) return [];
      return limitResults(
        items
          .filter((item) => matchesSearch(query, item.label, item.path, item.group))
          .map<SearchResult>((item) => ({
            id: item.id,
            title: item.label,
            subtitle: item.path,
            icon: item.icon,
            href: item.path,
            groupId: item.group,
          })),
        8,
      );
    },
  };
}
