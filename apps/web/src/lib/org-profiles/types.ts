import type { LocationDetailItem } from '@/lib/locations/types';

export type OrgIndustryKey = 'generic' | 'funeral';

export type OrgModuleId =
  | 'dashboard'
  | 'ai-chat'
  | 'cases'
  | 'incidents'
  | 'clients'
  | 'contracts'
  | 'products'
  | 'projects'
  | 'orders'
  | 'invoices'
  | 'users'
  | 'documents'
  | 'email'
  | 'calendar'
  | 'tasks'
  | 'reports'
  | 'settings'
  | 'showcase'
  | 'superadmin'
  | 'contacts'
  | 'vendors'
  | 'leads'
  | 'staff'
  | 'purchasing';

export type OrgTerminology = {
  cases: string;
  casesSingular: string;
  clients: string;
  clientsSingular: string;
  products: string;
  orders: string;
  projects: string;
  documents: string;
  dashboard: string;
};

export type OrgProfile = {
  id: string;
  slug: string;
  name: string;
  industryKey: OrgIndustryKey;
  /** Demo user shown in the account menu when this org is active */
  demoUserId: string;
  enabledModules: OrgModuleId[];
  /** When set, sidebar uses Osiris module URLs (e.g. /funeral/cases). */
  navPaths?: Partial<Record<OrgModuleId, string>>;
  terminology: OrgTerminology;
  locations: LocationDetailItem[];
  tagline: string;
};
