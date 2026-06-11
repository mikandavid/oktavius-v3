import { createElement, type ReactNode } from 'react';

import {
  CalendarIcon,
  CaseIcon,
  ContractIcon,
  DocumentIcon,
  EmailIcon,
  FolderIcon,
  IncidentIcon,
  InvoiceIcon,
  OrderIcon,
  OrganizationIcon,
  ProductIcon,
  ProjectIcon,
  ProjectsIcon,
  ReportsIcon,
  SearchIcon,
  TeamIcon,
  UserIcon,
  UsersIcon,
  type IconProps,
  type PhosphorIcon,
} from '@/lib/icons';
import type { SearchRuntimeAdapter } from '@/lib/search/SearchRuntime';
import type { SearchResult } from '@/lib/search/types';

import { joinOsirisApiBaseUrl } from './apiBaseUrl';

export type OsirisSearchFetcher = (input: string, init?: RequestInit) => Promise<Response>;

type CreateOsirisSearchRuntimeOptions = {
  baseUrl?: string;
  fetcher?: OsirisSearchFetcher;
  limit?: number;
  types?: string[];
};

function getDefaultFetcher(): OsirisSearchFetcher {
  if (typeof fetch !== 'function') {
    throw new Error('No fetch implementation is available for Osiris search.');
  }

  return fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function titleCase(input: string) {
  return input
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const TYPE_ALIASES: Record<string, string> = {
  case: 'cases',
  client: 'clients',
  contact: 'contacts',
  contract: 'contracts',
  customer: 'customers',
  document: 'documents',
  document_file: 'documents',
  email_message: 'email',
  file: 'documents',
  funeral_case: 'funeral_cases',
  incident: 'incidents',
  invoice: 'invoices',
  lead: 'leads',
  location: 'locations',
  order: 'orders',
  product: 'products',
  project: 'projects',
  report: 'reports',
  staff_member: 'staff',
  supplier: 'vendors',
  task: 'tasks',
  user: 'users',
  vendor: 'vendors',
};

const TYPE_LABELS: Record<string, string> = {
  cases: 'Cases',
  clients: 'Clients',
  contacts: 'Contacts',
  contracts: 'Contracts',
  customers: 'Customers',
  documents: 'Documents',
  email: 'Email',
  funeral_cases: 'Funeral cases',
  incidents: 'Incidents',
  invoices: 'Invoices',
  leads: 'Leads',
  locations: 'Locations',
  orders: 'Orders',
  products: 'Products',
  projects: 'Projects',
  reports: 'Reports',
  staff: 'Staff',
  tasks: 'Tasks',
  users: 'Users',
  vendors: 'Vendors',
};

const SEARCH_ICON_CLASS = 'text-muted-foreground';

const ICON_ALIASES: Record<string, PhosphorIcon> = {
  calendar: CalendarIcon,
  case: CaseIcon,
  cases: CaseIcon,
  client: ProjectsIcon,
  clients: ProjectsIcon,
  contact: UserIcon,
  contacts: UserIcon,
  contract: ContractIcon,
  contracts: ContractIcon,
  customer: OrganizationIcon,
  customers: OrganizationIcon,
  document: DocumentIcon,
  documents: DocumentIcon,
  'document-file': DocumentIcon,
  document_file: DocumentIcon,
  email: EmailIcon,
  'email-message': EmailIcon,
  email_message: EmailIcon,
  file: DocumentIcon,
  folder: FolderIcon,
  funeral_case: CaseIcon,
  funeral_cases: CaseIcon,
  incident: IncidentIcon,
  incidents: IncidentIcon,
  invoice: InvoiceIcon,
  invoices: InvoiceIcon,
  order: OrderIcon,
  orders: OrderIcon,
  organization: OrganizationIcon,
  organizations: OrganizationIcon,
  product: ProductIcon,
  products: ProductIcon,
  project: ProjectIcon,
  projects: ProjectIcon,
  report: ReportsIcon,
  reports: ReportsIcon,
  staff: TeamIcon,
  team: TeamIcon,
  user: UserIcon,
  users: UsersIcon,
  vendor: OrganizationIcon,
  vendors: OrganizationIcon,
};

function normalizeIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readResultType(value: Record<string, unknown>) {
  const rawType =
    readString(value.entityType) ??
    readString(value.entity_type) ??
    readString(value.resourceType) ??
    readString(value.resource_type) ??
    readString(value.type) ??
    'records';
  const normalized = normalizeIdentifier(rawType);
  return TYPE_ALIASES[normalized] ?? normalized;
}

function labelForType(type: string) {
  return TYPE_LABELS[type] ?? titleCase(type);
}

function iconForResult(value: Record<string, unknown>, type: string): ReactNode | undefined {
  const rawIcon = readString(value.icon);
  const iconKey = rawIcon ? normalizeIdentifier(rawIcon) : type;
  const Icon = ICON_ALIASES[iconKey] ?? ICON_ALIASES[type] ?? SearchIcon;

  return createElement(Icon, {
    size: 16,
    className: SEARCH_ICON_CLASS,
  } satisfies IconProps);
}

function normalizeInternalRoute(value: string | null) {
  if (!value) return null;
  if (value.startsWith('//')) return null;

  if (value.startsWith('/')) {
    return value;
  }

  if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
    try {
      const url = new URL(value);
      return url.origin === window.location.origin
        ? `${url.pathname}${url.search}${url.hash}`
        : null;
    } catch {
      return null;
    }
  }

  return `/${value.replace(/^\/+/, '')}`;
}

function resultHref(value: Record<string, unknown>, type: string, id: string) {
  return (
    normalizeInternalRoute(readString(value.href)) ??
    normalizeInternalRoute(readString(value.url)) ??
    normalizeInternalRoute(readString(value.path)) ??
    `/${encodeURIComponent(type)}/${encodeURIComponent(id)}`
  );
}

function resultRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function normalizeSearchResult(value: unknown): SearchResult | null {
  if (!isRecord(value)) return null;

  const type = readResultType(value);
  const id = readString(value.id);
  const title = readString(value.title) ?? readString(value.label) ?? readString(value.name);
  if (!id || !title) return null;

  return {
    id: `${type}:${id}`,
    title,
    subtitle: readString(value.subtitle) ?? readString(value.description) ?? undefined,
    icon: iconForResult(value, type),
    href: resultHref(value, type, id),
    groupId: labelForType(type),
  };
}

async function parseJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Osiris search request failed with ${response.status}`);
  }

  return (await response.json()) as unknown;
}

export function createOsirisSearchRuntime({
  baseUrl,
  fetcher = getDefaultFetcher(),
  limit = 8,
  types,
}: CreateOsirisSearchRuntimeOptions = {}): SearchRuntimeAdapter {
  return {
    async search(query, signal) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery || signal.aborted) return [];

      const params = new URLSearchParams({
        q: trimmedQuery,
        limit: String(limit),
      });
      if (types?.length) params.set('types', types.join(','));

      const response = await fetcher(joinOsirisApiBaseUrl(baseUrl, `/search?${params}`), {
        credentials: 'include',
        signal,
      });
      const payload = await parseJson(response);
      if (signal.aborted) return [];

      return resultRows(payload)
        .map(normalizeSearchResult)
        .filter((item) => item !== null);
    },
  };
}
