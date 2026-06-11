import type { SearchProvider, SearchResult } from './types';

export type SearchRuntimeAdapter = {
  search: (query: string, signal: AbortSignal) => Promise<SearchResult[]>;
};

export const NOOP_SEARCH_RUNTIME: SearchRuntimeAdapter = {
  search: async () => [],
};

export function createRuntimeSearchProvider(runtime: SearchRuntimeAdapter): SearchProvider {
  return {
    id: 'runtime',
    label: 'Global search',
    search: (query, signal) => runtime.search(query, signal),
  };
}
