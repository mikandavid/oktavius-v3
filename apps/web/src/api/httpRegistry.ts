import {
  API_RESOURCE_KEYS,
  ApiAuthorizationError,
  type ApiCrudResourceHandlers,
  type ApiListParams,
  type ApiRegistry,
  type ApiResourceKey,
  ApiValidationError,
  type ListResponse,
} from './contracts';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type HttpRegistryFetcher = (
  input: string,
  init: {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<Response>;

type HttpEntityHandlersOptions = {
  basePath: string;
  fetcher?: HttpRegistryFetcher;
  headers?: Record<string, string>;
};

/** Optional endpoint overrides; every resource defaults to `/<key>`. */
export type HttpRegistryEndpoints = Partial<Record<ApiResourceKey, string>>;

export type HttpRegistryOptions = {
  baseUrl: string;
  endpoints?: HttpRegistryEndpoints;
  fetcher?: HttpRegistryFetcher;
  headers?: Record<string, string>;
};

type ApiRecord = Record<string, unknown> & { id: string };

function getDefaultFetcher(): HttpRegistryFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for HTTP API registry adapters.');
  }

  return (input, init) => fetch(input, init);
}

function joinPath(base: string, path: string) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function withQuery(path: string, params: ApiListParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

async function parseJson(response: Response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (!response.ok) return null;
    throw error;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function fieldErrorsFromPayload(payload: unknown) {
  if (!isRecord(payload)) return {};
  const errors = payload.errors;
  if (!isRecord(errors)) return {};

  return Object.fromEntries(
    Object.entries(errors).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

function messageFromPayload(payload: unknown, fallback: string) {
  return isRecord(payload) && typeof payload.message === 'string' ? payload.message : fallback;
}

function requirementFromPayload(payload: unknown) {
  return isRecord(payload) && typeof payload.requirement === 'string'
    ? payload.requirement
    : 'unknown';
}

async function requestJson<T>(
  options: HttpEntityHandlersOptions,
  path: string,
  method: HttpMethod,
  body?: unknown,
): Promise<T> {
  const fetcher = options.fetcher ?? getDefaultFetcher();
  const headers = body
    ? { ...options.headers, 'Content-Type': 'application/json' }
    : options.headers;
  const response = await fetcher(path, {
    method,
    headers: Object.keys(headers ?? {}).length > 0 ? headers : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await parseJson(response);

  if (response.status === 422) {
    throw new ApiValidationError(
      messageFromPayload(payload, `${method} ${path} failed validation.`),
      fieldErrorsFromPayload(payload),
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new ApiAuthorizationError(
      messageFromPayload(payload, `${method} ${path} is not allowed.`),
      requirementFromPayload(payload),
    );
  }

  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status} ${response.statusText}`.trim(),
    );
  }

  return payload as T;
}

function resourcePath(basePath: string, id: string) {
  return `${basePath.replace(/\/$/, '')}/${encodeURIComponent(id)}`;
}

export function createHttpEntityHandlers<
  TRow extends { id: string } = ApiRecord,
  TListParams extends ApiListParams = ApiListParams,
  TCreateInput = Partial<TRow>,
  TUpdateInput = Partial<TRow>,
>(
  options: HttpEntityHandlersOptions,
): ApiCrudResourceHandlers<TRow, TListParams, TCreateInput, TUpdateInput> {
  return {
    list(params: TListParams) {
      return requestJson<ListResponse<TRow>>(options, withQuery(options.basePath, params), 'GET');
    },
    get(id: string) {
      return requestJson<TRow | null>(options, resourcePath(options.basePath, id), 'GET');
    },
    create(input: TCreateInput) {
      return requestJson<TRow>(options, options.basePath, 'POST', input);
    },
    update(id: string, input: TUpdateInput) {
      return requestJson<TRow>(options, resourcePath(options.basePath, id), 'PATCH', input);
    },
    async delete(id: string) {
      await requestJson<null>(options, resourcePath(options.basePath, id), 'DELETE');
    },
  };
}

export function createHttpRegistry({
  baseUrl,
  endpoints,
  fetcher,
  headers,
}: HttpRegistryOptions): ApiRegistry {
  const optionsFor = (key: ApiResourceKey): HttpEntityHandlersOptions => ({
    basePath: joinPath(baseUrl, endpoints?.[key] ?? `/${key}`),
    fetcher,
    headers,
  });

  const registry = {} as ApiRegistry;
  for (const key of API_RESOURCE_KEYS) {
    registry[key] = createHttpEntityHandlers(optionsFor(key));
  }
  return registry;
}
