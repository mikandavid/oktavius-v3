import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';

import type { SavedViewsRuntimeAdapter } from './savedViewsRuntime';
import { parseStoredSavedViews } from './savedViewsStorage';

export type OsirisSavedViewsFetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CreateOsirisSavedViewsAdapterOptions = {
  baseUrl?: string;
  fetcher?: OsirisSavedViewsFetcher;
};

function getDefaultFetcher(): OsirisSavedViewsFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for Osiris saved views.');
  }

  return fetch;
}

async function parseJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Osiris saved views request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

function endpoint(baseUrl: string | undefined, listKey: string) {
  return joinOsirisApiBaseUrl(
    baseUrl,
    `/generated-stores/saved-views/${encodeURIComponent(listKey)}`,
  );
}

export function createOsirisSavedViewsAdapter({
  baseUrl,
  fetcher,
}: CreateOsirisSavedViewsAdapterOptions = {}): SavedViewsRuntimeAdapter {
  const request: OsirisSavedViewsFetcher = (input, init) =>
    (fetcher ?? getDefaultFetcher())(input, init);

  return {
    async fetchViews(scope) {
      const response = await request(endpoint(baseUrl, scope.listKey), {
        method: 'GET',
        credentials: 'include',
      });
      return parseStoredSavedViews(await parseJson(response));
    },
    async persistView(scope, _view, views) {
      const response = await request(endpoint(baseUrl, scope.listKey), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(views),
      });
      await parseJson(response);
    },
    async deleteView(scope, _id, views) {
      if (views.length > 0) {
        const response = await request(endpoint(baseUrl, scope.listKey), {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(views),
        });
        await parseJson(response);
        return;
      }

      const response = await request(endpoint(baseUrl, scope.listKey), {
        method: 'DELETE',
        credentials: 'include',
      });
      await parseJson(response);
    },
    shareView: async () => undefined,
  };
}
