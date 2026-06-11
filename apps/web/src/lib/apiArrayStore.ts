export type ApiArrayStoreFetcher = (
  input: string,
  init: {
    method: 'GET' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<Response>;

export type ApiArrayStoreOptions<T> = {
  endpoint: string;
  fetcher?: ApiArrayStoreFetcher;
  headers?: Record<string, string>;
  fallback: T[];
  parse: (payload: unknown) => T[];
};

function getDefaultFetcher(): ApiArrayStoreFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for API-backed generated stores.');
  }

  return (input, init) => fetch(input, { ...init, credentials: 'include' });
}

async function requestJsonArray<T>(
  options: ApiArrayStoreOptions<T>,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: T[],
) {
  const fetcher = options.fetcher ?? getDefaultFetcher();
  const headers = body
    ? { ...options.headers, 'Content-Type': 'application/json' }
    : options.headers;

  const response = await fetcher(options.endpoint, {
    method,
    headers: Object.keys(headers ?? {}).length > 0 ? headers : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(
      `${method} ${options.endpoint} failed with ${response.status} ${response.statusText}`.trim(),
    );
  }

  return response;
}

export function createApiArrayStore<T>(options: ApiArrayStoreOptions<T>) {
  return {
    async load() {
      const response = await requestJsonArray(options, 'GET');
      const payload = (await response.json()) as unknown;
      const parsed = options.parse(payload);
      return parsed.length > 0 ? parsed : options.fallback;
    },
    async save(items: T[]) {
      await requestJsonArray(options, 'PUT', items);
    },
    async clear() {
      await requestJsonArray(options, 'DELETE');
    },
  };
}
