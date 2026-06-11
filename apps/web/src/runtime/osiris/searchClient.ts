import type { SearchRuntimeAdapter } from '@/lib/search/SearchRuntime';
import type { SearchResult } from '@/lib/search/types';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisSearchFetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CreateOsirisSearchRuntimeOptions = {
  baseUrl?: string;
  fetcher?: OsirisSearchFetcher;
  limit?: number;
  types?: string[];
};

function getDefaultFetcher(): OsirisSearchFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for Osiris search.');
  }

  return fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function titleCase(input: string) {
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resultRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function normalizeSearchResult(value: unknown): SearchResult | null {
  if (!isRecord(value)) return null;

  const type = typeof value.type === 'string' ? value.type : 'records';
  const id = typeof value.id === 'string' ? value.id : null;
  const title = typeof value.title === 'string' ? value.title : null;
  if (!id || !title) return null;

  return {
    id: `${type}:${id}`,
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    href:
      typeof value.url === 'string' && value.url.length > 0
        ? value.url
        : `/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    groupId: titleCase(type),
  };
}

async function parseJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Osiris search request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

export function createOsirisSearchRuntime({
  baseUrl,
  fetcher = getDefaultFetcher(),
  limit = 8,
  types,
}: CreateOsirisSearchRuntimeOptions = {}): SearchRuntimeAdapter {
  return {
    async search(query, signal) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || signal.aborted) return [];

      const params = new URLSearchParams({
        q: trimmedQuery,
        limit: String(limit),
      });
      if (types?.length) params.set('types', types.join(','));

      const response = await fetcher(joinOsirisApiBaseUrl(baseUrl, `/search?${params}`), {
        credentials: 'include',
        signal,
      });
      const payload = await parseJson(response);
      if (signal.aborted) return [];

      return resultRows(payload)
        .map(normalizeSearchResult)
        .filter((item) => item !== null);
    },
  };
}
