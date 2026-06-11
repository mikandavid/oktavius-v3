import type { ClientStatus, ClientType } from '@oktavius/reference-data';

import type { CustomFieldValues } from '@/lib/custom-fields';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Member';
  status: 'Active' | 'Pending' | 'Suspended';
  team: string;
  isSuperadmin?: boolean;
};

export type OrgPlan = 'Starter' | 'Professional' | 'Enterprise';
export type OrgStatus = 'Active' | 'Trial' | 'Suspended' | 'Churned';
export type OrgEnvironment = 'Production' | 'Sandbox' | 'Trial';

export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  status: OrgStatus;
  environment: OrgEnvironment;
  region: string;
  billingEmail: string;
  ownerName: string;
  memberCount: number;
  createdAt: string;
};

export type OrgMembershipRecord = {
  id: string;
  orgId: string;
  userId: string;
  role: 'Owner' | 'Admin' | 'Member';
  permissions: string[];
};

export type CaseType =
  | 'Support'
  | 'Legal'
  | 'Billing'
  | 'Onboarding'
  | 'Erdbestattung'
  | 'Feuerbestattung'
  | 'Vorsorge'
  | 'Urne';

export type CaseStage =
  | 'Intake'
  | 'Investigation'
  | 'Resolution'
  | 'Closed'
  | 'Aufnahme'
  | 'Planung'
  | 'Durchführung'
  | 'Abgeschlossen';

export type OrgScoped = {
  orgId?: string;
  siteId?: string | null;
};

export type ClientRecord = OrgScoped & {
  id: string;
  name: string;
  type: ClientType;
  industry: string;
  status: ClientStatus;
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  tags: string[];
  notes: string;
  annualRevenue: string;
  contractStart: string;
  contractEnd: string;
  accountManager: string;
  createdAt: string;
  customFields?: CustomFieldValues;
};

export type OrderRecord = OrgScoped & {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  status: 'Draft' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: string;
  orderDate: string;
  dueDate: string;
  owner: string;
  lineCount: number;
};

export type ProductRecord = OrgScoped & {
  id: string;
  sku: string;
  name: string;
  category: string;
  status: 'Active' | 'Discontinued' | 'Draft';
  currency: string;
  price: string;
  stock: number;
  unit: string;
};

export type ProjectRecord = OrgScoped & {
  id: string;
  name: string;
  clientName: string;
  status: 'Planning' | 'Active' | 'On hold' | 'Completed';
  manager: string;
  startDate: string;
  endDate: string;
  budget: string;
  completion: number;
};

export type TaskRecord = OrgScoped & {
  id: string;
  parentId: string;
  parentType: 'client' | 'project' | 'order' | 'case';
  title: string;
  assignee: string;
  dueDate: string;
  status: 'Pending' | 'Active' | 'Completed';
};

export type PartyRecord = {
  id: string;
  clientId?: string;
  caseId?: string;
  salutation?: string;
  name: string;
  role: string;
  email: string;
};

export type CaseRecord = OrgScoped & {
  id: string;
  caseNumber: string;
  title: string;
  type: CaseType;
  stage: CaseStage;
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  clientId: string;
  clientName: string;
  assignee: string;
  openedAt: string;
  dueAt: string;
  slaStatus: 'ok' | 'warning' | 'breach';
  summary: string;
  deceasedName?: string;
  dateOfDeath?: string;
  arrangementType?: string;
  burialSite?: string;
  locationSite?: string;
};

export type ContactRecord = OrgScoped & {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  clientId: string | null;
  clientName: string | null;
  status: 'Active' | 'Inactive';
  source: 'Manual' | 'Import' | 'Referral';
  tags: string[];
  notes: string;
  createdAt: string;
};

export type VendorRecord = OrgScoped & {
  id: string;
  name: string;
  category: 'Materials' | 'Services' | 'Logistics' | 'Technology' | 'Other';
  status: 'Active' | 'Preferred' | 'Inactive';
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  paymentTerms: string;
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
  tags: string[];
  notes: string;
  createdAt: string;
};

export type LeadRecord = OrgScoped & {
  id: string;
  title: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  source: 'Website' | 'Referral' | 'Cold outreach' | 'Event' | 'Partner';
  stage: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  value: number;
  currency: 'EUR' | 'USD';
  probability: number;
  assignedTo: string;
  expectedCloseDate: string;
  notes: string;
  createdAt: string;
};

export type StaffRecord = OrgScoped & {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contractor';
  status: 'Active' | 'On leave' | 'Inactive';
  startDate: string;
  managerId: string | null;
  managerName: string | null;
  tags: string[];
  notes: string;
  createdAt: string;
};

export type PurchaseOrderRecord = OrgScoped & {
  id: string;
  poNumber: string;
  vendorId: string | null;
  vendorName: string;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Received' | 'Cancelled';
  total: number;
  currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
  requestedBy: string;
  expectedDelivery: string;
  notes: string;
  createdAt: string;
};

export type CaseChecklistItem = {
  id: string;
  caseId: string;
  label: string;
  done: boolean;
  required: boolean;
};
