import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

import { ApiProvider } from '@/api/ApiProvider';
import { createConfiguredApiRegistry } from '@/api/apiRegistryConfig';
import type { DemoApiRegistry } from '@/api/demo-client';
import { buildCaseChecklistsDemoHandlers } from '@/api/demo-handlers/case-checklists';
import { buildCasesDemoHandlers } from '@/api/demo-handlers/cases';
import { buildClientsDemoHandlers } from '@/api/demo-handlers/clients';
import { buildContactsDemoHandlers } from '@/api/demo-handlers/contacts';
import { buildContractsDemoHandlers } from '@/api/demo-handlers/contracts';
import { buildIncidentsDemoHandlers } from '@/api/demo-handlers/incidents';
import { buildInvoicesDemoHandlers } from '@/api/demo-handlers/invoices';
import { buildLeadsDemoHandlers } from '@/api/demo-handlers/leads';
import { buildOrdersDemoHandlers } from '@/api/demo-handlers/orders';
import { buildOrganizationsDemoHandlers } from '@/api/demo-handlers/organizations';
import { buildPartiesDemoHandlers } from '@/api/demo-handlers/parties';
import { buildProductsDemoHandlers } from '@/api/demo-handlers/products';
import { buildProjectsDemoHandlers } from '@/api/demo-handlers/projects';
import { buildPurchasingDemoHandlers } from '@/api/demo-handlers/purchasing';
import { buildStaffDemoHandlers } from '@/api/demo-handlers/staff';
import { buildUsersDemoHandlers } from '@/api/demo-handlers/users';
import { buildVendorsDemoHandlers } from '@/api/demo-handlers/vendors';
import { withPermissionedDemoApiRegistry } from '@/lib/apiPermissions';
import { ORG_APEX_ID, ORG_DEMO_ID, ORG_KUNZ_ID, getOrgProfile } from '@/lib/org-profiles/profiles';
import { permissionSubjectFor } from '@/lib/permissions';
import { getWindowStorage, safeStorageSet } from '@/lib/storage/safeStorage';

import {
  KUNZ_CASE_CHECKLISTS,
  KUNZ_CASES,
  KUNZ_CLIENTS,
  KUNZ_CONTACTS,
  KUNZ_ORDERS,
  KUNZ_PARTIES,
  KUNZ_PRODUCTS,
  KUNZ_PROJECTS,
  KUNZ_TASKS,
  KUNZ_USERS,
} from './demo-data/kunz-seed';

export type {
  CaseChecklistItem,
  CaseRecord,
  CaseStage,
  CaseType,
  ClientRecord,
  ContactRecord,
  LeadRecord,
  OrderRecord,
  OrgMembershipRecord,
  OrgPlan,
  OrgScoped,
  OrgStatus,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  PurchaseOrderRecord,
  StaffRecord,
  TaskRecord,
  UserRecord,
  VendorRecord,
} from './demo-data/records';

import type {
  CaseChecklistItem,
  CaseRecord,
  ClientRecord,
  ContactRecord,
  LeadRecord,
  OrderRecord,
  OrgMembershipRecord,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  PurchaseOrderRecord,
  StaffRecord,
  TaskRecord,
  UserRecord,
  VendorRecord,
  OrgScoped,
} from './demo-data/records';

export type PlatformUserRow = UserRecord & {
  organizationNames: string;
  organizationCount: number;
};

export type OrderLineRecord = {
  id: string;
  orderId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
};

export type InvoiceRecord = OrgScoped & {
  id: string;
  invoiceNumber: string;
  clientName: string;
  orderNumber: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  amount: string;
  issuedAt: string;
  dueAt: string;
};

export type IncidentRecord = OrgScoped & {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved';
  service: string;
  assignee: string;
  reportedAt: string;
  impact: string;
};

export type ContractRecord = OrgScoped & {
  id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  status: 'Draft' | 'Active' | 'Expiring' | 'Terminated';
  value: string;
  startDate: string;
  endDate: string;
  owner: string;
  renewalNoticeDays: number;
};

type CreateUserInput = Omit<UserRecord, 'id'>;
type UpdateUserInput = Partial<Omit<UserRecord, 'id'>>;
type CreateClientInput = Omit<ClientRecord, 'id' | 'createdAt'>;
type UpdateClientInput = Partial<Omit<ClientRecord, 'id' | 'createdAt'>>;
type CreateProductInput = Omit<ProductRecord, 'id'>;
type UpdateProductInput = Partial<Omit<ProductRecord, 'id'>>;
type CreateCaseInput = Omit<CaseRecord, 'id' | 'caseNumber' | 'openedAt' | 'slaStatus'>;
type UpdateCaseInput = Partial<
  Omit<CaseRecord, 'id' | 'caseNumber' | 'openedAt' | 'slaStatus' | 'clientId'>
>;
type UpdateInvoiceInput = Partial<Omit<InvoiceRecord, 'id'>>;
type UpdateContractInput = Partial<Omit<ContractRecord, 'id'>>;
type UpdateIncidentInput = Partial<Omit<IncidentRecord, 'id'>>;
type UpdateProjectInput = Partial<Omit<ProjectRecord, 'id'>>;
type CreateOrganizationInput = Omit<OrganizationRecord, 'id' | 'memberCount' | 'createdAt'>;
type CreatePartyInput = Omit<PartyRecord, 'id'>;
type CreateChecklistItemInput = Omit<CaseChecklistItem, 'id' | 'done'>;

type DemoDataContextValue = {
  users: UserRecord[];
  createUser: (input: CreateUserInput) => UserRecord;
  updateUser: (userId: string, input: UpdateUserInput) => UserRecord | null;
  organizations: OrganizationRecord[];
  orgMemberships: OrgMembershipRecord[];
  activeOrgId: string;
  setActiveOrgId: (orgId: string) => void;
  currentUser: UserRecord;
  activeMembership: OrgMembershipRecord | null;
  activeOrganization: OrganizationRecord;
  createOrganization: (input: CreateOrganizationInput) => OrganizationRecord;
  getOrgMembers: (orgId: string) => Array<OrgMembershipRecord & { user: UserRecord }>;
  getUserOrganizations: (userId: string) => OrganizationRecord[];
  platformUsers: PlatformUserRow[];
  clients: ClientRecord[];
  createClient: (input: CreateClientInput) => ClientRecord;
  updateClient: (clientId: string, input: UpdateClientInput) => ClientRecord | null;
  orders: OrderRecord[];
  orderLines: OrderLineRecord[];
  invoices: InvoiceRecord[];
  updateInvoice: (invoiceId: string, input: UpdateInvoiceInput) => InvoiceRecord | null;
  products: ProductRecord[];
  createProduct: (input: CreateProductInput) => ProductRecord;
  updateProduct: (productId: string, input: UpdateProductInput) => ProductRecord | null;
  projects: ProjectRecord[];
  updateProject: (projectId: string, input: UpdateProjectInput) => ProjectRecord | null;
  tasks: TaskRecord[];
  parties: PartyRecord[];
  createParty: (input: CreatePartyInput) => PartyRecord;
  cases: CaseRecord[];
  createCase: (input: CreateCaseInput) => CaseRecord;
  updateCase: (caseId: string, input: UpdateCaseInput) => CaseRecord | null;
  updateCaseStage: (caseId: string, stage: CaseRecord['stage']) => void;
  caseChecklists: CaseChecklistItem[];
  toggleChecklistItem: (id: string, done: boolean) => void;
  createChecklistItem: (input: CreateChecklistItemInput) => CaseChecklistItem;
  incidents: IncidentRecord[];
  updateIncident: (incidentId: string, input: UpdateIncidentInput) => IncidentRecord | null;
  contracts: ContractRecord[];
  updateContract: (contractId: string, input: UpdateContractInput) => ContractRecord | null;
  removeUsers: (ids: string[]) => void;
  removeClients: (ids: string[]) => void;
  removeProducts: (ids: string[]) => void;
  removeCases: (ids: string[]) => void;
  removeInvoices: (ids: string[]) => void;
  removeOrders: (ids: string[]) => void;
  removeContracts: (ids: string[]) => void;
  removeIncidents: (ids: string[]) => void;
  removeProjects: (ids: string[]) => void;
  contacts: ContactRecord[];
  vendors: VendorRecord[];
  leads: LeadRecord[];
  staff: StaffRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  /** Resolve by id across all tenants (for detail deep links). */
  findClientById: (id: string | undefined) => ClientRecord | null;
  findCaseById: (id: string | undefined) => CaseRecord | null;
  findProductById: (id: string | undefined) => ProductRecord | null;
  findOrderById: (id: string | undefined) => OrderRecord | null;
  findProjectById: (id: string | undefined) => ProjectRecord | null;
  findInvoiceById: (id: string | undefined) => InvoiceRecord | null;
  findContractById: (id: string | undefined) => ContractRecord | null;
  findIncidentById: (id: string | undefined) => IncidentRecord | null;
  findUserById: (id: string | undefined) => UserRecord | null;
};

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

const ORG_SCOPE_ALIASES: Record<string, string> = {
  [ORG_DEMO_ID]: ORG_APEX_ID,
};

function resolveActiveOrgId(orgId: string) {
  return ORG_SCOPE_ALIASES[orgId] ?? orgId;
}

function tagOrg<T extends OrgScoped>(rows: T[], orgId: string): T[] {
  return rows.map((row) => ({ ...row, orgId: row.orgId ?? orgId }));
}

function filterForOrg<T extends OrgScoped>(rows: T[], orgId: string): T[] {
  const scopedOrgId = resolveActiveOrgId(orgId);
  return rows.filter((row) => {
    const rowOrgId = row.orgId ?? ORG_APEX_ID;
    if (orgId === ORG_DEMO_ID) {
      return rowOrgId === ORG_APEX_ID || rowOrgId === ORG_DEMO_ID;
    }
    return rowOrgId === scopedOrgId;
  });
}

const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'cli_1001',
    name: 'Apex Technologies GmbH',
    type: 'company',
    industry: 'Technology',
    status: 'active',
    email: 'contact@apex-tech.test',
    phone: '+43 1 234 5678',
    website: 'https://apex-tech.test',
    country: 'AT',
    city: 'Vienna',
    tags: ['enterprise', 'priority'],
    notes: 'Key strategic account. Renewal due Q1.',
    annualRevenue: '480000',
    contractStart: '2024-01-15',
    contractEnd: '2025-01-14',
    accountManager: 'Anna Hofer',
    createdAt: '2024-01-10',
    customFields: {
      vipTier: 'gold',
      referralSource: 'Partner summit 2023',
      newsletterOptIn: true,
      internalNotes: 'Executive sponsor engaged. Review expansion in Q4.',
    },
  },
  {
    id: 'cli_1002',
    name: 'Bruckner Consulting',
    type: 'company',
    industry: 'Consulting',
    status: 'active',
    email: 'office@bruckner.test',
    phone: '+43 732 987 654',
    website: 'https://bruckner.test',
    country: 'AT',
    city: 'Linz',
    tags: ['consulting', 'mid-market'],
    notes: '',
    annualRevenue: '120000',
    contractStart: '2024-03-01',
    contractEnd: '2025-02-28',
    accountManager: 'Markus Leitner',
    createdAt: '2024-02-20',
  },
  {
    id: 'cli_1003',
    name: 'Clara Sonnenschein',
    type: 'individual',
    industry: 'Freelance',
    status: 'prospect',
    email: 'clara@sonnenschein.test',
    phone: '+43 699 111 2233',
    website: '',
    country: 'DE',
    city: 'Munich',
    tags: ['freelance'],
    notes: 'Interested in the starter plan. Follow up next week.',
    annualRevenue: '18000',
    contractStart: '',
    contractEnd: '',
    accountManager: 'Nina Weiss',
    createdAt: '2024-05-03',
  },
  {
    id: 'cli_1004',
    name: 'Donau Logistics AG',
    type: 'company',
    industry: 'Logistics',
    status: 'inactive',
    email: 'info@donau-logistics.test',
    phone: '+43 1 555 7890',
    website: 'https://donau-logistics.test',
    country: 'AT',
    city: 'Vienna',
    tags: ['logistics', 'enterprise'],
    notes: 'Contract expired. Re-engagement campaign scheduled.',
    annualRevenue: '220000',
    contractStart: '2023-06-01',
    contractEnd: '2024-05-31',
    accountManager: 'Anna Hofer',
    createdAt: '2023-05-15',
  },
  {
    id: 'cli_1005',
    name: 'Eiger Software Ltd',
    type: 'company',
    industry: 'Technology',
    status: 'churned',
    email: 'hello@eiger.test',
    phone: '+41 44 300 1122',
    website: 'https://eiger.test',
    country: 'CH',
    city: 'Zurich',
    tags: ['saas', 'churned'],
    notes: 'Moved to competitor. Post-mortem completed.',
    annualRevenue: '95000',
    contractStart: '2023-01-01',
    contractEnd: '2023-12-31',
    accountManager: 'Markus Leitner',
    createdAt: '2022-12-01',
  },
  {
    id: 'cli_1006',
    name: 'Alpina Transport Services',
    type: 'company',
    industry: 'Logistics',
    status: 'active',
    email: 'hello@alpina-transport.test',
    phone: '+43 650 112 223',
    website: 'https://alpina-transport.test',
    country: 'AT',
    city: 'Salzburg',
    tags: ['shipping', 'growth'],
    notes: 'Expanding into international lanes next quarter.',
    annualRevenue: '156000',
    contractStart: '2024-08-01',
    contractEnd: '2025-07-31',
    accountManager: 'Markus Leitner',
    createdAt: '2024-07-01',
  },
  {
    id: 'cli_1007',
    name: 'Bergmann Maschinenbau',
    type: 'company',
    industry: 'Manufacturing',
    status: 'prospect',
    email: 'sales@bergmann-mbg.test',
    phone: '+43 732 998 2211',
    website: 'https://bergmann-mbg.test',
    country: 'DE',
    city: 'Regensburg',
    tags: ['prospect', 'enterprise'],
    notes: 'Interested in replacing legacy ERP. Technical review pending.',
    annualRevenue: '0',
    contractStart: '',
    contractEnd: '',
    accountManager: 'Anna Hofer',
    createdAt: '2024-11-05',
  },
  {
    id: 'cli_1008',
    name: 'Hinterland Pharma AG',
    type: 'company',
    industry: 'Pharmaceuticals',
    status: 'active',
    email: 'contact@hinterland-pharma.test',
    phone: '+43 316 400 909',
    website: 'https://hinterland-pharma.test',
    country: 'AT',
    city: 'Leoben',
    tags: ['regulated', 'growth'],
    notes: 'Data residency and audit requirements are a priority.',
    annualRevenue: '320000',
    contractStart: '2024-02-10',
    contractEnd: '2025-02-09',
    accountManager: 'Nina Weiss',
    createdAt: '2024-02-01',
  },
  {
    id: 'cli_1009',
    name: 'Rosenberg Hotels Group',
    type: 'company',
    industry: 'Hospitality',
    status: 'inactive',
    email: 'ops@rosenberg-hotels.test',
    phone: '+43 1 444 2211',
    website: '',
    country: 'AT',
    city: 'Vienna',
    tags: ['hospitality', 'inactive'],
    notes: 'Renewal paused pending board decision.',
    annualRevenue: '95000',
    contractStart: '2023-10-01',
    contractEnd: '2024-09-30',
    accountManager: 'Anna Hofer',
    createdAt: '2023-09-20',
  },
  {
    id: 'cli_1010',
    name: 'Müller Design Studio',
    type: 'company',
    industry: 'Creative',
    status: 'churned',
    email: 'hello@mueller-design.test',
    phone: '+43 664 778 221',
    website: 'https://mueller-design.test',
    country: 'DE',
    city: 'Munich',
    tags: ['creative', 'churned'],
    notes: 'Moved to smaller incumbent package.',
    annualRevenue: '42000',
    contractStart: '2023-05-01',
    contractEnd: '2024-04-30',
    accountManager: 'Markus Leitner',
    createdAt: '2023-04-10',
  },
  {
    id: 'cli_1011',
    name: 'Sonnenkraft AG',
    type: 'company',
    industry: 'Energy',
    status: 'active',
    email: 'finance@sonnenkraft.test',
    phone: '+43 1 890 700',
    website: '',
    country: 'AT',
    city: 'Linz',
    tags: ['energy', 'enterprise'],
    notes: 'Multi-site rollout is being phased by department.',
    annualRevenue: '540000',
    contractStart: '2024-01-05',
    contractEnd: '2025-01-04',
    accountManager: 'Nina Weiss',
    createdAt: '2024-01-02',
  },
];

const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ord_2001',
    orderNumber: 'SO-2024-1042',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Confirmed',
    total: '28450',
    orderDate: '2024-11-02',
    dueDate: '2024-11-30',
    owner: 'Anna Hofer',
    lineCount: 4,
  },
  {
    id: 'ord_2002',
    orderNumber: 'SO-2024-1088',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    status: 'Shipped',
    total: '6200',
    orderDate: '2024-11-18',
    dueDate: '2024-12-05',
    owner: 'Markus Leitner',
    lineCount: 2,
  },
  {
    id: 'ord_2003',
    orderNumber: 'SO-2024-1101',
    clientId: 'cli_1004',
    clientName: 'Donau Logistics AG',
    status: 'Draft',
    total: '15800',
    orderDate: '2024-12-01',
    dueDate: '2024-12-20',
    owner: 'Nina Weiss',
    lineCount: 3,
  },
  {
    id: 'ord_2004',
    orderNumber: 'SO-2024-0998',
    clientId: 'cli_1003',
    clientName: 'Clara Sonnenschein',
    status: 'Delivered',
    total: '890',
    orderDate: '2024-09-14',
    dueDate: '2024-09-28',
    owner: 'Anna Hofer',
    lineCount: 1,
  },
  {
    id: 'ord_2005',
    orderNumber: 'SO-2024-1150',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Shipped',
    total: '12900',
    orderDate: '2024-12-10',
    dueDate: '2024-12-20',
    owner: 'Anna Hofer',
    lineCount: 3,
  },
  {
    id: 'ord_2006',
    orderNumber: 'SO-2024-1165',
    clientId: 'cli_1006',
    clientName: 'Alpina Transport Services',
    status: 'Draft',
    total: '6400',
    orderDate: '2024-12-12',
    dueDate: '2025-01-05',
    owner: 'Markus Leitner',
    lineCount: 2,
  },
  {
    id: 'ord_2007',
    orderNumber: 'SO-2024-1172',
    clientId: 'cli_1008',
    clientName: 'Hinterland Pharma AG',
    status: 'Confirmed',
    total: '27200',
    orderDate: '2024-12-15',
    dueDate: '2025-01-15',
    owner: 'Nina Weiss',
    lineCount: 4,
  },
  {
    id: 'ord_2008',
    orderNumber: 'SO-2024-1178',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    status: 'Delivered',
    total: '9300',
    orderDate: '2024-11-28',
    dueDate: '2024-12-12',
    owner: 'Markus Leitner',
    lineCount: 2,
  },
  {
    id: 'ord_2009',
    orderNumber: 'SO-2024-1186',
    clientId: 'cli_1011',
    clientName: 'Sonnenkraft AG',
    status: 'Cancelled',
    total: '15200',
    orderDate: '2024-11-30',
    dueDate: '2024-12-31',
    owner: 'Anna Hofer',
    lineCount: 3,
  },
  {
    id: 'ord_2010',
    orderNumber: 'SO-2024-1191',
    clientId: 'cli_1009',
    clientName: 'Rosenberg Hotels Group',
    status: 'Draft',
    total: '5600',
    orderDate: '2024-12-01',
    dueDate: '2025-01-01',
    owner: 'Nina Weiss',
    lineCount: 2,
  },
  {
    id: 'ord_2011',
    orderNumber: 'SO-2024-1202',
    clientId: 'cli_1010',
    clientName: 'Müller Design Studio',
    status: 'Cancelled',
    total: '3100',
    orderDate: '2024-10-10',
    dueDate: '2024-10-24',
    owner: 'Anna Hofer',
    lineCount: 1,
  },
  {
    id: 'ord_2012',
    orderNumber: 'SO-2024-1208',
    clientId: 'cli_1008',
    clientName: 'Hinterland Pharma AG',
    status: 'Shipped',
    total: '15400',
    orderDate: '2024-12-10',
    dueDate: '2025-01-20',
    owner: 'Nina Weiss',
    lineCount: 2,
  },
  {
    id: 'ord_2013',
    orderNumber: 'SO-2024-1210',
    clientId: 'cli_1006',
    clientName: 'Alpina Transport Services',
    status: 'Confirmed',
    total: '8100',
    orderDate: '2024-12-11',
    dueDate: '2025-01-08',
    owner: 'Markus Leitner',
    lineCount: 2,
  },
  {
    id: 'ord_2014',
    orderNumber: 'SO-2024-1214',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Draft',
    total: '9800',
    orderDate: '2024-12-12',
    dueDate: '2025-01-16',
    owner: 'Anna Hofer',
    lineCount: 1,
  },
];

const INITIAL_ORDER_LINES: OrderLineRecord[] = [
  {
    id: 'ol_1',
    orderId: 'ord_2001',
    productName: 'Enterprise License',
    sku: 'LIC-ENT-01',
    quantity: 1,
    unitPrice: '22000',
  },
  {
    id: 'ol_2',
    orderId: 'ord_2001',
    productName: 'Onboarding Package',
    sku: 'SVC-ONB-12',
    quantity: 1,
    unitPrice: '4500',
  },
  {
    id: 'ol_3',
    orderId: 'ord_2001',
    productName: 'Support Add-on',
    sku: 'SVC-SUP-Y1',
    quantity: 1,
    unitPrice: '1950',
  },
  {
    id: 'ol_4',
    orderId: 'ord_2002',
    productName: 'Consulting Days',
    sku: 'SVC-CON-10',
    quantity: 4,
    unitPrice: '1550',
  },
  {
    id: 'ol_5',
    orderId: 'ord_2005',
    productName: 'Enterprise License',
    sku: 'LIC-ENT-01',
    quantity: 2,
    unitPrice: '22000',
  },
  {
    id: 'ol_6',
    orderId: 'ord_2005',
    productName: 'Monitoring Bundle',
    sku: 'SVC-MON-03',
    quantity: 1,
    unitPrice: '4500',
  },
  {
    id: 'ol_7',
    orderId: 'ord_2005',
    productName: 'API Extensions',
    sku: 'SVC-API-01',
    quantity: 2,
    unitPrice: '1100',
  },
  {
    id: 'ol_8',
    orderId: 'ord_2006',
    productName: 'Professional Services',
    sku: 'SVC-PS-24',
    quantity: 16,
    unitPrice: '200',
  },
  {
    id: 'ol_9',
    orderId: 'ord_2006',
    productName: 'Onboarding Package',
    sku: 'SVC-ONB-12',
    quantity: 1,
    unitPrice: '4500',
  },
  {
    id: 'ol_10',
    orderId: 'ord_2007',
    productName: 'Compliance Module',
    sku: 'LIC-COM-01',
    quantity: 1,
    unitPrice: '18000',
  },
  {
    id: 'ol_11',
    orderId: 'ord_2007',
    productName: 'GxP Reporting Add-on',
    sku: 'SVC-GXP-02',
    quantity: 1,
    unitPrice: '9200',
  },
  {
    id: 'ol_12',
    orderId: 'ord_2007',
    productName: 'Support Add-on',
    sku: 'SVC-SUP-Y1',
    quantity: 6,
    unitPrice: '1950',
  },
  {
    id: 'ol_13',
    orderId: 'ord_2008',
    productName: 'Consulting Days',
    sku: 'SVC-CON-10',
    quantity: 3,
    unitPrice: '1550',
  },
  {
    id: 'ol_14',
    orderId: 'ord_2008',
    productName: 'Edge Router Pro',
    sku: 'HW-RTR-05',
    quantity: 4,
    unitPrice: '1290',
  },
  {
    id: 'ol_15',
    orderId: 'ord_2009',
    productName: 'Data Migration',
    sku: 'SVC-DM-03',
    quantity: 2,
    unitPrice: '7600',
  },
  {
    id: 'ol_16',
    orderId: 'ord_2010',
    productName: 'License Upgrade',
    sku: 'LIC-UPG-02',
    quantity: 25,
    unitPrice: '550',
  },
  {
    id: 'ol_17',
    orderId: 'ord_2011',
    productName: 'Standard License',
    sku: 'LIC-STD-01',
    quantity: 1,
    unitPrice: '8900',
  },
  {
    id: 'ol_18',
    orderId: 'ord_2003',
    productName: 'Logistics Integration Pack',
    sku: 'SVC-LGP-01',
    quantity: 2,
    unitPrice: '5200',
  },
  {
    id: 'ol_19',
    orderId: 'ord_2003',
    productName: 'Implementation Support',
    sku: 'SVC-IMP-02',
    quantity: 1,
    unitPrice: '4200',
  },
  {
    id: 'ol_20',
    orderId: 'ord_2003',
    productName: 'Monitoring Add-on',
    sku: 'SVC-MON-03',
    quantity: 1,
    unitPrice: '2400',
  },
  {
    id: 'ol_21',
    orderId: 'ord_2004',
    productName: 'Freelance Cleanup Support',
    sku: 'SVC-CNS-01',
    quantity: 1,
    unitPrice: '890',
  },
  {
    id: 'ol_22',
    orderId: 'ord_2012',
    productName: 'Data Pipeline Service',
    sku: 'SVC-DPS-01',
    quantity: 2,
    unitPrice: '5000',
  },
  {
    id: 'ol_23',
    orderId: 'ord_2012',
    productName: 'Reporting Add-on',
    sku: 'SVC-RPT-01',
    quantity: 1,
    unitPrice: '5400',
  },
  {
    id: 'ol_24',
    orderId: 'ord_2013',
    productName: 'Onboarding Package',
    sku: 'SVC-ONB-12',
    quantity: 1,
    unitPrice: '4500',
  },
  {
    id: 'ol_25',
    orderId: 'ord_2013',
    productName: 'API Enablement Package',
    sku: 'SVC-API-01',
    quantity: 2,
    unitPrice: '1800',
  },
  {
    id: 'ol_26',
    orderId: 'ord_2014',
    productName: 'Compliance Template Pack',
    sku: 'SVC-CMP-01',
    quantity: 1,
    unitPrice: '9800',
  },
  {
    id: 'ol_27',
    orderId: 'ord_2001',
    productName: 'Quarterly optimization workshop',
    sku: 'SVC-OPT-01',
    quantity: 1,
    unitPrice: '0',
  },
  {
    id: 'ol_28',
    orderId: 'ord_2002',
    productName: 'Contracted support buffer',
    sku: 'SVC-SUP-BUF',
    quantity: 1,
    unitPrice: '0',
  },
  {
    id: 'ol_29',
    orderId: 'ord_2007',
    productName: 'Custom deployment support',
    sku: 'SVC-DEP-01',
    quantity: 1,
    unitPrice: '0',
  },
  {
    id: 'ol_30',
    orderId: 'ord_2009',
    productName: 'Data mapping correction',
    sku: 'SVC-DAT-01',
    quantity: 1,
    unitPrice: '0',
  },
  {
    id: 'ol_31',
    orderId: 'ord_2009',
    productName: 'Post-migration QA',
    sku: 'SVC-QA-01',
    quantity: 1,
    unitPrice: '0',
  },
  {
    id: 'ol_32',
    orderId: 'ord_2010',
    productName: 'Renewal onboarding support',
    sku: 'SVC-ONB-13',
    quantity: 1,
    unitPrice: '0',
  },
];

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv_3001',
    invoiceNumber: 'INV-2024-8821',
    clientName: 'Apex Technologies GmbH',
    orderNumber: 'SO-2024-1042',
    status: 'Sent',
    amount: '28450',
    issuedAt: '2024-11-05',
    dueAt: '2024-11-30',
  },
  {
    id: 'inv_3002',
    invoiceNumber: 'INV-2024-8904',
    clientName: 'Bruckner Consulting',
    orderNumber: 'SO-2024-1088',
    status: 'Paid',
    amount: '6200',
    issuedAt: '2024-11-20',
    dueAt: '2024-12-05',
  },
  {
    id: 'inv_3003',
    invoiceNumber: 'INV-2024-9012',
    clientName: 'Donau Logistics AG',
    orderNumber: 'SO-2024-1101',
    status: 'Overdue',
    amount: '15800',
    issuedAt: '2024-10-01',
    dueAt: '2024-10-31',
  },
  {
    id: 'inv_3004',
    invoiceNumber: 'INV-2024-8650',
    clientName: 'Clara Sonnenschein',
    orderNumber: 'SO-2024-0998',
    status: 'Paid',
    amount: '890',
    issuedAt: '2024-09-15',
    dueAt: '2024-09-28',
  },
  {
    id: 'inv_3005',
    invoiceNumber: 'INV-2024-9101',
    clientName: 'Apex Technologies GmbH',
    orderNumber: 'SO-2024-1150',
    status: 'Sent',
    amount: '12900',
    issuedAt: '2024-12-11',
    dueAt: '2024-12-30',
  },
  {
    id: 'inv_3006',
    invoiceNumber: 'INV-2024-9156',
    clientName: 'Alpina Transport Services',
    orderNumber: 'SO-2024-1165',
    status: 'Draft',
    amount: '6400',
    issuedAt: '2024-12-12',
    dueAt: '2025-01-05',
  },
  {
    id: 'inv_3007',
    invoiceNumber: 'INV-2024-9222',
    clientName: 'Hinterland Pharma AG',
    orderNumber: 'SO-2024-1172',
    status: 'Draft',
    amount: '27200',
    issuedAt: '2024-12-16',
    dueAt: '2025-01-15',
  },
  {
    id: 'inv_3008',
    invoiceNumber: 'INV-2024-9238',
    clientName: 'Bruckner Consulting',
    orderNumber: 'SO-2024-1178',
    status: 'Paid',
    amount: '9300',
    issuedAt: '2024-11-29',
    dueAt: '2024-12-12',
  },
  {
    id: 'inv_3009',
    invoiceNumber: 'INV-2024-9310',
    clientName: 'Sonnenkraft AG',
    orderNumber: 'SO-2024-1186',
    status: 'Cancelled',
    amount: '15200',
    issuedAt: '2024-12-02',
    dueAt: '2025-01-01',
  },
  {
    id: 'inv_3010',
    invoiceNumber: 'INV-2024-9355',
    clientName: 'Hinterland Pharma AG',
    orderNumber: 'SO-2024-1208',
    status: 'Draft',
    amount: '15400',
    issuedAt: '2024-12-12',
    dueAt: '2025-02-01',
  },
  {
    id: 'inv_3011',
    invoiceNumber: 'INV-2024-9362',
    clientName: 'Alpina Transport Services',
    orderNumber: 'SO-2024-1210',
    status: 'Draft',
    amount: '8100',
    issuedAt: '2024-12-13',
    dueAt: '2025-01-31',
  },
  {
    id: 'inv_3012',
    invoiceNumber: 'INV-2024-9364',
    clientName: 'Apex Technologies GmbH',
    orderNumber: 'SO-2024-1214',
    status: 'Sent',
    amount: '9800',
    issuedAt: '2024-12-14',
    dueAt: '2025-01-22',
  },
  {
    id: 'inv_3013',
    invoiceNumber: 'INV-2024-9368',
    clientName: 'Rosenberg Hotels Group',
    orderNumber: 'SO-2024-1191',
    status: 'Draft',
    amount: '5600',
    issuedAt: '2024-12-12',
    dueAt: '2025-01-20',
  },
  {
    id: 'inv_3014',
    invoiceNumber: 'INV-2024-9370',
    clientName: 'Müller Design Studio',
    orderNumber: 'SO-2024-1202',
    status: 'Draft',
    amount: '3100',
    issuedAt: '2024-12-13',
    dueAt: '2024-12-31',
  },
];

const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 'prd_4001',
    sku: 'LIC-ENT-01',
    name: 'Enterprise License',
    category: 'Licenses',
    status: 'Active',
    currency: 'EUR',
    price: '22000',
    stock: 999,
    unit: 'seat',
  },
  {
    id: 'prd_4002',
    sku: 'SVC-ONB-12',
    name: 'Onboarding Package',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '4500',
    stock: 0,
    unit: 'package',
  },
  {
    id: 'prd_4003',
    sku: 'SVC-CON-10',
    name: 'Consulting Days',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '1550',
    stock: 0,
    unit: 'day',
  },
  {
    id: 'prd_4004',
    sku: 'HW-RTR-05',
    name: 'Edge Router Pro',
    category: 'Hardware',
    status: 'Active',
    currency: 'EUR',
    price: '1290',
    stock: 42,
    unit: 'unit',
  },
  {
    id: 'prd_4005',
    sku: 'LIC-STD-01',
    name: 'Standard License',
    category: 'Licenses',
    status: 'Discontinued',
    currency: 'EUR',
    price: '8900',
    stock: 0,
    unit: 'seat',
  },
  {
    id: 'prd_4006',
    sku: 'SVC-DM-03',
    name: 'Data Migration',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '7600',
    stock: 0,
    unit: 'project',
  },
  {
    id: 'prd_4007',
    sku: 'SVC-GXP-02',
    name: 'GxP Reporting Add-on',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '9200',
    stock: 0,
    unit: 'project',
  },
  {
    id: 'prd_4008',
    sku: 'SVC-MON-03',
    name: 'Monitoring Bundle',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '4500',
    stock: 0,
    unit: 'package',
  },
  {
    id: 'prd_4009',
    sku: 'LIC-UPG-02',
    name: 'License Upgrade',
    category: 'Licenses',
    status: 'Active',
    currency: 'EUR',
    price: '550',
    stock: 999,
    unit: 'seat',
  },
  {
    id: 'prd_4010',
    sku: 'SVC-PS-24',
    name: 'Professional Services',
    category: 'Services',
    status: 'Active',
    currency: 'EUR',
    price: '200',
    stock: 0,
    unit: 'hour',
  },
  {
    id: 'prd_4011',
    sku: 'SVC-API-01',
    name: 'API Extensions',
    category: 'Services',
    status: 'Draft',
    currency: 'EUR',
    price: '1100',
    stock: 0,
    unit: 'package',
  },
];

const INITIAL_PROJECTS: ProjectRecord[] = [
  {
    id: 'prj_5001',
    name: 'Apex ERP Rollout',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    manager: 'Anna Hofer',
    startDate: '2024-06-01',
    endDate: '2025-03-31',
    budget: '120000',
    completion: 68,
  },
  {
    id: 'prj_5002',
    name: 'Bruckner Portal Refresh',
    clientName: 'Bruckner Consulting',
    status: 'Planning',
    manager: 'Markus Leitner',
    startDate: '2025-01-15',
    endDate: '2025-06-30',
    budget: '45000',
    completion: 12,
  },
  {
    id: 'prj_5003',
    name: 'Donau Warehouse Integration',
    clientName: 'Donau Logistics AG',
    status: 'On hold',
    manager: 'Nina Weiss',
    startDate: '2024-03-01',
    endDate: '2024-12-15',
    budget: '88000',
    completion: 41,
  },
  {
    id: 'prj_5004',
    name: 'Alpina Transport Gateway',
    clientName: 'Alpina Transport Services',
    status: 'Planning',
    manager: 'Markus Leitner',
    startDate: '2025-01-20',
    endDate: '2025-06-20',
    budget: '36000',
    completion: 5,
  },
  {
    id: 'prj_5005',
    name: 'Hinterland Compliance Program',
    clientName: 'Hinterland Pharma AG',
    status: 'Active',
    manager: 'Nina Weiss',
    startDate: '2024-10-10',
    endDate: '2025-04-30',
    budget: '132000',
    completion: 48,
  },
  {
    id: 'prj_5006',
    name: 'Sonnenkraft Data Consolidation',
    clientName: 'Sonnenkraft AG',
    status: 'On hold',
    manager: 'Anna Hofer',
    startDate: '2024-09-01',
    endDate: '2025-03-30',
    budget: '62000',
    completion: 22,
  },
  {
    id: 'prj_5007',
    name: 'Apex Customer Portal Refresh',
    clientName: 'Apex Technologies GmbH',
    status: 'Planning',
    manager: 'Markus Leitner',
    startDate: '2025-02-01',
    endDate: '2025-05-15',
    budget: '29000',
    completion: 0,
  },
  {
    id: 'prj_5008',
    name: 'Bruckner Analytics Expansion',
    clientName: 'Bruckner Consulting',
    status: 'Active',
    manager: 'Anna Hofer',
    startDate: '2024-12-01',
    endDate: '2025-07-31',
    budget: '54000',
    completion: 18,
  },
];

const INITIAL_CASES: CaseRecord[] = [
  {
    id: 'case_6001',
    caseNumber: 'CASE-2024-0892',
    title: 'Billing dispute — duplicate invoice',
    type: 'Billing',
    stage: 'Investigation',
    priority: 'High',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    assignee: 'Markus Leitner',
    openedAt: '2024-11-28',
    dueAt: '2024-12-10',
    slaStatus: 'warning',
    summary: 'Client reports duplicate charge on November invoice. Finance review in progress.',
  },
  {
    id: 'case_6002',
    caseNumber: 'CASE-2024-0901',
    title: 'Contract amendment — liability clause',
    type: 'Legal',
    stage: 'Intake',
    priority: 'Normal',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    assignee: 'Anna Hofer',
    openedAt: '2024-12-02',
    dueAt: '2024-12-20',
    slaStatus: 'ok',
    summary: 'Legal team requested updated liability wording before renewal.',
  },
  {
    id: 'case_6003',
    caseNumber: 'CASE-2024-0755',
    title: 'API outage — integration failures',
    type: 'Support',
    stage: 'Resolution',
    priority: 'Critical',
    clientId: 'cli_1004',
    clientName: 'Donau Logistics AG',
    assignee: 'Nina Weiss',
    openedAt: '2024-11-15',
    dueAt: '2024-11-22',
    slaStatus: 'breach',
    summary: 'Webhook delivery failures since maintenance window. Hotfix deployed, monitoring.',
  },
  {
    id: 'case_6004',
    caseNumber: 'CASE-2024-0910',
    title: 'Enterprise onboarding — workspace setup',
    type: 'Onboarding',
    stage: 'Intake',
    priority: 'Normal',
    clientId: 'cli_1003',
    clientName: 'Clara Sonnenschein',
    assignee: 'Anna Hofer',
    openedAt: '2024-12-05',
    dueAt: '2024-12-18',
    slaStatus: 'ok',
    summary: 'New solo account setup, SSO deferred to phase 2.',
  },
  {
    id: 'case_6005',
    caseNumber: 'CASE-2024-0612',
    title: 'Data export request (GDPR)',
    type: 'Legal',
    stage: 'Closed',
    priority: 'High',
    clientId: 'cli_1005',
    clientName: 'Eiger Software Ltd',
    assignee: 'Markus Leitner',
    openedAt: '2024-08-10',
    dueAt: '2024-09-10',
    slaStatus: 'ok',
    summary: 'Subject access request fulfilled and confirmed by client.',
  },
  {
    id: 'case_6006',
    caseNumber: 'CASE-2024-0950',
    title: 'License entitlement mismatch',
    type: 'Billing',
    stage: 'Investigation',
    priority: 'Normal',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    assignee: 'Anna Hofer',
    openedAt: '2024-12-07',
    dueAt: '2024-12-20',
    slaStatus: 'warning',
    summary: 'Seat count does not match billed quantity for Q4 renewal.',
  },
  {
    id: 'case_6007',
    caseNumber: 'CASE-2024-0952',
    title: 'Data residency request',
    type: 'Legal',
    stage: 'Intake',
    priority: 'High',
    clientId: 'cli_1008',
    clientName: 'Hinterland Pharma AG',
    assignee: 'Nina Weiss',
    openedAt: '2024-12-08',
    dueAt: '2024-12-22',
    slaStatus: 'warning',
    summary: 'Compliance requires region-specific encryption and retention settings.',
  },
  {
    id: 'case_6008',
    caseNumber: 'CASE-2024-0956',
    title: 'Onboarding script failure',
    type: 'Onboarding',
    stage: 'Resolution',
    priority: 'Normal',
    clientId: 'cli_1006',
    clientName: 'Alpina Transport Services',
    assignee: 'Markus Leitner',
    openedAt: '2024-12-09',
    dueAt: '2024-12-19',
    slaStatus: 'warning',
    summary: 'Initial SSO provisioning failed for two admins.',
  },
  {
    id: 'case_6009',
    caseNumber: 'CASE-2024-0961',
    title: 'API key rotation policy',
    type: 'Support',
    stage: 'Closed',
    priority: 'Low',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    assignee: 'Markus Leitner',
    openedAt: '2024-11-20',
    dueAt: '2024-12-01',
    slaStatus: 'ok',
    summary: 'Completed API key rotation and added documentation for rotations.',
  },
  {
    id: 'case_6010',
    caseNumber: 'CASE-2024-0968',
    title: 'Rosenberg project access',
    type: 'Support',
    stage: 'Investigation',
    priority: 'Normal',
    clientId: 'cli_1009',
    clientName: 'Rosenberg Hotels Group',
    assignee: 'Nina Weiss',
    openedAt: '2024-11-25',
    dueAt: '2024-12-18',
    slaStatus: 'ok',
    summary: 'Project users cannot access reporting dashboards.',
  },
  {
    id: 'case_6011',
    caseNumber: 'CASE-2024-0974',
    title: 'Contract attachment upload failure',
    type: 'Support',
    stage: 'Intake',
    priority: 'Critical',
    clientId: 'cli_1003',
    clientName: 'Clara Sonnenschein',
    assignee: 'Anna Hofer',
    openedAt: '2024-12-10',
    dueAt: '2024-12-11',
    slaStatus: 'breach',
    summary: 'Attachment upload blocked in client portal for all users.',
  },
  {
    id: 'case_6012',
    caseNumber: 'CASE-2024-0979',
    title: 'Service continuity follow-up',
    type: 'Support',
    stage: 'Resolution',
    priority: 'High',
    clientId: 'cli_1011',
    clientName: 'Sonnenkraft AG',
    assignee: 'Anna Hofer',
    openedAt: '2024-12-11',
    dueAt: '2024-12-18',
    slaStatus: 'warning',
    summary: 'Client requested rollback windows after failed rollout.',
  },
];

const INITIAL_CONTACTS: ContactRecord[] = [
  {
    id: 'cnt_1001',
    orgId: ORG_APEX_ID,
    firstName: 'Michael',
    lastName: 'Gruber',
    email: 'michael.gruber@apex-tech.test',
    phone: '+43 1 234 5679',
    role: 'CFO',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    source: 'Manual',
    tags: ['finance', 'key-contact'],
    notes: 'Primary finance contact. Involved in contract renewals.',
    createdAt: '2024-02-01',
  },
  {
    id: 'cnt_1002',
    orgId: ORG_APEX_ID,
    firstName: 'Sandra',
    lastName: 'Pichler',
    email: 'sandra@apex-tech.test',
    phone: '+43 1 234 5680',
    role: 'IT Lead',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    source: 'Manual',
    tags: ['it', 'technical'],
    notes: '',
    createdAt: '2024-03-15',
  },
  {
    id: 'cnt_1003',
    orgId: ORG_APEX_ID,
    firstName: 'Thomas',
    lastName: 'Reiter',
    email: 't.reiter@donau-logistics.test',
    phone: '+43 1 555 7891',
    role: 'Procurement Manager',
    clientId: 'cli_1004',
    clientName: 'Donau Logistics AG',
    status: 'Active',
    source: 'Referral',
    tags: ['procurement'],
    notes: 'Decision maker for purchasing.',
    createdAt: '2024-01-20',
  },
  {
    id: 'cnt_1004',
    orgId: ORG_APEX_ID,
    firstName: 'Eva',
    lastName: 'Bauer',
    email: 'eva.bauer@bruckner.test',
    phone: '+43 732 987 655',
    role: 'Managing Director',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    status: 'Active',
    source: 'Manual',
    tags: ['executive'],
    notes: '',
    createdAt: '2024-04-10',
  },
  {
    id: 'cnt_1005',
    orgId: ORG_APEX_ID,
    firstName: 'Peter',
    lastName: 'Koch',
    email: 'peter.koch@eiger.test',
    phone: '+41 44 300 1123',
    role: 'CTO',
    clientId: 'cli_1005',
    clientName: 'Eiger Software Ltd',
    status: 'Inactive',
    source: 'Manual',
    tags: ['churned'],
    notes: 'No longer active — account churned.',
    createdAt: '2023-02-01',
  },
  {
    id: 'cnt_1006',
    orgId: ORG_APEX_ID,
    firstName: 'Laura',
    lastName: 'Müller',
    email: 'laura@sonnenschein.test',
    phone: '+43 699 111 2234',
    role: 'Freelance Designer',
    clientId: 'cli_1003',
    clientName: 'Clara Sonnenschein',
    status: 'Active',
    source: 'Import',
    tags: [],
    notes: '',
    createdAt: '2024-05-10',
  },
  {
    id: 'cnt_1007',
    orgId: ORG_APEX_ID,
    firstName: 'Jan',
    lastName: 'Horak',
    email: 'jan.horak@newprospect.test',
    phone: '+43 316 445 678',
    role: 'Head of Operations',
    clientId: null,
    clientName: null,
    status: 'Active',
    source: 'Referral',
    tags: ['prospect'],
    notes: 'Met at trade show. Interested in enterprise plan.',
    createdAt: '2024-11-20',
  },
  {
    id: 'cnt_1008',
    orgId: ORG_APEX_ID,
    firstName: 'Sophie',
    lastName: 'Wagner',
    email: 'sophie@nextstep.test',
    phone: '+49 89 123 4567',
    role: 'VP Sales',
    clientId: null,
    clientName: null,
    status: 'Active',
    source: 'Referral',
    tags: ['prospect', 'high-value'],
    notes: 'Responded positively to outreach campaign.',
    createdAt: '2024-12-01',
  },
  {
    id: 'cnt_1009',
    orgId: ORG_APEX_ID,
    firstName: 'Rudi',
    lastName: 'Kappel',
    email: 'rudi.kappel@alpina-transport.test',
    phone: '+43 650 112 224',
    role: 'Operations Lead',
    clientId: 'cli_1006',
    clientName: 'Alpina Transport Services',
    status: 'Active',
    source: 'Manual',
    tags: ['logistics'],
    notes: 'Primary operations contact for shipment reporting.',
    createdAt: '2024-07-03',
  },
  {
    id: 'cnt_1010',
    orgId: ORG_APEX_ID,
    firstName: 'Claudia',
    lastName: 'Wimmer',
    email: 'claudia.wimmer@bergmann-mbg.test',
    phone: '+43 732 998 2212',
    role: 'Transformation Lead',
    clientId: 'cli_1007',
    clientName: 'Bergmann Maschinenbau',
    status: 'Active',
    source: 'Referral',
    tags: ['prospect'],
    notes: 'Interested in phased migration.',
    createdAt: '2024-11-06',
  },
  {
    id: 'cnt_1011',
    orgId: ORG_APEX_ID,
    firstName: 'Lukas',
    lastName: 'Pfister',
    email: 'l.pfister@hinterland-pharma.test',
    phone: '+43 316 400 910',
    role: 'Quality Officer',
    clientId: 'cli_1008',
    clientName: 'Hinterland Pharma AG',
    status: 'Active',
    source: 'Manual',
    tags: ['compliance'],
    notes: 'Requires audit trail confirmation.',
    createdAt: '2024-02-11',
  },
  {
    id: 'cnt_1012',
    orgId: ORG_APEX_ID,
    firstName: 'Eva',
    lastName: 'Lang',
    email: 'eva.lang@sonnenkraft.test',
    phone: '+43 1 890 701',
    role: 'Finance Controller',
    clientId: 'cli_1011',
    clientName: 'Sonnenkraft AG',
    status: 'Active',
    source: 'Referral',
    tags: ['finance'],
    notes: 'Invoice disputes should be triaged same-day.',
    createdAt: '2024-01-08',
  },
  {
    id: 'cnt_1013',
    orgId: ORG_APEX_ID,
    firstName: 'Nadia',
    lastName: 'Mayer',
    email: 'n.mayer@mueller-design.test',
    phone: '+43 664 778 222',
    role: 'Studio Owner',
    clientId: 'cli_1010',
    clientName: 'Müller Design Studio',
    status: 'Inactive',
    source: 'Manual',
    tags: ['churned'],
    notes: 'Churned client still receives outreach to reduce risk of reactivation.',
    createdAt: '2023-05-01',
  },
  {
    id: 'cnt_1014',
    orgId: ORG_APEX_ID,
    firstName: 'Matthias',
    lastName: 'Schneider',
    email: 'm.schneider@apex-tech.test',
    phone: '+43 1 234 5690',
    role: 'Account Coordinator',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    source: 'Manual',
    tags: ['finance'],
    notes: 'Supports billing and onboarding handoffs.',
    createdAt: '2024-04-05',
  },
  {
    id: 'cnt_1015',
    orgId: ORG_APEX_ID,
    firstName: 'Tina',
    lastName: 'Bauer',
    email: 'tina.bauer@rosenberg-hotels.test',
    phone: '+43 1 444 2212',
    role: 'Hotel Operations',
    clientId: 'cli_1009',
    clientName: 'Rosenberg Hotels Group',
    status: 'Inactive',
    source: 'Referral',
    tags: ['hospitality', 'churn-risk'],
    notes: 'Client contract paused but still open as inactive account.',
    createdAt: '2023-10-04',
  },
  {
    id: 'cnt_1016',
    orgId: ORG_APEX_ID,
    firstName: 'Jonas',
    lastName: 'Eberl',
    email: 'j.eberl@donau-logistics.test',
    phone: '+43 1 555 7892',
    role: 'Ops Director',
    clientId: 'cli_1004',
    clientName: 'Donau Logistics AG',
    status: 'Active',
    source: 'Referral',
    tags: ['operations'],
    notes: 'Works on warehouse process optimization.',
    createdAt: '2024-11-15',
  },
  {
    id: 'cnt_1017',
    orgId: ORG_APEX_ID,
    firstName: 'Sarah',
    lastName: 'Klein',
    email: 's.klein@bruckner.test',
    phone: '+43 732 987 656',
    role: 'Project Manager',
    clientId: 'cli_1002',
    clientName: 'Bruckner Consulting',
    status: 'Active',
    source: 'Manual',
    tags: ['project'],
    notes: 'Coordinates milestone reviews.',
    createdAt: '2024-11-01',
  },
  {
    id: 'cnt_1018',
    orgId: ORG_APEX_ID,
    firstName: 'Peter',
    lastName: 'Wagner',
    email: 'p.wagner@apex-tech.test',
    phone: '+43 1 234 5691',
    role: 'Technical Account Manager',
    clientId: 'cli_1001',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    source: 'Manual',
    tags: ['technical'],
    notes: 'Primary TAM for integrations and API clients.',
    createdAt: '2024-08-12',
  },
  {
    id: 'cnt_1019',
    orgId: ORG_APEX_ID,
    firstName: 'Leonie',
    lastName: 'Schuster',
    email: 'l.schuster@hinterland-pharma.test',
    phone: '+43 316 400 911',
    role: 'Regulatory Affairs',
    clientId: 'cli_1008',
    clientName: 'Hinterland Pharma AG',
    status: 'Active',
    source: 'Referral',
    tags: ['compliance'],
    notes: 'Validates audit artifacts and retention controls.',
    createdAt: '2024-05-23',
  },
  {
    id: 'cnt_1020',
    orgId: ORG_APEX_ID,
    firstName: 'Felix',
    lastName: 'Hartmann',
    email: 'f.hartmann@alpina-transport.test',
    phone: '+43 650 112 225',
    role: 'Fleet Lead',
    clientId: 'cli_1006',
    clientName: 'Alpina Transport Services',
    status: 'Active',
    source: 'Manual',
    tags: ['logistics'],
    notes: 'Oversees pilot vehicle rollout.',
    createdAt: '2024-12-02',
  },
];

const INITIAL_VENDORS: VendorRecord[] = [
  {
    id: 'vnd_1001',
    orgId: ORG_APEX_ID,
    name: 'Donau Logistics AG',
    category: 'Logistics',
    status: 'Preferred',
    email: 'procurement@donau-logistics.test',
    phone: '+43 1 555 7890',
    website: 'https://donau-logistics.test',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['logistics', 'preferred'],
    notes: 'Primary logistics partner for EU shipments.',
    createdAt: '2023-06-01',
  },
  {
    id: 'vnd_1002',
    orgId: ORG_APEX_ID,
    name: 'Alpine Print & Supply',
    category: 'Materials',
    status: 'Active',
    email: 'orders@alpineprint.test',
    phone: '+43 512 889 900',
    website: '',
    country: 'AT',
    city: 'Innsbruck',
    paymentTerms: 'Net 14',
    currency: 'EUR',
    tags: ['print', 'materials'],
    notes: 'Office supplies and printed materials.',
    createdAt: '2023-09-15',
  },
  {
    id: 'vnd_1003',
    orgId: ORG_APEX_ID,
    name: 'CloudServ GmbH',
    category: 'Technology',
    status: 'Active',
    email: 'billing@cloudserv.test',
    phone: '+49 30 567 8901',
    website: 'https://cloudserv.test',
    country: 'DE',
    city: 'Berlin',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['cloud', 'hosting'],
    notes: 'Managed cloud hosting provider.',
    createdAt: '2022-11-01',
  },
  {
    id: 'vnd_1004',
    orgId: ORG_APEX_ID,
    name: 'Wiener Reinigungsservice',
    category: 'Services',
    status: 'Active',
    email: 'office@wrs.test',
    phone: '+43 1 334 5678',
    website: '',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 15',
    currency: 'EUR',
    tags: ['facility'],
    notes: 'Office cleaning services.',
    createdAt: '2023-01-10',
  },
  {
    id: 'vnd_1005',
    orgId: ORG_APEX_ID,
    name: 'Helvetia Freight AG',
    category: 'Logistics',
    status: 'Inactive',
    email: 'ops@helvetia-freight.test',
    phone: '+41 44 900 1122',
    website: '',
    country: 'CH',
    city: 'Zurich',
    paymentTerms: 'Net 45',
    currency: 'CHF',
    tags: ['freight', 'ch'],
    notes: 'Used for CH cross-border. Currently paused.',
    createdAt: '2023-03-20',
  },
  {
    id: 'vnd_1006',
    orgId: ORG_APEX_ID,
    name: 'Meridian Consulting Partners',
    category: 'Services',
    status: 'Active',
    email: 'projects@meridian.test',
    phone: '+43 1 777 3344',
    website: 'https://meridian.test',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['consulting'],
    notes: 'Strategy consulting for expansion projects.',
    createdAt: '2024-01-05',
  },
  {
    id: 'vnd_1007',
    orgId: ORG_APEX_ID,
    name: 'Nordic Data Storage',
    category: 'Technology',
    status: 'Active',
    email: 'provisioning@nordic-data.test',
    phone: '+46 8 555 9012',
    website: 'https://nordic-data.test',
    country: 'SE',
    city: 'Stockholm',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['storage', 'backup'],
    notes: 'Cloud backup and archival infrastructure.',
    createdAt: '2024-01-10',
  },
  {
    id: 'vnd_1008',
    orgId: ORG_APEX_ID,
    name: 'Grafik & Print House',
    category: 'Materials',
    status: 'Active',
    email: 'orders@grafik-print.test',
    phone: '+43 7252 112 233',
    website: 'https://grafik-print.test',
    country: 'AT',
    city: 'Graz',
    paymentTerms: 'Net 20',
    currency: 'EUR',
    tags: ['print', 'marketing'],
    notes: 'Branding collateral and conference materials.',
    createdAt: '2024-03-02',
  },
  {
    id: 'vnd_1009',
    orgId: ORG_APEX_ID,
    name: 'IT Security Experts',
    category: 'Services',
    status: 'Preferred',
    email: 'contact@itsec-experts.test',
    phone: '+43 1 456 7788',
    website: '',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['security', 'managed'],
    notes: 'Incident-response and hardening support contracts.',
    createdAt: '2024-01-22',
  },
  {
    id: 'vnd_1010',
    orgId: ORG_APEX_ID,
    name: 'Alpine Facility Logistics',
    category: 'Services',
    status: 'Active',
    email: 'booking@alpine-facility.test',
    phone: '+43 505 221 112',
    website: '',
    country: 'AT',
    city: 'Kufstein',
    paymentTerms: 'Net 15',
    currency: 'EUR',
    tags: ['facility'],
    notes: 'Warehousing and packing assistance.',
    createdAt: '2024-02-11',
  },
  {
    id: 'vnd_1011',
    orgId: ORG_APEX_ID,
    name: 'Vienna Data Transit',
    category: 'Technology',
    status: 'Active',
    email: 'support@vienna-data-transit.test',
    phone: '+43 676 221 998',
    website: 'https://vienna-data-transit.test',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['network', 'connectivity'],
    notes: 'WAN and data-center transit monitoring.',
    createdAt: '2024-09-01',
  },
  {
    id: 'vnd_1012',
    orgId: ORG_APEX_ID,
    name: 'Nordic Rail Freight',
    category: 'Logistics',
    status: 'Inactive',
    email: 'ops@nordicrail.test',
    phone: '+46 31 555 2001',
    website: '',
    country: 'SE',
    city: 'Gothenburg',
    paymentTerms: 'Net 45',
    currency: 'EUR',
    tags: ['rail', 'international'],
    notes: 'Inactive until contract renewal Q3.',
    createdAt: '2024-01-28',
  },
  {
    id: 'vnd_1013',
    orgId: ORG_APEX_ID,
    name: 'Vertex Marketing Studio',
    category: 'Services',
    status: 'Preferred',
    email: 'hello@vertex-marketing.test',
    phone: '+43 650 443 220',
    website: 'https://vertex-marketing.test',
    country: 'AT',
    city: 'Graz',
    paymentTerms: 'Net 20',
    currency: 'EUR',
    tags: ['design', 'campaign'],
    notes: 'Brand and campaign support for launches.',
    createdAt: '2024-06-12',
  },
  {
    id: 'vnd_1014',
    orgId: ORG_APEX_ID,
    name: 'Precision Electronics',
    category: 'Technology',
    status: 'Active',
    email: 'orders@precision-electronics.test',
    phone: '+43 1 555 7788',
    website: '',
    country: 'AT',
    city: 'Vienna',
    paymentTerms: 'Net 30',
    currency: 'EUR',
    tags: ['hardware', 'rfid'],
    notes: 'Supplies edge and RFID modules.',
    createdAt: '2024-08-30',
  },
];

const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'lead_1001',
    orgId: ORG_APEX_ID,
    title: 'Enterprise SaaS expansion — Bergmann AG',
    contactName: 'Klaus Bergmann',
    company: 'Bergmann AG',
    email: 'k.bergmann@bergmann.test',
    phone: '+43 316 222 333',
    source: 'Referral',
    stage: 'Negotiation',
    value: 48000,
    currency: 'EUR',
    probability: 75,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-01-31',
    notes: 'Strong fit. Final pricing discussion pending.',
    createdAt: '2024-10-15',
  },
  {
    id: 'lead_1002',
    orgId: ORG_APEX_ID,
    title: 'Professional plan — Steyr Industries',
    contactName: 'Maria Gruber',
    company: 'Steyr Industries GmbH',
    email: 'm.gruber@steyr.test',
    phone: '+43 7252 789 012',
    source: 'Website',
    stage: 'Proposal',
    value: 18000,
    currency: 'EUR',
    probability: 50,
    assignedTo: 'Markus Leitner',
    expectedCloseDate: '2025-02-15',
    notes: 'Proposal sent. Awaiting budget approval.',
    createdAt: '2024-11-01',
  },
  {
    id: 'lead_1003',
    orgId: ORG_APEX_ID,
    title: 'Starter plan — Klagenfurt Consulting',
    contactName: 'Robert Haas',
    company: 'Klagenfurt Consulting',
    email: 'r.haas@kla-consult.test',
    phone: '+43 463 556 789',
    source: 'Event',
    stage: 'New',
    value: 3600,
    currency: 'EUR',
    probability: 20,
    assignedTo: 'Nina Weiss',
    expectedCloseDate: '2025-03-01',
    notes: 'Met at Vienna summit. Follow-up scheduled.',
    createdAt: '2024-11-28',
  },
  {
    id: 'lead_1004',
    orgId: ORG_APEX_ID,
    title: 'Multi-site rollout — Pöchlarn Retail',
    contactName: 'Ingrid Schwarz',
    company: 'Pöchlarn Retail GmbH',
    email: 'i.schwarz@poechlarn-retail.test',
    phone: '+43 2757 123 456',
    source: 'Partner',
    stage: 'Qualified',
    value: 72000,
    currency: 'EUR',
    probability: 40,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-04-30',
    notes: '5-location rollout. Technical POC completed.',
    createdAt: '2024-10-28',
  },
  {
    id: 'lead_1005',
    orgId: ORG_APEX_ID,
    title: 'ERP integration — Salzburg Logistics',
    contactName: 'Franz Huber',
    company: 'Salzburg Logistics KG',
    email: 'f.huber@salzburg-log.test',
    phone: '+43 662 334 556',
    source: 'Cold outreach',
    stage: 'Won',
    value: 22000,
    currency: 'EUR',
    probability: 100,
    assignedTo: 'Markus Leitner',
    expectedCloseDate: '2024-12-15',
    notes: 'Contract signed. Implementation starting January.',
    createdAt: '2024-09-01',
  },
  {
    id: 'lead_1006',
    orgId: ORG_APEX_ID,
    title: 'SMB subscription — Feldkirch Design',
    contactName: 'Anita Ritter',
    company: 'Feldkirch Design Studio',
    email: 'a.ritter@feldkirch-design.test',
    phone: '+43 5522 445 667',
    source: 'Website',
    stage: 'Lost',
    value: 2400,
    currency: 'EUR',
    probability: 0,
    assignedTo: 'Nina Weiss',
    expectedCloseDate: '2024-11-30',
    notes: 'Went with competitor. Price sensitivity.',
    createdAt: '2024-10-05',
  },
  {
    id: 'lead_1007',
    orgId: ORG_APEX_ID,
    title: 'Finance module add-on — Graz Pharma',
    contactName: 'Dr. Werner Stein',
    company: 'Graz Pharma GmbH',
    email: 'w.stein@grazpharma.test',
    phone: '+43 316 678 901',
    source: 'Referral',
    stage: 'Qualified',
    value: 9600,
    currency: 'EUR',
    probability: 35,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-02-28',
    notes: 'Existing customer. Upsell opportunity.',
    createdAt: '2024-12-01',
  },
  {
    id: 'lead_1008',
    orgId: ORG_APEX_ID,
    title: 'Platform trial — Linz Startup Hub',
    contactName: 'Bianca Vogl',
    company: 'Linz Startup Hub',
    email: 'b.vogl@linz-hub.test',
    phone: '+43 732 556 789',
    source: 'Event',
    stage: 'New',
    value: 1200,
    currency: 'EUR',
    probability: 15,
    assignedTo: 'Nina Weiss',
    expectedCloseDate: '2025-03-31',
    notes: 'Interested in startup pricing. Demo booked.',
    createdAt: '2024-12-03',
  },
  {
    id: 'lead_1009',
    orgId: ORG_APEX_ID,
    title: 'Compliance dashboard upgrade — Alpenbau AG',
    contactName: 'Josef Leitner',
    company: 'Alpenbau AG',
    email: 'j.leitner@alpenbau.test',
    phone: '+43 512 123 901',
    source: 'Partner',
    stage: 'Proposal',
    value: 56000,
    currency: 'EUR',
    probability: 52,
    assignedTo: 'Markus Leitner',
    expectedCloseDate: '2025-02-18',
    notes: 'Requires role-based access and audit modules.',
    createdAt: '2024-12-04',
  },
  {
    id: 'lead_1010',
    orgId: ORG_APEX_ID,
    title: 'Single sign-on rollout — Wien University',
    contactName: 'Stefanie Brandt',
    company: 'University of Vienna',
    email: 's.brandt@univie.test',
    phone: '+43 1 427 1100',
    source: 'Website',
    stage: 'Qualified',
    value: 35000,
    currency: 'EUR',
    probability: 48,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-03-20',
    notes: 'Academic department pilot in progress.',
    createdAt: '2024-11-26',
  },
  {
    id: 'lead_1011',
    orgId: ORG_APEX_ID,
    title: 'Logistics monitoring bundle — Steyr Freight',
    contactName: 'Michael Berger',
    company: 'Steyr Freight GmbH',
    email: 'm.berger@steyr-freight.test',
    phone: '+43 7242 777 111',
    source: 'Cold outreach',
    stage: 'New',
    value: 27000,
    currency: 'EUR',
    probability: 18,
    assignedTo: 'Nina Weiss',
    expectedCloseDate: '2025-04-05',
    notes: 'Targeted by outbound campaign. Needs follow-up.',
    createdAt: '2024-12-07',
  },
  {
    id: 'lead_1012',
    orgId: ORG_APEX_ID,
    title: 'AI reporting suite — Linz City Office',
    contactName: 'Sanja Petrović',
    company: 'Linz City Office',
    email: 's.petrovic@linz-city.test',
    phone: '+43 732 900 333',
    source: 'Event',
    stage: 'Negotiation',
    value: 41000,
    currency: 'EUR',
    probability: 68,
    assignedTo: 'Markus Leitner',
    expectedCloseDate: '2025-03-05',
    notes: 'Pilot scope approved; waiting legal review.',
    createdAt: '2024-11-21',
  },
  {
    id: 'lead_1013',
    orgId: ORG_APEX_ID,
    title: 'On-premise add-on for finance team',
    contactName: 'Verena Schindler',
    company: 'Apex Technologies GmbH',
    email: 'verena.schindler@apex-tech.test',
    phone: '+43 1 234 5601',
    source: 'Referral',
    stage: 'Proposal',
    value: 36000,
    currency: 'EUR',
    probability: 64,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-03-11',
    notes: 'Internal expansion for finance operations.',
    createdAt: '2024-12-08',
  },
  {
    id: 'lead_1014',
    orgId: ORG_APEX_ID,
    title: 'Managed security for cloud estate',
    contactName: 'Johann Berger',
    company: 'Sonnenkraft AG',
    email: 'j.berger@sonnenkraft.test',
    phone: '+43 1 890 722',
    source: 'Cold outreach',
    stage: 'Qualified',
    value: 54000,
    currency: 'EUR',
    probability: 42,
    assignedTo: 'Markus Leitner',
    expectedCloseDate: '2025-02-28',
    notes: 'High risk category requires dedicated SOC access.',
    createdAt: '2024-12-05',
  },
  {
    id: 'lead_1015',
    orgId: ORG_APEX_ID,
    title: 'Warehouse API integration rollout',
    contactName: 'Sascha Neuwirth',
    company: 'Donau Logistics AG',
    email: 's.neuwirth@donau-logistics.test',
    phone: '+43 1 555 7892',
    source: 'Partner',
    stage: 'Negotiation',
    value: 28000,
    currency: 'EUR',
    probability: 58,
    assignedTo: 'Nina Weiss',
    expectedCloseDate: '2025-01-28',
    notes: 'Already greenlit with 2 pilot locations.',
    createdAt: '2024-12-06',
  },
  {
    id: 'lead_1016',
    orgId: ORG_APEX_ID,
    title: 'Premium support contract renewal',
    contactName: 'Klara Sommer',
    company: 'Bruckner Consulting',
    email: 'k.sommer@bruckner.test',
    phone: '+43 732 987 670',
    source: 'Website',
    stage: 'Won',
    value: 14000,
    currency: 'EUR',
    probability: 100,
    assignedTo: 'Anna Hofer',
    expectedCloseDate: '2025-01-15',
    notes: 'Contract renewal approved by board.',
    createdAt: '2024-12-04',
  },
];

const INITIAL_STAFF: StaffRecord[] = [
  {
    id: 'stf_1001',
    orgId: ORG_APEX_ID,
    firstName: 'Anna',
    lastName: 'Hofer',
    email: 'anna.hofer@apex-tech.test',
    phone: '+43 1 234 5678',
    position: 'Head of Operations',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2021-03-01',
    managerId: null,
    managerName: null,
    tags: ['management'],
    notes: '',
    createdAt: '2021-03-01',
  },
  {
    id: 'stf_1002',
    orgId: ORG_APEX_ID,
    firstName: 'Markus',
    lastName: 'Leitner',
    email: 'markus.leitner@apex-tech.test',
    phone: '+43 1 234 5679',
    position: 'Project Manager',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2022-01-15',
    managerId: 'stf_1001',
    managerName: 'Anna Hofer',
    tags: [],
    notes: '',
    createdAt: '2022-01-15',
  },
  {
    id: 'stf_1003',
    orgId: ORG_APEX_ID,
    firstName: 'Nina',
    lastName: 'Weiss',
    email: 'nina.weiss@apex-tech.test',
    phone: '+43 1 234 5680',
    position: 'Support Lead',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2022-06-01',
    managerId: 'stf_1001',
    managerName: 'Anna Hofer',
    tags: [],
    notes: '',
    createdAt: '2022-06-01',
  },
  {
    id: 'stf_1004',
    orgId: ORG_APEX_ID,
    firstName: 'Klaus',
    lastName: 'Fischer',
    email: 'k.fischer@apex-tech.test',
    phone: '+43 1 234 5681',
    position: 'Senior Accountant',
    department: 'Finance',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2020-09-01',
    managerId: null,
    managerName: null,
    tags: ['finance'],
    notes: '',
    createdAt: '2020-09-01',
  },
  {
    id: 'stf_1005',
    orgId: ORG_APEX_ID,
    firstName: 'Julia',
    lastName: 'Berger',
    email: 'j.berger@apex-tech.test',
    phone: '+43 1 234 5682',
    position: 'Finance Analyst',
    department: 'Finance',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2023-03-15',
    managerId: 'stf_1004',
    managerName: 'Klaus Fischer',
    tags: [],
    notes: '',
    createdAt: '2023-03-15',
  },
  {
    id: 'stf_1006',
    orgId: ORG_APEX_ID,
    firstName: 'Georg',
    lastName: 'Steiner',
    email: 'g.steiner@apex-tech.test',
    phone: '+43 1 234 5683',
    position: 'DevOps Engineer',
    department: 'IT',
    employmentType: 'Contractor',
    status: 'Active',
    startDate: '2024-01-01',
    managerId: null,
    managerName: null,
    tags: ['contractor', 'devops'],
    notes: 'Renewable 6-month contract.',
    createdAt: '2024-01-01',
  },
  {
    id: 'stf_1007',
    orgId: ORG_APEX_ID,
    firstName: 'Petra',
    lastName: 'Wolf',
    email: 'p.wolf@apex-tech.test',
    phone: '+43 1 234 5684',
    position: 'HR Manager',
    department: 'HR',
    employmentType: 'Part-time',
    status: 'On leave',
    startDate: '2021-08-01',
    managerId: null,
    managerName: null,
    tags: ['hr'],
    notes: 'Parental leave until Q2 2025.',
    createdAt: '2021-08-01',
  },
  {
    id: 'stf_1008',
    orgId: ORG_APEX_ID,
    firstName: 'David',
    lastName: 'Kraus',
    email: 'd.kraus@apex-tech.test',
    phone: '+43 1 234 5685',
    position: 'Sales Representative',
    department: 'Sales',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2023-11-01',
    managerId: null,
    managerName: null,
    tags: ['sales'],
    notes: '',
    createdAt: '2023-11-01',
  },
  {
    id: 'stf_1009',
    orgId: ORG_APEX_ID,
    firstName: 'Elisabeth',
    lastName: 'Rosen',
    email: 'e.rosen@apex-tech.test',
    phone: '+43 1 234 5686',
    position: 'QA Engineer',
    department: 'IT',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2023-12-01',
    managerId: 'stf_1001',
    managerName: 'Anna Hofer',
    tags: ['qa'],
    notes: 'Owns regression automation.',
    createdAt: '2023-12-01',
  },
  {
    id: 'stf_1010',
    orgId: ORG_APEX_ID,
    firstName: 'Milan',
    lastName: 'Schwarz',
    email: 'm.schwarz@apex-tech.test',
    phone: '+43 1 234 5687',
    position: 'UX Designer',
    department: 'Operations',
    employmentType: 'Contractor',
    status: 'Active',
    startDate: '2024-02-01',
    managerId: 'stf_1001',
    managerName: 'Anna Hofer',
    tags: ['design'],
    notes: 'Contract renewed quarterly.',
    createdAt: '2024-02-01',
  },
  {
    id: 'stf_1011',
    orgId: ORG_APEX_ID,
    firstName: 'Yvonne',
    lastName: 'Pfeiffer',
    email: 'y.pfeiffer@apex-tech.test',
    phone: '+43 1 234 5688',
    position: 'Procurement Officer',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2022-10-12',
    managerId: 'stf_1002',
    managerName: 'Markus Leitner',
    tags: ['procurement'],
    notes: 'Owns PO approvals and spend reporting.',
    createdAt: '2022-10-12',
  },
  {
    id: 'stf_1012',
    orgId: ORG_APEX_ID,
    firstName: 'Rainer',
    lastName: 'Klein',
    email: 'r.klein@apex-tech.test',
    phone: '+43 1 234 5689',
    position: 'Talent Acquisition',
    department: 'HR',
    employmentType: 'Full-time',
    status: 'On leave',
    startDate: '2021-05-17',
    managerId: 'stf_1007',
    managerName: 'Petra Wolf',
    tags: ['recruiting'],
    notes: 'Supporting 2025 hiring plan.',
    createdAt: '2021-05-17',
  },
  {
    id: 'stf_1013',
    orgId: ORG_APEX_ID,
    firstName: 'Carina',
    lastName: 'Lechner',
    email: 'c.lechner@apex-tech.test',
    phone: '+43 1 234 5690',
    position: 'Data Analyst',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2024-03-01',
    managerId: 'stf_1001',
    managerName: 'Anna Hofer',
    tags: ['analytics'],
    notes: 'Builds executive reporting dashboards.',
    createdAt: '2024-03-01',
  },
  {
    id: 'stf_1014',
    orgId: ORG_APEX_ID,
    firstName: 'Dominic',
    lastName: 'Rossi',
    email: 'd.rossi@apex-tech.test',
    phone: '+39 02 555 9901',
    position: 'Localization Specialist',
    department: 'Operations',
    employmentType: 'Part-time',
    status: 'Active',
    startDate: '2024-01-20',
    managerId: 'stf_1003',
    managerName: 'Nina Weiss',
    tags: ['compliance', 'languages'],
    notes: 'Supports DE/EN rollout and documentation.',
    createdAt: '2024-01-20',
  },
  {
    id: 'stf_1015',
    orgId: ORG_APEX_ID,
    firstName: 'Ilona',
    lastName: 'Bauer',
    email: 'i.bauer@apex-tech.test',
    phone: '+43 1 234 5691',
    position: 'Customer Success Manager',
    department: 'Operations',
    employmentType: 'Full-time',
    status: 'Active',
    startDate: '2023-08-10',
    managerId: 'stf_1002',
    managerName: 'Markus Leitner',
    tags: ['cs'],
    notes: 'Owns QBR schedule across top-tier customers.',
    createdAt: '2023-08-10',
  },
  {
    id: 'stf_1016',
    orgId: ORG_APEX_ID,
    firstName: 'Pavel',
    lastName: 'Novak',
    email: 'p.novak@apex-tech.test',
    phone: '+43 1 234 5692',
    position: 'QA Automation Lead',
    department: 'IT',
    employmentType: 'Contractor',
    status: 'Active',
    startDate: '2023-09-01',
    managerId: 'stf_1012',
    managerName: 'Rainer Klein',
    tags: ['qa', 'automation'],
    notes: 'Owns nightly regression suite.',
    createdAt: '2023-09-01',
  },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'po_1001',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0001',
    vendorId: 'vnd_1001',
    vendorName: 'Donau Logistics AG',
    status: 'Confirmed',
    total: 8400,
    currency: 'EUR',
    requestedBy: 'Anna Hofer',
    expectedDelivery: '2025-01-15',
    notes: 'Q1 logistics services agreement.',
    createdAt: '2024-12-01',
  },
  {
    id: 'po_1002',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0002',
    vendorId: 'vnd_1002',
    vendorName: 'Alpine Print & Supply',
    status: 'Received',
    total: 1250,
    currency: 'EUR',
    requestedBy: 'Markus Leitner',
    expectedDelivery: '2024-12-10',
    notes: 'Year-end stationery order.',
    createdAt: '2024-11-28',
  },
  {
    id: 'po_1003',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0003',
    vendorId: 'vnd_1003',
    vendorName: 'CloudServ GmbH',
    status: 'Sent',
    total: 3600,
    currency: 'EUR',
    requestedBy: 'Nina Weiss',
    expectedDelivery: '2025-01-01',
    notes: 'Annual cloud hosting renewal.',
    createdAt: '2024-12-02',
  },
  {
    id: 'po_1004',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0004',
    vendorId: 'vnd_1004',
    vendorName: 'Wiener Reinigungsservice',
    status: 'Draft',
    total: 480,
    currency: 'EUR',
    requestedBy: 'Anna Hofer',
    expectedDelivery: '2025-01-07',
    notes: 'Monthly cleaning services January.',
    createdAt: '2024-12-05',
  },
  {
    id: 'po_1005',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0005',
    vendorId: 'vnd_1006',
    vendorName: 'Meridian Consulting Partners',
    status: 'Confirmed',
    total: 15000,
    currency: 'EUR',
    requestedBy: 'Anna Hofer',
    expectedDelivery: '2025-03-31',
    notes: 'Q1 strategy consulting engagement.',
    createdAt: '2024-11-15',
  },
  {
    id: 'po_1006',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0006',
    vendorId: 'vnd_1001',
    vendorName: 'Donau Logistics AG',
    status: 'Cancelled',
    total: 2200,
    currency: 'EUR',
    requestedBy: 'Markus Leitner',
    expectedDelivery: '2024-11-30',
    notes: 'Cancelled — project scope changed.',
    createdAt: '2024-10-20',
  },
  {
    id: 'po_1007',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0007',
    vendorId: 'vnd_1002',
    vendorName: 'Alpine Print & Supply',
    status: 'Received',
    total: 890,
    currency: 'EUR',
    requestedBy: 'Nina Weiss',
    expectedDelivery: '2024-11-15',
    notes: 'Marketing materials for conference.',
    createdAt: '2024-11-01',
  },
  {
    id: 'po_1008',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0008',
    vendorId: null,
    vendorName: 'Office Depot Austria',
    status: 'Draft',
    total: 340,
    currency: 'EUR',
    requestedBy: 'Julia Berger',
    expectedDelivery: '2025-01-10',
    notes: 'Office supplies restock.',
    createdAt: '2024-12-05',
  },
  {
    id: 'po_1009',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0009',
    vendorId: 'vnd_1007',
    vendorName: 'Nordic Data Storage',
    status: 'Sent',
    total: 9800,
    currency: 'EUR',
    requestedBy: 'Nina Weiss',
    expectedDelivery: '2025-01-25',
    notes: 'Cloud archive expansion for compliance backups.',
    createdAt: '2024-12-06',
  },
  {
    id: 'po_1010',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0010',
    vendorId: 'vnd_1008',
    vendorName: 'Grafik & Print House',
    status: 'Draft',
    total: 1750,
    currency: 'EUR',
    requestedBy: 'Markus Leitner',
    expectedDelivery: '2025-01-15',
    notes: 'Brochures and onsite signage before year-end',
    createdAt: '2024-12-06',
  },
  {
    id: 'po_1011',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0011',
    vendorId: 'vnd_1009',
    vendorName: 'IT Security Experts',
    status: 'Confirmed',
    total: 23000,
    currency: 'EUR',
    requestedBy: 'Anna Hofer',
    expectedDelivery: '2025-02-15',
    notes: 'Quarterly security assessment and tabletop exercise.',
    createdAt: '2024-12-07',
  },
  {
    id: 'po_1012',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0012',
    vendorId: null,
    vendorName: 'General Office Source',
    status: 'Received',
    total: 620,
    currency: 'EUR',
    requestedBy: 'Elisabeth Rosen',
    expectedDelivery: '2025-01-04',
    notes: 'Temporary purchase before supplier onboarding.',
    createdAt: '2024-12-07',
  },
  {
    id: 'po_1013',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0013',
    vendorId: 'vnd_1011',
    vendorName: 'Vienna Data Transit',
    status: 'Sent',
    total: 5200,
    currency: 'EUR',
    requestedBy: 'Nina Weiss',
    expectedDelivery: '2025-01-22',
    notes: 'Dedicated MPLS extension for EU-APAC routing.',
    createdAt: '2024-12-08',
  },
  {
    id: 'po_1014',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0014',
    vendorId: 'vnd_1013',
    vendorName: 'Vertex Marketing Studio',
    status: 'Draft',
    total: 9400,
    currency: 'EUR',
    requestedBy: 'Markus Leitner',
    expectedDelivery: '2025-02-01',
    notes: 'Marketing push for Q1 rollout campaign.',
    createdAt: '2024-12-08',
  },
  {
    id: 'po_1015',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0015',
    vendorId: 'vnd_1014',
    vendorName: 'Precision Electronics',
    status: 'Confirmed',
    total: 11200,
    currency: 'USD',
    requestedBy: 'Anna Hofer',
    expectedDelivery: '2025-02-10',
    notes: 'Procure RFID edge modules for pilot warehouse.',
    createdAt: '2024-12-09',
  },
  {
    id: 'po_1016',
    orgId: ORG_APEX_ID,
    poNumber: 'PO-2024-0016',
    vendorId: null,
    vendorName: 'Metro Office Depot',
    status: 'Draft',
    total: 740,
    currency: 'EUR',
    requestedBy: 'Yvonne Pfeiffer',
    expectedDelivery: '2025-01-18',
    notes: 'Quarterly office supplies top-up.',
    createdAt: '2024-12-09',
  },
];

const INITIAL_CASE_CHECKLISTS: CaseChecklistItem[] = [
  {
    id: 'chk_1',
    caseId: 'case_6001',
    label: 'Acknowledge receipt to client',
    done: true,
    required: true,
  },
  {
    id: 'chk_2',
    caseId: 'case_6001',
    label: 'Pull invoice history from billing',
    done: true,
    required: true,
  },
  {
    id: 'chk_3',
    caseId: 'case_6001',
    label: 'Issue credit note if confirmed',
    done: false,
    required: true,
  },
  {
    id: 'chk_4',
    caseId: 'case_6003',
    label: 'Post-incident review scheduled',
    done: false,
    required: true,
  },
  {
    id: 'chk_5',
    caseId: 'case_6003',
    label: 'Notify affected integrations',
    done: true,
    required: true,
  },
  {
    id: 'chk_6',
    caseId: 'case_6006',
    label: 'Validate license count with finance',
    done: false,
    required: true,
  },
  {
    id: 'chk_7',
    caseId: 'case_6006',
    label: 'Confirm client-side provisioning change',
    done: true,
    required: true,
  },
  {
    id: 'chk_8',
    caseId: 'case_6008',
    label: 'Re-run onboarding scripts',
    done: true,
    required: false,
  },
  {
    id: 'chk_9',
    caseId: 'case_6008',
    label: 'Create rollback plan',
    done: false,
    required: true,
  },
  {
    id: 'chk_10',
    caseId: 'case_6009',
    label: 'Archive rotation evidence',
    done: false,
    required: false,
  },
  {
    id: 'chk_11',
    caseId: 'case_6002',
    label: 'Prepare legal revision draft',
    done: false,
    required: true,
  },
  {
    id: 'chk_12',
    caseId: 'case_6004',
    label: 'Collect onboarding requirements checklist',
    done: true,
    required: false,
  },
  {
    id: 'chk_13',
    caseId: 'case_6005',
    label: 'Confirm post-cancel communications',
    done: true,
    required: true,
  },
  {
    id: 'chk_14',
    caseId: 'case_6007',
    label: 'Document compliance evidence trail',
    done: false,
    required: true,
  },
];

const INITIAL_INCIDENTS: IncidentRecord[] = [
  {
    id: 'inc_7001',
    incidentNumber: 'INC-4412',
    title: 'Elevated API latency EU region',
    severity: 'High',
    status: 'Investigating',
    service: 'Public API',
    assignee: 'Nina Weiss',
    reportedAt: '2024-12-06T08:12:00Z',
    impact: 'P95 latency above 2s for 12% of requests.',
  },
  {
    id: 'inc_7002',
    incidentNumber: 'INC-4408',
    title: 'Email delivery delays',
    severity: 'Medium',
    status: 'Open',
    service: 'Notifications',
    assignee: 'Anna Hofer',
    reportedAt: '2024-12-05T14:30:00Z',
    impact: 'Transactional emails delayed up to 25 minutes.',
  },
  {
    id: 'inc_7003',
    incidentNumber: 'INC-4399',
    title: 'Report export timeout',
    severity: 'Low',
    status: 'Mitigated',
    service: 'Reporting',
    assignee: 'Markus Leitner',
    reportedAt: '2024-12-04T09:00:00Z',
    impact: 'Large XLSX exports fail above 50k rows.',
  },
  {
    id: 'inc_7004',
    incidentNumber: 'INC-4431',
    title: 'OAuth callback failures',
    severity: 'High',
    status: 'Open',
    service: 'Auth',
    assignee: 'Markus Leitner',
    reportedAt: '2024-12-08T06:20:00Z',
    impact: 'Single-sign-on failures reported for enterprise tenants.',
  },
  {
    id: 'inc_7005',
    incidentNumber: 'INC-4433',
    title: 'Warehouse webhook duplication',
    severity: 'Medium',
    status: 'Mitigated',
    service: 'Integrations',
    assignee: 'Nina Weiss',
    reportedAt: '2024-12-07T21:11:00Z',
    impact: 'Some shipment confirmations were duplicated during peak window.',
  },
  {
    id: 'inc_7006',
    incidentNumber: 'INC-4438',
    title: 'Power outage in reporting cluster',
    severity: 'Critical',
    status: 'Resolved',
    service: 'Infrastructure',
    assignee: 'David Kraus',
    reportedAt: '2024-12-03T23:50:00Z',
    impact: 'Reporting UI unavailable for 18 minutes.',
  },
  {
    id: 'inc_7007',
    incidentNumber: 'INC-4440',
    title: 'Bulk import timeout in portal',
    severity: 'Medium',
    status: 'Mitigated',
    service: 'UI',
    assignee: 'Markus Leitner',
    reportedAt: '2024-12-09T10:14:00Z',
    impact: 'Bulk contact uploads stalled intermittently for 11 users.',
  },
  {
    id: 'inc_7008',
    incidentNumber: 'INC-4443',
    title: 'SSO claim mismatch for EU tenant',
    severity: 'High',
    status: 'Open',
    service: 'Auth',
    assignee: 'Nina Weiss',
    reportedAt: '2024-12-10T04:20:00Z',
    impact: 'Intermittent login failures during active directory sync.',
  },
  {
    id: 'inc_7009',
    incidentNumber: 'INC-4447',
    title: 'Invoice export worker crash',
    severity: 'Low',
    status: 'Resolved',
    service: 'Billing',
    assignee: 'Anna Hofer',
    reportedAt: '2024-12-10T18:45:00Z',
    impact: 'One scheduled export job failed; manual retry restored throughput.',
  },
];

const INITIAL_CONTRACTS: ContractRecord[] = [
  {
    id: 'ctr_8001',
    contractNumber: 'CTR-2024-120',
    title: 'Master Service Agreement',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    value: '480000',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    owner: 'Anna Hofer',
    renewalNoticeDays: 60,
  },
  {
    id: 'ctr_8002',
    contractNumber: 'CTR-2024-088',
    title: 'Professional Services SOW',
    clientName: 'Bruckner Consulting',
    status: 'Expiring',
    value: '45000',
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    owner: 'Markus Leitner',
    renewalNoticeDays: 30,
  },
  {
    id: 'ctr_8003',
    contractNumber: 'CTR-2023-044',
    title: 'Data Processing Agreement',
    clientName: 'Donau Logistics AG',
    status: 'Terminated',
    value: '0',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    owner: 'Nina Weiss',
    renewalNoticeDays: 90,
  },
  {
    id: 'ctr_8004',
    contractNumber: 'CTR-2024-153',
    title: 'Advanced Analytics Add-on',
    clientName: 'Alpina Transport Services',
    status: 'Draft',
    value: '62000',
    startDate: '2025-01-01',
    endDate: '2026-01-01',
    owner: 'Markus Leitner',
    renewalNoticeDays: 45,
  },
  {
    id: 'ctr_8005',
    contractNumber: 'CTR-2024-156',
    title: 'Support Package Renewal',
    clientName: 'Bruckner Consulting',
    status: 'Active',
    value: '42000',
    startDate: '2025-01-15',
    endDate: '2025-07-31',
    owner: 'Anna Hofer',
    renewalNoticeDays: 30,
  },
  {
    id: 'ctr_8006',
    contractNumber: 'CTR-2024-162',
    title: 'Data Processing & Privacy Addendum',
    clientName: 'Hinterland Pharma AG',
    status: 'Expiring',
    value: '9800',
    startDate: '2024-12-01',
    endDate: '2025-12-31',
    owner: 'Nina Weiss',
    renewalNoticeDays: 60,
  },
  {
    id: 'ctr_8007',
    contractNumber: 'CTR-2024-198',
    title: 'Cloud Operations Support',
    clientName: 'Apex Technologies GmbH',
    status: 'Active',
    value: '76000',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    owner: 'Anna Hofer',
    renewalNoticeDays: 45,
  },
  {
    id: 'ctr_8008',
    contractNumber: 'CTR-2024-201',
    title: 'API Enablement SOW',
    clientName: 'Donau Logistics AG',
    status: 'Draft',
    value: '28000',
    startDate: '2024-12-10',
    endDate: '2025-06-10',
    owner: 'Markus Leitner',
    renewalNoticeDays: 30,
  },
  {
    id: 'ctr_8009',
    title: 'Premium Consulting Support',
    contractNumber: 'CTR-2024-209',
    clientName: 'Bruckner Consulting',
    status: 'Active',
    value: '54000',
    startDate: '2024-11-20',
    endDate: '2025-11-20',
    owner: 'Anna Hofer',
    renewalNoticeDays: 60,
  },
  {
    id: 'ctr_8010',
    contractNumber: 'CTR-2024-214',
    title: 'Compliance Program Framework',
    clientName: 'Alpina Transport Services',
    status: 'Expiring',
    value: '39000',
    startDate: '2024-08-01',
    endDate: '2025-03-31',
    owner: 'Nina Weiss',
    renewalNoticeDays: 30,
  },
];

const INITIAL_PARTIES: PartyRecord[] = [
  {
    id: 'pty_1',
    clientId: 'cli_1001',
    salutation: 'mrs',
    name: 'Anna Hofer',
    role: 'account_manager',
    email: 'anna@apex.at',
  },
  {
    id: 'pty_2',
    clientId: 'cli_1001',
    salutation: 'mr',
    name: 'Markus Leitner',
    role: 'billing_contact',
    email: 'markus@apex.at',
  },
  {
    id: 'pty_3',
    clientId: 'cli_1001',
    salutation: 'mr',
    name: 'Thomas Berger',
    role: 'technical_contact',
    email: 'thomas@apex.at',
  },
  {
    id: 'pty_4',
    clientId: 'cli_1002',
    salutation: 'mrs',
    name: 'Eva Bruckner',
    role: 'primary_contact',
    email: 'eva@bruckner.test',
  },
  {
    id: 'pty_5',
    caseId: 'case_6001',
    name: 'Finance Team Apex',
    role: 'billing_contact',
    email: 'finance@apex.at',
  },
  {
    id: 'pty_6',
    caseId: 'case_6003',
    name: 'Ops Lead Donau',
    role: 'technical_contact',
    email: 'ops@donau-logistics.test',
  },
  {
    id: 'pty_7',
    clientId: 'cli_1006',
    salutation: 'mr',
    name: 'Johann Hofer',
    role: 'primary_contact',
    email: 'j.hofer@alpina-transport.test',
  },
  {
    id: 'pty_8',
    clientId: 'cli_1007',
    salutation: 'mrs',
    name: 'Anna Bergmann',
    role: 'billing_contact',
    email: 'a.bergmann@bergmann-mbg.test',
  },
  {
    id: 'pty_9',
    caseId: 'case_6006',
    name: 'Apex Billing Ops',
    role: 'billing_contact',
    email: 'billing-ops@apex-tech.test',
  },
  {
    id: 'pty_10',
    clientId: 'cli_1011',
    salutation: 'mr',
    name: 'Florian Weber',
    role: 'account_manager',
    email: 'f.weber@sonnenkraft.test',
  },
  {
    id: 'pty_11',
    clientId: 'cli_1009',
    salutation: 'mrs',
    name: 'Mara Fuchs',
    role: 'primary_contact',
    email: 'm.fuchs@rosenberg-hotels.test',
  },
  {
    id: 'pty_12',
    clientId: 'cli_1002',
    salutation: 'mr',
    name: 'Michael Steiner',
    role: 'billing_contact',
    email: 'm.steiner@bruckner.test',
  },
  {
    id: 'pty_13',
    clientId: 'cli_1004',
    salutation: 'mr',
    name: 'Nicolas Weber',
    role: 'technical_contact',
    email: 'n.weber@donau-logistics.test',
  },
  {
    id: 'pty_14',
    caseId: 'case_6004',
    name: 'Apex Onboarding Desk',
    role: 'project_manager',
    email: 'onboarding@apex-tech.test',
  },
  {
    id: 'pty_15',
    clientId: 'cli_1011',
    salutation: 'mr',
    name: 'Oliver Mayer',
    role: 'account_manager',
    email: 'o.mayer@sonnenkraft.test',
  },
];

const INITIAL_TASKS: TaskRecord[] = [
  {
    id: 'tsk_1',
    parentId: 'cli_1001',
    parentType: 'client',
    title: 'Send renewal proposal',
    assignee: 'Anna Hofer',
    dueDate: '2024-12-15',
    status: 'Pending',
  },
  {
    id: 'tsk_2',
    parentId: 'cli_1001',
    parentType: 'client',
    title: 'Schedule QBR',
    assignee: 'Markus Leitner',
    dueDate: '2024-12-20',
    status: 'Active',
  },
  {
    id: 'tsk_3',
    parentId: 'prj_5001',
    parentType: 'project',
    title: 'UAT sign-off',
    assignee: 'Anna Hofer',
    dueDate: '2025-01-10',
    status: 'Pending',
  },
  {
    id: 'tsk_4',
    parentId: 'prj_5001',
    parentType: 'project',
    title: 'Data migration dry run',
    assignee: 'Nina Weiss',
    dueDate: '2024-12-08',
    status: 'Active',
  },
  {
    id: 'tsk_5',
    parentId: 'ord_2001',
    parentType: 'order',
    title: 'Confirm delivery address',
    assignee: 'Anna Hofer',
    dueDate: '2024-11-10',
    status: 'Completed',
  },
  {
    id: 'tsk_6',
    parentId: 'case_6001',
    parentType: 'case',
    title: 'Reconcile November invoices',
    assignee: 'Markus Leitner',
    dueDate: '2024-12-08',
    status: 'Active',
  },
  {
    id: 'tsk_7',
    parentId: 'case_6003',
    parentType: 'case',
    title: 'Publish status page update',
    assignee: 'Nina Weiss',
    dueDate: '2024-11-16',
    status: 'Pending',
  },
  {
    id: 'tsk_8',
    parentId: 'prj_5002',
    parentType: 'project',
    title: 'Prepare stakeholder comms',
    assignee: 'Anna Hofer',
    dueDate: '2025-01-30',
    status: 'Active',
  },
  {
    id: 'tsk_9',
    parentId: 'ord_2005',
    parentType: 'order',
    title: 'Verify PO linkage',
    assignee: 'Markus Leitner',
    dueDate: '2025-01-05',
    status: 'Pending',
  },
  {
    id: 'tsk_10',
    parentId: 'case_6006',
    parentType: 'case',
    title: 'Align billing and support teams',
    assignee: 'Nina Weiss',
    dueDate: '2024-12-20',
    status: 'Active',
  },
  {
    id: 'tsk_11',
    parentId: 'cli_1006',
    parentType: 'client',
    title: 'Review contract expiry reminders',
    assignee: 'Yvonne Pfeiffer',
    dueDate: '2024-12-22',
    status: 'Pending',
  },
  {
    id: 'tsk_12',
    parentId: 'ord_2009',
    parentType: 'order',
    title: 'Confirm data migration cutover window',
    assignee: 'Carina Lechner',
    dueDate: '2024-12-24',
    status: 'Active',
  },
  {
    id: 'tsk_13',
    parentId: 'case_6007',
    parentType: 'case',
    title: 'Validate legal addendum references',
    assignee: 'Nina Weiss',
    dueDate: '2024-12-26',
    status: 'Pending',
  },
  {
    id: 'tsk_14',
    parentId: 'prj_5006',
    parentType: 'project',
    title: 'Prepare on-site training materials',
    assignee: 'Ilona Bauer',
    dueDate: '2024-12-27',
    status: 'Active',
  },
  {
    id: 'tsk_15',
    parentId: 'ord_2002',
    parentType: 'order',
    title: 'Update line item notes',
    assignee: 'Markus Leitner',
    dueDate: '2024-12-28',
    status: 'Completed',
  },
  {
    id: 'tsk_16',
    parentId: 'cli_1001',
    parentType: 'client',
    title: 'Prepare Q1 renewal materials',
    assignee: 'Anna Hofer',
    dueDate: '2025-01-02',
    status: 'Pending',
  },
];

const INITIAL_ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: 'org_apex',
    name: 'Apex Technologies GmbH',
    slug: 'apex-tech',
    plan: 'Enterprise',
    status: 'Active',
    environment: 'Production',
    region: 'EU · Vienna',
    billingEmail: 'billing@apex-tech.test',
    ownerName: 'Anna Hofer',
    memberCount: 12,
    createdAt: '2023-06-12',
  },
  {
    id: 'org_demo',
    name: 'Oktavius Demo Org',
    slug: 'oktavius-demo',
    plan: 'Professional',
    status: 'Active',
    environment: 'Sandbox',
    region: 'EU · Frankfurt',
    billingEmail: 'demo@oktavius.test',
    ownerName: 'Anna Hofer',
    memberCount: 5,
    createdAt: '2024-01-08',
  },
  {
    id: 'org_west',
    name: 'West Region Branch',
    slug: 'west-region',
    plan: 'Starter',
    status: 'Trial',
    environment: 'Trial',
    region: 'EU · Munich',
    billingEmail: 'ops@west-region.test',
    ownerName: 'Nina Weiss',
    memberCount: 3,
    createdAt: '2024-09-01',
  },
  {
    id: 'org_nordic',
    name: 'Nordic Logistics AS',
    slug: 'nordic-logistics',
    plan: 'Professional',
    status: 'Active',
    environment: 'Production',
    region: 'Nordics · Oslo',
    billingEmail: 'finance@nordic-logistics.test',
    ownerName: 'Markus Leitner',
    memberCount: 8,
    createdAt: '2024-03-18',
  },
  {
    id: 'org_alpine',
    name: 'Alpine Services Co-op',
    slug: 'alpine-services',
    plan: 'Starter',
    status: 'Suspended',
    environment: 'Production',
    region: 'EU · Innsbruck',
    billingEmail: 'admin@alpine-services.test',
    ownerName: 'Markus Leitner',
    memberCount: 2,
    createdAt: '2023-11-22',
  },
  {
    id: ORG_KUNZ_ID,
    name: 'Bestattung Kunz',
    slug: 'bestattung-kunz',
    plan: 'Professional',
    status: 'Active',
    environment: 'Production',
    region: 'AT · Niederösterreich',
    billingEmail: 'office@kunz.at',
    ownerName: 'Klaus Ostermann',
    memberCount: 4,
    createdAt: '2018-03-15',
  },
];

const DEMO_MANAGER_PERMISSIONS = [
  'org.manage',
  'org.members.manage',
  'records.delete',
  'contacts.view',
  'contacts.update',
  'documents.view',
  'email.view_own',
  'calendar-v2.view',
] as const;

const DEMO_MEMBER_PERMISSIONS = [
  'contacts.view',
  'contacts.update',
  'documents.view',
  'email.view_own',
  'calendar-v2.view',
] as const;

function demoPermissionsForRole(role: OrgMembershipRecord['role']) {
  return [...(role === 'Member' ? DEMO_MEMBER_PERMISSIONS : DEMO_MANAGER_PERMISSIONS)];
}

function demoMembership(membership: Omit<OrgMembershipRecord, 'permissions'>): OrgMembershipRecord {
  return {
    ...membership,
    permissions: demoPermissionsForRole(membership.role),
  };
}

const INITIAL_ORG_MEMBERSHIPS: OrgMembershipRecord[] = [
  demoMembership({ id: 'mbr_1', orgId: 'org_apex', userId: 'usr_1001', role: 'Owner' }),
  demoMembership({ id: 'mbr_2', orgId: 'org_demo', userId: 'usr_1001', role: 'Admin' }),
  demoMembership({ id: 'mbr_3', orgId: 'org_apex', userId: 'usr_1002', role: 'Admin' }),
  demoMembership({ id: 'mbr_4', orgId: 'org_west', userId: 'usr_1002', role: 'Member' }),
  demoMembership({ id: 'mbr_5', orgId: 'org_west', userId: 'usr_1003', role: 'Owner' }),
  demoMembership({ id: 'mbr_6', orgId: 'org_nordic', userId: 'usr_1002', role: 'Owner' }),
  demoMembership({ id: 'mbr_7', orgId: 'org_nordic', userId: 'usr_1003', role: 'Member' }),
  demoMembership({ id: 'mbr_8', orgId: 'org_alpine', userId: 'usr_1002', role: 'Owner' }),
  demoMembership({ id: 'mbr_kunz_1', orgId: ORG_KUNZ_ID, userId: 'usr_1001', role: 'Admin' }),
  demoMembership({
    id: 'mbr_kunz_2',
    orgId: ORG_KUNZ_ID,
    userId: 'usr_kunz_owner',
    role: 'Owner',
  }),
  demoMembership({
    id: 'mbr_kunz_3',
    orgId: ORG_KUNZ_ID,
    userId: 'usr_kunz_member1',
    role: 'Admin',
  }),
  demoMembership({
    id: 'mbr_kunz_4',
    orgId: ORG_KUNZ_ID,
    userId: 'usr_kunz_member2',
    role: 'Member',
  }),
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr_1001',
    name: 'Anna Hofer',
    email: 'anna.hofer@osiris.test',
    role: 'Admin',
    status: 'Active',
    team: 'Operations',
    isSuperadmin: true,
  },
  {
    id: 'usr_1002',
    name: 'Markus Leitner',
    email: 'markus.leitner@osiris.test',
    role: 'Manager',
    status: 'Pending',
    team: 'Projects',
  },
  {
    id: 'usr_1003',
    name: 'Nina Weiss',
    email: 'nina.weiss@osiris.test',
    role: 'Member',
    status: 'Suspended',
    team: 'Support',
  },
  {
    id: 'usr_1004',
    name: 'Platform Admin',
    email: 'superadmin@oktavius.test',
    role: 'Admin',
    status: 'Active',
    team: 'Platform',
    isSuperadmin: true,
  },
];

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserRecord[]>([...INITIAL_USERS, ...KUNZ_USERS]);
  const usersRef = useRef(users);
  usersRef.current = users;
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>(INITIAL_ORGANIZATIONS);
  const organizationsRef = useRef(organizations);
  organizationsRef.current = organizations;
  const [orgMemberships] = useState<OrgMembershipRecord[]>(INITIAL_ORG_MEMBERSHIPS);
  const [activeOrgId, setActiveOrgIdState] = useState(() => {
    if (typeof window === 'undefined') return ORG_APEX_ID;
    const params = new URLSearchParams(window.location.search);
    if (params.get('org') === 'bestattung-kunz') return ORG_KUNZ_ID;
    if (params.get('org') === 'oktavius-demo') return ORG_DEMO_ID;
    return ORG_APEX_ID;
  });
  const setActiveOrgId = useCallback((orgId: string) => {
    setActiveOrgIdState((current) => (current === orgId ? current : orgId));
    safeStorageSet(getWindowStorage('sessionStorage'), 'oktavius.demoActiveOrgId', orgId);
    const profile = getOrgProfile(orgId);
    const defaultLocationId = profile.locations[0]?.id;
    if (defaultLocationId) {
      safeStorageSet(
        getWindowStorage('localStorage'),
        'oktavius.activeLocationId',
        defaultLocationId,
      );
    }
  }, []);
  const [clients, setClients] = useState<ClientRecord[]>([
    ...tagOrg(INITIAL_CLIENTS, ORG_APEX_ID),
    ...KUNZ_CLIENTS,
  ]);
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const [products, setProducts] = useState<ProductRecord[]>([
    ...tagOrg(INITIAL_PRODUCTS, ORG_APEX_ID),
    ...KUNZ_PRODUCTS,
  ]);
  const productsRef = useRef(products);
  productsRef.current = products;
  const [cases, setCases] = useState<CaseRecord[]>([
    ...tagOrg(INITIAL_CASES, ORG_APEX_ID),
    ...KUNZ_CASES,
  ]);
  const casesRef = useRef(cases);
  casesRef.current = cases;
  const [parties, setParties] = useState<PartyRecord[]>([...INITIAL_PARTIES, ...KUNZ_PARTIES]);
  const partiesRef = useRef(parties);
  partiesRef.current = parties;
  const [caseChecklists, setCaseChecklists] = useState<CaseChecklistItem[]>([
    ...INITIAL_CASE_CHECKLISTS,
    ...KUNZ_CASE_CHECKLISTS,
  ]);
  const caseChecklistsRef = useRef(caseChecklists);
  caseChecklistsRef.current = caseChecklists;
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(tagOrg(INITIAL_INVOICES, ORG_APEX_ID));
  const invoicesRef = useRef(invoices);
  invoicesRef.current = invoices;
  const [orders, setOrders] = useState<OrderRecord[]>([
    ...tagOrg(INITIAL_ORDERS, ORG_APEX_ID),
    ...KUNZ_ORDERS,
  ]);
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const [contracts, setContracts] = useState<ContractRecord[]>(
    tagOrg(INITIAL_CONTRACTS, ORG_APEX_ID),
  );
  const contractsRef = useRef(contracts);
  contractsRef.current = contracts;
  const [incidents, setIncidents] = useState<IncidentRecord[]>(
    tagOrg(INITIAL_INCIDENTS, ORG_APEX_ID),
  );
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;
  const [projects, setProjects] = useState<ProjectRecord[]>([
    ...tagOrg(INITIAL_PROJECTS, ORG_APEX_ID),
    ...KUNZ_PROJECTS,
  ]);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const [contacts, setContacts] = useState<ContactRecord[]>([
    ...tagOrg(INITIAL_CONTACTS, ORG_APEX_ID),
    ...KUNZ_CONTACTS,
  ]);
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;
  const [vendors, setVendors] = useState<VendorRecord[]>(tagOrg(INITIAL_VENDORS, ORG_APEX_ID));
  const vendorsRef = useRef(vendors);
  vendorsRef.current = vendors;
  const [leads, setLeads] = useState<LeadRecord[]>(tagOrg(INITIAL_LEADS, ORG_APEX_ID));
  const leadsRef = useRef(leads);
  leadsRef.current = leads;
  const [staff, setStaff] = useState<StaffRecord[]>(tagOrg(INITIAL_STAFF, ORG_APEX_ID));
  const staffRef = useRef(staff);
  staffRef.current = staff;
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>(
    tagOrg(INITIAL_PURCHASE_ORDERS, ORG_APEX_ID),
  );
  const purchaseOrdersRef = useRef(purchaseOrders);
  purchaseOrdersRef.current = purchaseOrders;
  const allTasks = useMemo(() => [...tagOrg(INITIAL_TASKS, ORG_APEX_ID), ...KUNZ_TASKS], []);

  const value = useMemo<DemoDataContextValue>(() => {
    const removeByIds = <T extends { id: string }>(
      setter: Dispatch<SetStateAction<T[]>>,
      ids: string[],
    ) => {
      if (ids.length === 0) return;
      setter((current) => current.filter((row) => !ids.includes(row.id)));
    };

    const getUserOrganizations = (userId: string) => {
      const orgIds = orgMemberships
        .filter((membership) => membership.userId === userId)
        .map((membership) => membership.orgId);
      return organizations.filter((org) => orgIds.includes(org.id));
    };

    const getOrgMembers = (orgId: string) =>
      orgMemberships
        .filter((membership) => membership.orgId === orgId)
        .map((membership) => {
          const user = users.find((entry) => entry.id === membership.userId);
          if (!user) return null;
          return { ...membership, user };
        })
        .filter((entry): entry is OrgMembershipRecord & { user: UserRecord } => entry !== null);

    const platformUsers: PlatformUserRow[] = users.map((user) => {
      const orgs = getUserOrganizations(user.id);
      return {
        ...user,
        organizationCount: orgs.length,
        organizationNames: orgs.map((org) => org.name).join(', ') || '—',
      };
    });

    const orgProfile = getOrgProfile(activeOrgId);
    const activeOrganization =
      organizations.find((org) => org.id === activeOrgId) ?? organizations[0]!;
    const currentUser = users.find((user) => user.id === orgProfile.demoUserId) ?? users[0]!;
    const activeMembership =
      orgMemberships.find(
        (membership) => membership.orgId === activeOrgId && membership.userId === currentUser.id,
      ) ?? null;

    const orgClients = filterForOrg(clients, activeOrgId);
    const orgProducts = filterForOrg(products, activeOrgId);
    const orgCases = filterForOrg(cases, activeOrgId);
    const orgOrders = filterForOrg(orders, activeOrgId);
    const orgProjects = filterForOrg(projects, activeOrgId);
    const orgInvoices = filterForOrg(invoices, activeOrgId);
    const orgContracts = filterForOrg(contracts, activeOrgId);
    const orgIncidents = filterForOrg(incidents, activeOrgId);
    const orgTasks = filterForOrg(allTasks, activeOrgId);
    const orgContacts = filterForOrg(contacts, activeOrgId);
    const orgVendors = filterForOrg(vendors, activeOrgId);
    const orgLeads = filterForOrg(leads, activeOrgId);
    const orgStaff = filterForOrg(staff, activeOrgId);
    const orgPurchaseOrders = filterForOrg(purchaseOrders, activeOrgId);
    const orgCaseIds = new Set(orgCases.map((entry) => entry.id));
    const orgParties = parties.filter((party) => !party.caseId || orgCaseIds.has(party.caseId));
    const orgCaseChecklists = caseChecklists.filter((item) => orgCaseIds.has(item.caseId));

    return {
      users,
      createUser: (input) => {
        const next: UserRecord = {
          id: `usr_${Date.now()}`,
          ...input,
        };
        setUsers((current) => [next, ...current]);
        return next;
      },
      updateUser: (userId, input) => {
        let updated: UserRecord | null = null;
        setUsers((current) =>
          current.map((entry) => {
            if (entry.id !== userId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      organizations,
      orgMemberships,
      activeOrgId,
      setActiveOrgId,
      currentUser,
      activeMembership,
      activeOrganization,
      createOrganization: (input) => {
        const next: OrganizationRecord = {
          id: `org_${Date.now()}`,
          memberCount: 1,
          createdAt: new Date().toISOString().slice(0, 10),
          ...input,
        };
        setOrganizations((current) => [next, ...current]);
        return next;
      },
      getOrgMembers,
      getUserOrganizations,
      platformUsers,
      clients: orgClients,
      createClient: (input) => {
        const next: ClientRecord = {
          id: `cli_${Date.now()}`,
          orgId: activeOrgId,
          createdAt: new Date().toISOString().slice(0, 10),
          ...input,
        };
        setClients((current) => [next, ...current]);
        return next;
      },
      updateClient: (clientId, input) => {
        let updated: ClientRecord | null = null;
        setClients((current) =>
          current.map((entry) => {
            if (entry.id !== clientId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      orders: orgOrders,
      orderLines: INITIAL_ORDER_LINES,
      invoices: orgInvoices,
      updateInvoice: (invoiceId, input) => {
        let updated: InvoiceRecord | null = null;
        setInvoices((current) =>
          current.map((entry) => {
            if (entry.id !== invoiceId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      products: orgProducts,
      createProduct: (input) => {
        const next: ProductRecord = { id: `prd_${Date.now()}`, orgId: activeOrgId, ...input };
        setProducts((current) => [next, ...current]);
        return next;
      },
      updateProduct: (productId, input) => {
        let updated: ProductRecord | null = null;
        setProducts((current) =>
          current.map((entry) => {
            if (entry.id !== productId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      projects: orgProjects,
      updateProject: (projectId, input) => {
        let updated: ProjectRecord | null = null;
        setProjects((current) =>
          current.map((entry) => {
            if (entry.id !== projectId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      tasks: orgTasks,
      parties: orgParties,
      createParty: (input) => {
        const next: PartyRecord = {
          id: `pty_${Date.now()}`,
          ...input,
        };
        setParties((current) => [...current, next]);
        return next;
      },
      cases: orgCases,
      createCase: (input) => {
        const year = new Date().getFullYear();
        const seq = String(Date.now()).slice(-4);
        const caseNumber =
          orgProfile.industryKey === 'funeral' ? `KUNZ-${year}-${seq}` : `CASE-${year}-${seq}`;
        const next: CaseRecord = {
          id: `case_${Date.now()}`,
          orgId: activeOrgId,
          caseNumber,
          openedAt: new Date().toISOString().slice(0, 10),
          slaStatus: 'ok',
          ...input,
        };
        setCases((current) => [next, ...current]);
        return next;
      },
      updateCase: (caseId, input) => {
        let updated: CaseRecord | null = null;
        setCases((current) =>
          current.map((entry) => {
            if (entry.id !== caseId) return entry;
            const client = input.clientName
              ? orgClients.find((c) => c.name === input.clientName)
              : undefined;
            updated = {
              ...entry,
              ...input,
              ...(client ? { clientId: client.id, clientName: client.name } : {}),
            };
            return updated;
          }),
        );
        return updated;
      },
      updateCaseStage: (caseId, stage) => {
        setCases((current) =>
          current.map((entry) => (entry.id === caseId ? { ...entry, stage } : entry)),
        );
      },
      caseChecklists: orgCaseChecklists,
      toggleChecklistItem: (id, done) => {
        setCaseChecklists((current) =>
          current.map((item) => (item.id === id ? { ...item, done } : item)),
        );
      },
      createChecklistItem: (input) => {
        const next: CaseChecklistItem = {
          id: `chk_${Date.now()}`,
          done: false,
          ...input,
        };
        setCaseChecklists((current) => [...current, next]);
        return next;
      },
      incidents: orgIncidents,
      updateIncident: (incidentId, input) => {
        let updated: IncidentRecord | null = null;
        setIncidents((current) =>
          current.map((entry) => {
            if (entry.id !== incidentId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      contracts: orgContracts,
      updateContract: (contractId, input) => {
        let updated: ContractRecord | null = null;
        setContracts((current) =>
          current.map((entry) => {
            if (entry.id !== contractId) return entry;
            updated = { ...entry, ...input };
            return updated;
          }),
        );
        return updated;
      },
      removeUsers: (ids) => removeByIds(setUsers, ids),
      removeClients: (ids) => removeByIds(setClients, ids),
      removeProducts: (ids) => removeByIds(setProducts, ids),
      removeCases: (ids) => removeByIds(setCases, ids),
      removeInvoices: (ids) => removeByIds(setInvoices, ids),
      removeOrders: (ids) => removeByIds(setOrders, ids),
      removeContracts: (ids) => removeByIds(setContracts, ids),
      removeIncidents: (ids) => removeByIds(setIncidents, ids),
      removeProjects: (ids) => removeByIds(setProjects, ids),
      contacts: orgContacts,
      vendors: orgVendors,
      leads: orgLeads,
      staff: orgStaff,
      purchaseOrders: orgPurchaseOrders,
      findClientById: (id) => (id ? (clients.find((entry) => entry.id === id) ?? null) : null),
      findCaseById: (id) => (id ? (cases.find((entry) => entry.id === id) ?? null) : null),
      findProductById: (id) => (id ? (products.find((entry) => entry.id === id) ?? null) : null),
      findOrderById: (id) => (id ? (orders.find((entry) => entry.id === id) ?? null) : null),
      findProjectById: (id) => (id ? (projects.find((entry) => entry.id === id) ?? null) : null),
      findInvoiceById: (id) => (id ? (invoices.find((entry) => entry.id === id) ?? null) : null),
      findContractById: (id) => (id ? (contracts.find((entry) => entry.id === id) ?? null) : null),
      findIncidentById: (id) => (id ? (incidents.find((entry) => entry.id === id) ?? null) : null),
      findUserById: (id) => (id ? (users.find((entry) => entry.id === id) ?? null) : null),
    };
  }, [
    users,
    organizations,
    orgMemberships,
    activeOrgId,
    setActiveOrgId,
    clients,
    products,
    cases,
    parties,
    caseChecklists,
    invoices,
    orders,
    contracts,
    incidents,
    projects,
    allTasks,
    contacts,
    vendors,
    leads,
    staff,
    purchaseOrders,
  ]);

  const demoRegistry = useMemo<DemoApiRegistry>(() => {
    const getScopedRows = <T extends OrgScoped>(rows: T[]) => filterForOrg(rows, activeOrgId);

    const apiOrgProfile = getOrgProfile(activeOrgId);
    const apiCurrentUser =
      usersRef.current.find((user) => user.id === apiOrgProfile.demoUserId) ?? usersRef.current[0]!;
    const apiActiveMembership =
      orgMemberships.find(
        (membership) => membership.orgId === activeOrgId && membership.userId === apiCurrentUser.id,
      ) ?? null;

    const permissionedDemoRegistry = withPermissionedDemoApiRegistry(
      {
        cases: buildCasesDemoHandlers({
          activeOrgId,
          industryKey: getOrgProfile(activeOrgId).industryKey,
          getCases: () => getScopedRows(casesRef.current),
          getClients: () => getScopedRows(clientsRef.current),
          setCases,
        }),
        caseChecklists: buildCaseChecklistsDemoHandlers({
          getItems: () => caseChecklistsRef.current,
          setItems: setCaseChecklists,
        }),
        clients: buildClientsDemoHandlers({
          activeOrgId,
          getClients: () => getScopedRows(clientsRef.current),
          setClients,
        }),
        contracts: buildContractsDemoHandlers({
          activeOrgId,
          getContracts: () => getScopedRows(contractsRef.current),
          setContracts,
        }),
        incidents: buildIncidentsDemoHandlers({
          activeOrgId,
          getIncidents: () => getScopedRows(incidentsRef.current),
          setIncidents,
        }),
        invoices: buildInvoicesDemoHandlers({
          activeOrgId,
          getInvoices: () => getScopedRows(invoicesRef.current),
          setInvoices,
        }),
        orders: buildOrdersDemoHandlers({
          activeOrgId,
          getOrders: () => getScopedRows(ordersRef.current),
          setOrders,
        }),
        organizations: buildOrganizationsDemoHandlers({
          getOrganizations: () => organizationsRef.current,
          setOrganizations,
        }),
        parties: buildPartiesDemoHandlers({
          getParties: () => partiesRef.current,
          setParties,
        }),
        products: buildProductsDemoHandlers({
          activeOrgId,
          getProducts: () => getScopedRows(productsRef.current),
          setProducts,
        }),
        projects: buildProjectsDemoHandlers({
          activeOrgId,
          getProjects: () => getScopedRows(projectsRef.current),
          setProjects,
        }),
        users: buildUsersDemoHandlers({
          getUsers: () => usersRef.current,
          setUsers,
        }),
        contacts: buildContactsDemoHandlers({
          activeOrgId,
          getContacts: () => getScopedRows(contactsRef.current),
          setContacts,
        }),
        vendors: buildVendorsDemoHandlers({
          activeOrgId,
          getVendors: () => getScopedRows(vendorsRef.current),
          setVendors,
        }),
        leads: buildLeadsDemoHandlers({
          activeOrgId,
          getLeads: () => getScopedRows(leadsRef.current),
          setLeads,
        }),
        staff: buildStaffDemoHandlers({
          activeOrgId,
          getStaff: () => getScopedRows(staffRef.current),
          setStaff,
        }),
        purchasing: buildPurchasingDemoHandlers({
          activeOrgId,
          getPurchaseOrders: () => getScopedRows(purchaseOrdersRef.current),
          setPurchaseOrders,
        }),
      },
      permissionSubjectFor(apiCurrentUser, apiActiveMembership),
    );

    return createConfiguredApiRegistry({
      demoRegistry: permissionedDemoRegistry,
      env: import.meta.env,
    });
  }, [activeOrgId, orgMemberships]);

  return (
    <DemoDataContext.Provider value={value}>
      <ApiProvider registry={demoRegistry}>{children}</ApiProvider>
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used inside DemoDataProvider');
  }
  return context;
}
