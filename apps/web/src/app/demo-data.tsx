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
import { buildContractsDemoHandlers } from '@/api/demo-handlers/contracts';
import { buildIncidentsDemoHandlers } from '@/api/demo-handlers/incidents';
import { buildInvoicesDemoHandlers } from '@/api/demo-handlers/invoices';
import { buildOrdersDemoHandlers } from '@/api/demo-handlers/orders';
import { buildOrganizationsDemoHandlers } from '@/api/demo-handlers/organizations';
import { buildPartiesDemoHandlers } from '@/api/demo-handlers/parties';
import { buildProductsDemoHandlers } from '@/api/demo-handlers/products';
import { buildProjectsDemoHandlers } from '@/api/demo-handlers/projects';
import { buildUsersDemoHandlers } from '@/api/demo-handlers/users';
import { withPermissionedDemoApiRegistry } from '@/lib/apiPermissions';
import { ORG_APEX_ID, ORG_KUNZ_ID, getOrgProfile } from '@/lib/org-profiles/profiles';
import { permissionSubjectFor } from '@/lib/permissions';

import {
  KUNZ_CASE_CHECKLISTS,
  KUNZ_CASES,
  KUNZ_CLIENTS,
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
  OrderRecord,
  OrgMembershipRecord,
  OrgPlan,
  OrgScoped,
  OrgStatus,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  TaskRecord,
  UserRecord,
} from './demo-data/records';

import type {
  CaseChecklistItem,
  CaseRecord,
  ClientRecord,
  OrderRecord,
  OrgMembershipRecord,
  OrganizationRecord,
  PartyRecord,
  ProductRecord,
  ProjectRecord,
  TaskRecord,
  UserRecord,
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

function tagOrg<T extends OrgScoped>(rows: T[], orgId: string): T[] {
  return rows.map((row) => ({ ...row, orgId: row.orgId ?? orgId }));
}

function filterForOrg<T extends OrgScoped>(rows: T[], orgId: string): T[] {
  return rows.filter((row) => (row.orgId ?? ORG_APEX_ID) === orgId);
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

const INITIAL_ORG_MEMBERSHIPS: OrgMembershipRecord[] = [
  { id: 'mbr_1', orgId: 'org_apex', userId: 'usr_1001', role: 'Owner' },
  { id: 'mbr_2', orgId: 'org_demo', userId: 'usr_1001', role: 'Admin' },
  { id: 'mbr_3', orgId: 'org_apex', userId: 'usr_1002', role: 'Admin' },
  { id: 'mbr_4', orgId: 'org_west', userId: 'usr_1002', role: 'Member' },
  { id: 'mbr_5', orgId: 'org_west', userId: 'usr_1003', role: 'Owner' },
  { id: 'mbr_6', orgId: 'org_nordic', userId: 'usr_1002', role: 'Owner' },
  { id: 'mbr_7', orgId: 'org_nordic', userId: 'usr_1003', role: 'Member' },
  { id: 'mbr_8', orgId: 'org_alpine', userId: 'usr_1002', role: 'Owner' },
  { id: 'mbr_kunz_1', orgId: ORG_KUNZ_ID, userId: 'usr_1001', role: 'Admin' },
  { id: 'mbr_kunz_2', orgId: ORG_KUNZ_ID, userId: 'usr_kunz_owner', role: 'Owner' },
  { id: 'mbr_kunz_3', orgId: ORG_KUNZ_ID, userId: 'usr_kunz_member1', role: 'Admin' },
  { id: 'mbr_kunz_4', orgId: ORG_KUNZ_ID, userId: 'usr_kunz_member2', role: 'Member' },
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
    return ORG_APEX_ID;
  });
  const setActiveOrgId = useCallback((orgId: string) => {
    setActiveOrgIdState((current) => (current === orgId ? current : orgId));
    sessionStorage.setItem('oktavius.demoActiveOrgId', orgId);
    const profile = getOrgProfile(orgId);
    const defaultLocationId = profile.locations[0]?.id;
    if (defaultLocationId) {
      localStorage.setItem('oktavius.activeLocationId', defaultLocationId);
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
  ]);

  const demoRegistry = useMemo<DemoApiRegistry>(() => {
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
          getCases: () => casesRef.current,
          getClients: () =>
            clientsRef.current.filter((client) => (client.orgId ?? ORG_APEX_ID) === activeOrgId),
          setCases,
        }),
        caseChecklists: buildCaseChecklistsDemoHandlers({
          getItems: () => caseChecklistsRef.current,
          setItems: setCaseChecklists,
        }),
        clients: buildClientsDemoHandlers({
          activeOrgId,
          getClients: () => clientsRef.current,
          setClients,
        }),
        contracts: buildContractsDemoHandlers({
          activeOrgId,
          getContracts: () => contractsRef.current,
          setContracts,
        }),
        incidents: buildIncidentsDemoHandlers({
          activeOrgId,
          getIncidents: () => incidentsRef.current,
          setIncidents,
        }),
        invoices: buildInvoicesDemoHandlers({
          activeOrgId,
          getInvoices: () => invoicesRef.current,
          setInvoices,
        }),
        orders: buildOrdersDemoHandlers({
          activeOrgId,
          getOrders: () => ordersRef.current,
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
          getProducts: () => productsRef.current,
          setProducts,
        }),
        projects: buildProjectsDemoHandlers({
          activeOrgId,
          getProjects: () => projectsRef.current,
          setProjects,
        }),
        users: buildUsersDemoHandlers({
          getUsers: () => usersRef.current,
          setUsers,
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
