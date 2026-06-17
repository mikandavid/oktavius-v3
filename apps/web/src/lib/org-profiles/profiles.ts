import { presetFor } from './presets';
import type { OrgModuleId, OrgProfile } from './types';

const DEFAULT_ORG_MODULES: OrgModuleId[] = [
  'dashboard',
  'contacts',
  'ai-chat',
  'email',
  'calendar',
  'storage',
  'settings',
  'support',
  'changelog',
];

export function createDefaultOrgProfile(orgId?: string | null): OrgProfile {
  const id = orgId?.trim() || 'workspace';
  return {
    id,
    slug: id === 'workspace' ? 'workspace' : id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: 'Workspace',
    industryKey: 'generic',
    enabledModules: DEFAULT_ORG_MODULES,
    terminology: presetFor('generic').terminologyByLocale.en ?? {},
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
