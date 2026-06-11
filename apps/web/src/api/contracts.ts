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

export type ApiRegistry = {
  cases: ApiCrudResourceHandlers;
  caseChecklists: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
    updateDone: (id: string, done: boolean) => Promise<Record<string, unknown>>;
  };
  clients: ApiCrudResourceHandlers;
  contacts: ApiCrudResourceHandlers;
  contracts: ApiCrudResourceHandlers;
  incidents: ApiCrudResourceHandlers;
  invoices: ApiCrudResourceHandlers;
  leads: ApiCrudResourceHandlers;
  orders: ApiCrudResourceHandlers;
  organizations: ApiCrudResourceHandlers;
  parties: {
    create: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
  products: ApiCrudResourceHandlers;
  projects: ApiCrudResourceHandlers;
  purchasing: ApiCrudResourceHandlers;
  staff: ApiCrudResourceHandlers;
  users: ApiCrudResourceHandlers;
  vendors: ApiCrudResourceHandlers;
};
