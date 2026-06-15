import type { LocationDetailItem } from '@/lib/locations/types';

/** Modules that actually exist in the app shell (mirrors APP_NAV_MODULES ids). */
export type OrgModuleId =
  | 'dashboard'
  | 'ai-chat'
  | 'email'
  | 'calendar'
  | 'storage'
  | 'members'
  | 'settings'
  | 'showcase'
  | 'support';

/** Free-form vocabulary map; industry presets fill it per locale. */
export type OrgTerminology = Record<string, string>;

export type OrgProfile = {
  id: string;
  slug: string;
  name: string;
  /** Industry preset key (see lib/org-profiles/presets). Unknown keys fall back to generic. */
  industryKey: string;
  enabledModules: OrgModuleId[];
  /** When set, sidebar uses Osiris module URLs (e.g. /funeral/cases) keyed by module/entity id. */
  navPaths?: Partial<Record<string, string>>;
  terminology: OrgTerminology;
  locations: LocationDetailItem[];
  tagline: string;
  /** Brand title shown in the app shell; defaults to the product name when unset. */
  brandTitle?: string;
  /** Dashboard layout/content variant; defaults to generic when unset. */
  dashboardVariant?: string;
};
