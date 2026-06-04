import {
  ApiAuthorizationError,
  ApiValidationError,
  type CaseChecklistsHandlers,
  type CasesHandlers,
  type CasesListParams,
  type ClientsListParams,
  type ContactsListParams,
  type ContractsListParams,
  type DemoApiRegistry,
  type IncidentsListParams,
  type InvoicesListParams,
  type LeadsListParams,
  type ListResponse,
  type OrdersListParams,
  type OrganizationsListParams,
  type PartiesHandlers,
  type ProductsListParams,
  type ProjectsListParams,
  type PurchasingListParams,
  type StaffListParams,
  type UsersListParams,
  type VendorsListParams,
} from './demo-client';
import type {
  CaseChecklistItem,
  CaseRecord,
  ClientRecord,
  ContactRecord,
  ContractRecord,
  IncidentRecord,
  InvoiceRecord,
  LeadRecord,
  OrderRecord,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  PurchaseOrderRecord,
  StaffRecord,
  UserRecord,
  VendorRecord,
} from '@/app/demo-data';

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

export type HttpRegistryEndpoints = {
  cases: string;
  caseChecklists: string;
  clients: string;
  contacts: string;
  contracts: string;
  incidents: string;
  invoices: string;
  leads: string;
  orders: string;
  organizations: string;
  parties: string;
  products: string;
  projects: string;
  purchasing: string;
  staff: string;
  users: string;
  vendors: string;
};

export type HttpRegistryOptions = {
  baseUrl: string;
  endpoints: HttpRegistryEndpoints;
  fetcher?: HttpRegistryFetcher;
  headers?: Record<string, string>;
};

function getDefaultFetcher(): HttpRegistryFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for HTTP API registry adapters.');
  }

  return (input, init) => fetch(input, init);
}

function joinPath(base: string, path: string) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function withQuery(path: string, params: Record<string, string | undefined>) {
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
  return JSON.parse(text) as unknown;
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
  TRow extends { id: string },
  TListParams extends Record<string, string | undefined>,
  TCreateInput,
>(options: HttpEntityHandlersOptions) {
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
    update(id: string, input: Partial<TCreateInput>) {
      return requestJson<TRow>(options, resourcePath(options.basePath, id), 'PATCH', input);
    },
    async delete(id: string) {
      await requestJson<null>(options, resourcePath(options.basePath, id), 'DELETE');
    },
  };
}

function createCasesHandlers(options: HttpEntityHandlersOptions): CasesHandlers {
  const handlers = createHttpEntityHandlers<
    CaseRecord,
    CasesListParams,
    Omit<CaseRecord, 'id' | 'caseNumber' | 'openedAt' | 'slaStatus' | 'orgId'>
  >(options);
  return {
    ...handlers,
    updateStage: (id, stage) =>
      requestJson<CaseRecord>(options, `${resourcePath(options.basePath, id)}/stage`, 'PATCH', {
        stage,
      }),
  };
}

function createCaseChecklistsHandlers(options: HttpEntityHandlersOptions): CaseChecklistsHandlers {
  return {
    create: (input) => requestJson<CaseChecklistItem>(options, options.basePath, 'POST', input),
    updateDone: (id, done) =>
      requestJson<CaseChecklistItem>(
        options,
        `${resourcePath(options.basePath, id)}/done`,
        'PATCH',
        {
          done,
        },
      ),
  };
}

function createPartiesHandlers(options: HttpEntityHandlersOptions): PartiesHandlers {
  return {
    create: (input) => requestJson<PartyRecord>(options, options.basePath, 'POST', input),
  };
}

export function createHttpRegistry({
  baseUrl,
  endpoints,
  fetcher,
  headers,
}: HttpRegistryOptions): DemoApiRegistry {
  const optionsFor = (endpoint: string): HttpEntityHandlersOptions => ({
    basePath: joinPath(baseUrl, endpoint),
    fetcher,
    headers,
  });

  return {
    cases: createCasesHandlers(optionsFor(endpoints.cases)),
    caseChecklists: createCaseChecklistsHandlers(optionsFor(endpoints.caseChecklists)),
    clients: createHttpEntityHandlers<
      ClientRecord,
      ClientsListParams,
      Omit<ClientRecord, 'id' | 'createdAt' | 'orgId'>
    >(optionsFor(endpoints.clients)),
    contracts: createHttpEntityHandlers<
      ContractRecord,
      ContractsListParams,
      Omit<ContractRecord, 'id' | 'orgId' | 'renewalNoticeDays'>
    >(optionsFor(endpoints.contracts)),
    incidents: createHttpEntityHandlers<
      IncidentRecord,
      IncidentsListParams,
      Omit<IncidentRecord, 'id' | 'orgId'>
    >(optionsFor(endpoints.incidents)),
    invoices: createHttpEntityHandlers<
      InvoiceRecord,
      InvoicesListParams,
      Omit<InvoiceRecord, 'id' | 'orgId'>
    >(optionsFor(endpoints.invoices)),
    orders: createHttpEntityHandlers<
      OrderRecord,
      OrdersListParams,
      Omit<OrderRecord, 'id' | 'orgId'>
    >(optionsFor(endpoints.orders)),
    organizations: createHttpEntityHandlers<
      OrganizationRecord,
      OrganizationsListParams,
      Omit<OrganizationRecord, 'id' | 'memberCount' | 'createdAt'>
    >(optionsFor(endpoints.organizations)),
    parties: createPartiesHandlers(optionsFor(endpoints.parties)),
    products: createHttpEntityHandlers<
      ProductRecord,
      ProductsListParams,
      Omit<ProductRecord, 'id' | 'orgId'>
    >(optionsFor(endpoints.products)),
    projects: createHttpEntityHandlers<
      ProjectRecord,
      ProjectsListParams,
      Omit<ProjectRecord, 'id' | 'orgId'>
    >(optionsFor(endpoints.projects)),
    users: createHttpEntityHandlers<UserRecord, UsersListParams, Omit<UserRecord, 'id'>>(
      optionsFor(endpoints.users),
    ),
    contacts: createHttpEntityHandlers<
      ContactRecord,
      ContactsListParams,
      Omit<ContactRecord, 'id' | 'createdAt' | 'orgId'>
    >(optionsFor(endpoints.contacts)),
    vendors: createHttpEntityHandlers<
      VendorRecord,
      VendorsListParams,
      Omit<VendorRecord, 'id' | 'createdAt' | 'orgId'>
    >(optionsFor(endpoints.vendors)),
    leads: {
      ...createHttpEntityHandlers<
        LeadRecord,
        LeadsListParams,
        Omit<LeadRecord, 'id' | 'createdAt' | 'orgId'>
      >(optionsFor(endpoints.leads)),
      updateStage: (id: string, stage: LeadRecord['stage']) =>
        requestJson<LeadRecord>(
          optionsFor(endpoints.leads),
          `${optionsFor(endpoints.leads).basePath}/${id}/stage`,
          'PATCH',
          { stage },
        ),
    },
    staff: createHttpEntityHandlers<
      StaffRecord,
      StaffListParams,
      Omit<StaffRecord, 'id' | 'createdAt' | 'orgId'>
    >(optionsFor(endpoints.staff)),
    purchasing: createHttpEntityHandlers<
      PurchaseOrderRecord,
      PurchasingListParams,
      Omit<PurchaseOrderRecord, 'id' | 'poNumber' | 'createdAt' | 'orgId'>
    >(optionsFor(endpoints.purchasing)),
  };
}
