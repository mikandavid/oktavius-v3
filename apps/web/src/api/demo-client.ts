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
import type { ListResponse } from './contracts';

export { ApiAuthorizationError, ApiValidationError } from './contracts';
export type { ApiCrudResourceHandlers, ApiRegistry, ListResponse } from './contracts';

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

export type ContactsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  clientId?: string;
};

export type ContactsHandlers = {
  list: (params: ContactsListParams) => Promise<ListResponse<ContactRecord>>;
  get: (id: string) => Promise<ContactRecord | null>;
  create: (input: Omit<ContactRecord, 'id' | 'createdAt' | 'orgId'>) => Promise<ContactRecord>;
  update: (
    id: string,
    input: Partial<Omit<ContactRecord, 'id' | 'createdAt' | 'orgId'>>,
  ) => Promise<ContactRecord>;
  delete: (id: string) => Promise<void>;
};

export type VendorsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  category?: string;
};

export type VendorsHandlers = {
  list: (params: VendorsListParams) => Promise<ListResponse<VendorRecord>>;
  get: (id: string) => Promise<VendorRecord | null>;
  create: (input: Omit<VendorRecord, 'id' | 'createdAt' | 'orgId'>) => Promise<VendorRecord>;
  update: (
    id: string,
    input: Partial<Omit<VendorRecord, 'id' | 'createdAt' | 'orgId'>>,
  ) => Promise<VendorRecord>;
  delete: (id: string) => Promise<void>;
};

export type LeadsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  stage?: string;
  assignedTo?: string;
  source?: string;
};

export type LeadsHandlers = {
  list: (params: LeadsListParams) => Promise<ListResponse<LeadRecord>>;
  get: (id: string) => Promise<LeadRecord | null>;
  create: (input: Omit<LeadRecord, 'id' | 'createdAt' | 'orgId'>) => Promise<LeadRecord>;
  update: (
    id: string,
    input: Partial<Omit<LeadRecord, 'id' | 'createdAt' | 'orgId'>>,
  ) => Promise<LeadRecord>;
  updateStage: (id: string, stage: LeadRecord['stage']) => Promise<LeadRecord>;
  delete: (id: string) => Promise<void>;
};

export type StaffListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  department?: string;
  employmentType?: string;
};

export type StaffHandlers = {
  list: (params: StaffListParams) => Promise<ListResponse<StaffRecord>>;
  get: (id: string) => Promise<StaffRecord | null>;
  create: (input: Omit<StaffRecord, 'id' | 'createdAt' | 'orgId'>) => Promise<StaffRecord>;
  update: (
    id: string,
    input: Partial<Omit<StaffRecord, 'id' | 'createdAt' | 'orgId'>>,
  ) => Promise<StaffRecord>;
  delete: (id: string) => Promise<void>;
};

export type PurchasingListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  requestedBy?: string;
};

export type PurchasingHandlers = {
  list: (params: PurchasingListParams) => Promise<ListResponse<PurchaseOrderRecord>>;
  get: (id: string) => Promise<PurchaseOrderRecord | null>;
  create: (
    input: Omit<PurchaseOrderRecord, 'id' | 'poNumber' | 'createdAt' | 'orgId'>,
  ) => Promise<PurchaseOrderRecord>;
  update: (
    id: string,
    input: Partial<Omit<PurchaseOrderRecord, 'id' | 'poNumber' | 'createdAt' | 'orgId'>>,
  ) => Promise<PurchaseOrderRecord>;
  delete: (id: string) => Promise<void>;
};

export type DemoApiRegistry = {
  cases: CasesHandlers;
  caseChecklists: CaseChecklistsHandlers;
  clients: ClientsHandlers;
  contacts: ContactsHandlers;
  contracts: ContractsHandlers;
  incidents: IncidentsHandlers;
  invoices: InvoicesHandlers;
  leads: LeadsHandlers;
  orders: OrdersHandlers;
  organizations: OrganizationsHandlers;
  parties: PartiesHandlers;
  products: ProductsHandlers;
  projects: ProjectsHandlers;
  purchasing: PurchasingHandlers;
  staff: StaffHandlers;
  users: UsersHandlers;
  vendors: VendorsHandlers;
};
