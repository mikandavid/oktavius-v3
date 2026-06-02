import type {
  CaseChecklistItem,
  CaseRecord,
  ClientRecord,
  ContractRecord,
  IncidentRecord,
  InvoiceRecord,
  OrderRecord,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  UserRecord,
} from '@/app/demo-data';

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

export type ClientsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  type?: string;
};

export type ProductsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  category?: string;
};

export type OrdersListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  owner?: string;
  clientName?: string;
};

export type CasesListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  type?: string;
  stage?: string;
  priority?: string;
};

export type UsersListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  role?: string;
  status?: string;
};

export type OrganizationsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  plan?: string;
  status?: string;
  environment?: string;
};

export type InvoicesListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  clientName?: string;
};

export type ContractsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  clientName?: string;
  owner?: string;
};

export type IncidentsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  severity?: string;
  status?: string;
  service?: string;
};

export type ProjectsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  manager?: string;
  clientName?: string;
};

export type ClientsHandlers = {
  list: (params: ClientsListParams) => Promise<ListResponse<ClientRecord>>;
  get: (id: string) => Promise<ClientRecord | null>;
  create: (input: Omit<ClientRecord, 'id' | 'createdAt' | 'orgId'>) => Promise<ClientRecord>;
  update: (
    id: string,
    input: Partial<Omit<ClientRecord, 'id' | 'createdAt' | 'orgId'>>,
  ) => Promise<ClientRecord>;
  delete: (id: string) => Promise<void>;
};

export type ProductsHandlers = {
  list: (params: ProductsListParams) => Promise<ListResponse<ProductRecord>>;
  get: (id: string) => Promise<ProductRecord | null>;
  create: (input: Omit<ProductRecord, 'id' | 'orgId'>) => Promise<ProductRecord>;
  update: (
    id: string,
    input: Partial<Omit<ProductRecord, 'id' | 'orgId'>>,
  ) => Promise<ProductRecord>;
  delete: (id: string) => Promise<void>;
};

export type UsersHandlers = {
  list: (params: UsersListParams) => Promise<ListResponse<UserRecord>>;
  get: (id: string) => Promise<UserRecord | null>;
  create: (input: Omit<UserRecord, 'id'>) => Promise<UserRecord>;
  update: (id: string, input: Partial<Omit<UserRecord, 'id'>>) => Promise<UserRecord>;
  delete: (id: string) => Promise<void>;
};

export type CasesHandlers = {
  list: (params: CasesListParams) => Promise<ListResponse<CaseRecord>>;
  get: (id: string) => Promise<CaseRecord | null>;
  create: (
    input: Omit<CaseRecord, 'id' | 'caseNumber' | 'openedAt' | 'slaStatus' | 'orgId'>,
  ) => Promise<CaseRecord>;
  update: (
    id: string,
    input: Partial<Omit<CaseRecord, 'id' | 'caseNumber' | 'openedAt' | 'slaStatus' | 'orgId'>>,
  ) => Promise<CaseRecord>;
  updateStage: (id: string, stage: CaseRecord['stage']) => Promise<CaseRecord>;
  delete: (id: string) => Promise<void>;
};

export type CaseChecklistsHandlers = {
  create: (input: Omit<CaseChecklistItem, 'id' | 'done'>) => Promise<CaseChecklistItem>;
  updateDone: (id: string, done: boolean) => Promise<CaseChecklistItem>;
};

export type OrganizationsHandlers = {
  list: (params: OrganizationsListParams) => Promise<ListResponse<OrganizationRecord>>;
  get: (id: string) => Promise<OrganizationRecord | null>;
  create: (
    input: Omit<OrganizationRecord, 'id' | 'memberCount' | 'createdAt'>,
  ) => Promise<OrganizationRecord>;
  update: (
    id: string,
    input: Partial<Omit<OrganizationRecord, 'id' | 'memberCount' | 'createdAt'>>,
  ) => Promise<OrganizationRecord>;
  delete: (id: string) => Promise<void>;
};

export type InvoicesHandlers = {
  list: (params: InvoicesListParams) => Promise<ListResponse<InvoiceRecord>>;
  get: (id: string) => Promise<InvoiceRecord | null>;
  create: (input: Omit<InvoiceRecord, 'id' | 'orgId'>) => Promise<InvoiceRecord>;
  update: (
    id: string,
    input: Partial<Omit<InvoiceRecord, 'id' | 'orgId'>>,
  ) => Promise<InvoiceRecord>;
  delete: (id: string) => Promise<void>;
};

export type OrdersHandlers = {
  list: (params: OrdersListParams) => Promise<ListResponse<OrderRecord>>;
  get: (id: string) => Promise<OrderRecord | null>;
  create: (input: Omit<OrderRecord, 'id' | 'orgId'>) => Promise<OrderRecord>;
  update: (id: string, input: Partial<Omit<OrderRecord, 'id' | 'orgId'>>) => Promise<OrderRecord>;
  delete: (id: string) => Promise<void>;
};

export type PartiesHandlers = {
  create: (input: Omit<PartyRecord, 'id'>) => Promise<PartyRecord>;
};

export type ContractsHandlers = {
  list: (params: ContractsListParams) => Promise<ListResponse<ContractRecord>>;
  get: (id: string) => Promise<ContractRecord | null>;
  create: (
    input: Omit<ContractRecord, 'id' | 'orgId' | 'renewalNoticeDays'>,
  ) => Promise<ContractRecord>;
  update: (
    id: string,
    input: Partial<Omit<ContractRecord, 'id' | 'orgId' | 'renewalNoticeDays'>>,
  ) => Promise<ContractRecord>;
  delete: (id: string) => Promise<void>;
};

export type IncidentsHandlers = {
  list: (params: IncidentsListParams) => Promise<ListResponse<IncidentRecord>>;
  get: (id: string) => Promise<IncidentRecord | null>;
  create: (input: Omit<IncidentRecord, 'id' | 'orgId'>) => Promise<IncidentRecord>;
  update: (
    id: string,
    input: Partial<Omit<IncidentRecord, 'id' | 'orgId'>>,
  ) => Promise<IncidentRecord>;
  delete: (id: string) => Promise<void>;
};

export type ProjectsHandlers = {
  list: (params: ProjectsListParams) => Promise<ListResponse<ProjectRecord>>;
  get: (id: string) => Promise<ProjectRecord | null>;
  create: (input: Omit<ProjectRecord, 'id' | 'orgId'>) => Promise<ProjectRecord>;
  update: (
    id: string,
    input: Partial<Omit<ProjectRecord, 'id' | 'orgId'>>,
  ) => Promise<ProjectRecord>;
  delete: (id: string) => Promise<void>;
};

export type DemoApiRegistry = {
  cases: CasesHandlers;
  caseChecklists: CaseChecklistsHandlers;
  clients: ClientsHandlers;
  contracts: ContractsHandlers;
  incidents: IncidentsHandlers;
  invoices: InvoicesHandlers;
  orders: OrdersHandlers;
  organizations: OrganizationsHandlers;
  parties: PartiesHandlers;
  products: ProductsHandlers;
  projects: ProjectsHandlers;
  users: UsersHandlers;
};
