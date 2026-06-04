import type { HttpRegistryFetcher } from '@/api/httpRegistry';

export type OsirisApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  getActiveOrgId?: () => string | null;
  getActiveSiteId?: () => string | null;
};

function isAbsoluteHttpUrl(input: string) {
  return /^https?:\/\//i.test(input);
}

function joinBaseUrl(baseUrl: string | undefined, input: string) {
  if (isAbsoluteHttpUrl(input)) return input;
  if (!baseUrl) return input;

  return `${baseUrl.replace(/\/$/, '')}/${input.replace(/^\//, '')}`;
}

export function createOsirisApiFetcher(options: OsirisApiClientOptions = {}): HttpRegistryFetcher {
  return async (input, init) => {
    const headers = new Headers(init.headers);
    const token = options.getAccessToken?.();
    const orgId = options.getActiveOrgId?.();
    const siteId = options.getActiveSiteId?.();

    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (orgId) headers.set('X-Org-Id', orgId);
    if (siteId) headers.set('X-Site-Id', siteId);

    return fetch(joinBaseUrl(options.baseUrl, input), {
      ...init,
      headers,
      credentials: 'include',
    });
  };
}
