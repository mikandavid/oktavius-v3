import type { OrgModuleId, OrgProfile, OrgTerminology } from './types';

export const GENERIC_TERMINOLOGY: OrgTerminology = {
  cases: 'Cases',
  casesSingular: 'Case',
  clients: 'Clients',
  clientsSingular: 'Client',
  products: 'Products',
  orders: 'Orders',
  projects: 'Projects',
  documents: 'Documents',
  dashboard: 'Dashboard',
};

export const FUNERAL_TERMINOLOGY: OrgTerminology = {
  cases: 'Cases',
  casesSingular: 'Case',
  clients: 'Contacts',
  clientsSingular: 'Contact',
  products: 'Products',
  orders: 'Sales',
  projects: 'Bereavement cases',
  documents: 'Storage',
  dashboard: 'Overview',
};

const DEFAULT_ORG_MODULES: OrgModuleId[] = [
  'dashboard',
  'ai-chat',
  'email',
  'calendar',
  'reports',
  'settings',
];

export function createDefaultOrgProfile(orgId?: string | null): OrgProfile {
  const id = orgId?.trim() || 'workspace';
  return {
    id,
    slug: id === 'workspace' ? 'workspace' : id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: 'Workspace',
    industryKey: 'generic',
    enabledModules: DEFAULT_ORG_MODULES,
    terminology: GENERIC_TERMINOLOGY,
    locations: [],
    tagline: '',
  };
}

export const DEFAULT_ORG_PROFILE = createDefaultOrgProfile();
export const ORG_PROFILES: Record<string, OrgProfile> = {};

export function getOrgProfile(orgId: string | null | undefined): OrgProfile {
  if (!orgId) return DEFAULT_ORG_PROFILE;
  return ORG_PROFILES[orgId] ?? createDefaultOrgProfile(orgId);
}

export function isFuneralOrg(orgId: string): boolean {
  return getOrgProfile(orgId).industryKey === 'funeral';
}
