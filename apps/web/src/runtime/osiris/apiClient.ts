import type { HttpRegistryFetcher } from '@/api/httpRegistry';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  getActiveOrgId?: () => string | null;
  getActiveSiteId?: () => string | null;
  onUnauthorized?: () => void | Promise<void>;
};

export function createOsirisApiFetcher(options: OsirisApiClientOptions = {}): HttpRegistryFetcher {
  return async (input, init) => {
    const headers = new Headers(init.headers);
    const token = options.getAccessToken?.();
    const orgId = options.getActiveOrgId?.();
    const siteId = options.getActiveSiteId?.();

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (orgId) headers.set('X-Org-Id', orgId);
    if (siteId) headers.set('X-Site-Id', siteId);

    const response = await fetch(joinOsirisApiBaseUrl(options.baseUrl, input), {
      ...init,
      headers,
      credentials: 'include',
    });
    if (response.status === 401) {
      void options.onUnauthorized?.();
    }
    return response;
  };
}
