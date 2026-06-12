import type { OrgTerminology } from '../types';

/**
 * Industry preset: everything an industry contributes to an org profile.
 * Adding an industry = adding one preset file + one registry entry, no
 * component changes.
 */
export type OrgProfilePreset = {
  /** Vocabulary per UI locale; unknown locales fall back to English. */
  terminologyByLocale: Record<string, OrgTerminology>;
  /** Sidebar URL overrides keyed by module/entity id. */
  navPaths?: Partial<Record<string, string>>;
  /** Use the organization name as app-shell brand title. */
  brandTitleFromOrgName?: boolean;
  /** Dashboard layout/content variant consumed by DashboardPage. */
  dashboardVariant?: string;
};
