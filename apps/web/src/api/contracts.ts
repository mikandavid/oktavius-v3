export class ApiValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string>) {
    super(message);
    this.name = 'ApiValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class ApiAuthorizationError extends Error {
  readonly requirement: string;

  constructor(message: string, requirement: string) {
    super(message);
    this.name = 'ApiAuthorizationError';
    this.requirement = requirement;
  }
}

/**
 * Thrown for any non-OK response not already mapped to a more specific error
 * (validation / authorization). Carries `statusCode` so retry policy can tell
 * a retryable 5xx/429 from a terminal 4xx.
 */
export class ApiRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
  }
}

export type ListResponse<T> = {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type ApiListParams = Record<string, string | undefined>;

export type ApiCrudResourceHandlers<
  TRecord = Record<string, unknown>,
  TListParams extends ApiListParams = ApiListParams,
  TCreateInput = Partial<TRecord>,
  TUpdateInput = Partial<TRecord>,
> = {
  list: (params: TListParams) => Promise<ListResponse<TRecord>>;
  get: (id: string) => Promise<TRecord | null>;
  create: (input: TCreateInput) => Promise<TRecord>;
  update: (id: string, input: TUpdateInput) => Promise<TRecord>;
  delete: (id: string) => Promise<void>;
};

/**
 * Every CRUD resource the frontend talks to. Adding a resource here is the only
 * registry change needed — the HTTP endpoint derives from the key (`/clients`).
 */
export const API_RESOURCE_KEYS = ['clients', 'contacts', 'invoices', 'orders', 'projects'] as const;

export type ApiResourceKey = (typeof API_RESOURCE_KEYS)[number];

export type ApiRegistry = Record<ApiResourceKey, ApiCrudResourceHandlers>;
