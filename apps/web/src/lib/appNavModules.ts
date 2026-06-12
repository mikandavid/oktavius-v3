import type { ComponentType } from 'react';

import type { IconProps } from '@/lib/icons';
import {
  BotIcon,
  CalendarIcon,
  EmailIcon,
  HomeIcon,
  ReportsIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
} from '@/lib/icons';
import type { OrgModuleId, OrgProfile, OrgTerminology } from '@/lib/org-profiles/types';

import type { PermissionSubject } from './permissions';
import type { PermissionRequirement } from './permissions';
import { canAccessAppNavItem } from './permissions';

export type AppNavSection = 'primary' | 'modules' | 'admin';
export type AppNavRouteId = OrgModuleId;

export type AppNavModule = {
  id: AppNavRouteId;
  path: string;
  label: string;
  /** i18n key for the label (e.g. 'navigation.dashboard'). Resolved at render time; `label` is the fallback. */
  labelKey?: string;
  icon: ComponentType<IconProps>;
  section: AppNavSection;
  devOnly?: boolean;
  /** Only superadmins may access (overrides `permission`). */
  superadminOnly?: boolean;
  permission?: PermissionRequirement;
  terminologyKey?: keyof OrgTerminology;
  /** Lazy page loader; the router builds the module route from this. */
  loadPage: () => Promise<Record<string, ComponentType>>;
  /** Named export of the page component inside the loaded module. */
  pageExport: string;
};

export type AppQuickAction = {
  label: string;
  path: string;
  routeId: OrgModuleId;
};

/**
 * Static module manifest — single source for navigation AND routing.
 * The router generates one lazy route per entry; access is declared via
 * `permission` / `superadminOnly`. Longest path match wins (same logic as sidebar).
 */
export const APP_NAV_MODULES: AppNavModule[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    labelKey: 'navigation.dashboard',
    icon: HomeIcon,
    section: 'primary',
    terminologyKey: 'dashboard',
    loadPage: () => import('@/modules/dashboard/DashboardPage'),
    pageExport: 'DashboardPage',
  },
  {
    id: 'ai-chat',
    path: '/ai-chat',
    label: 'AI Chat',
    labelKey: 'navigation.aiChat',
    icon: BotIcon,
    section: 'primary',
    permission: 'agent-chat.view',
    loadPage: () => import('@/modules/ai-chat/AIChatPage'),
    pageExport: 'AIChatPage',
  },
  {
    id: 'email',
    path: '/email',
    label: 'Email',
    labelKey: 'navigation.email',
    icon: EmailIcon,
    section: 'modules',
    permission: 'email.view_own',
    loadPage: () => import('@/modules/email/EmailPage'),
    pageExport: 'EmailPage',
  },
  {
    id: 'calendar',
    path: '/calendar',
    label: 'Calendar',
    labelKey: 'navigation.calendar',
    icon: CalendarIcon,
    section: 'modules',
    permission: 'calendar.view',
    loadPage: () => import('@/modules/calendar/CalendarPage'),
    pageExport: 'CalendarPage',
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Reports',
    labelKey: 'navigation.reports',
    icon: ReportsIcon,
    section: 'modules',
    permission: 'reports.view',
    loadPage: () => import('@/modules/reports/ReportsPage'),
    pageExport: 'ReportsPage',
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    labelKey: 'navigation.settings',
    icon: SettingsIcon,
    section: 'admin',
    permission: 'org.manage',
    loadPage: () => import('@/modules/settings/SettingsPage'),
    pageExport: 'SettingsPage',
  },
  {
    id: 'showcase',
    path: '/showcase',
    label: 'Component showcase',
    labelKey: 'navigation.componentShowcase',
    icon: SlidersHorizontalIcon,
    section: 'admin',
    devOnly: true,
    superadminOnly: true,
    loadPage: () => import('@/modules/showcase/ComponentShowcasePage'),
    pageExport: 'ComponentShowcasePage',
  },
];

export const PRIMARY_NAV_ITEMS = APP_NAV_MODULES.filter((item) => item.section === 'primary');
export const MODULE_NAV_ITEMS = APP_NAV_MODULES.filter((item) => item.section === 'modules');
export const ADMIN_NAV_ITEMS = APP_NAV_MODULES.filter((item) => item.section === 'admin');

export function moduleLabelFor(
  profile: OrgProfile,
  item: AppNavModule,
  translate?: (key: string, _params?: Record<string, string | number>, fallback?: string) => string,
) {
  if (item.terminologyKey) return profile.terminology[item.terminologyKey] ?? item.label;
  if (item.labelKey && translate) return translate(item.labelKey, undefined, item.label);
  return item.label;
}

export function visiblePathFor(profile: OrgProfile, item: AppNavModule) {
  return profile.navPaths?.[item.id] ?? item.path;
}

export function isAppNavItemEnabled(profile: OrgProfile, item: AppNavModule) {
  return profile.enabledModules.includes(item.id);
}

export function buildVisibleAppNavItems(
  profile: OrgProfile,
  subject: PermissionSubject,
  items: readonly AppNavModule[],
  translate?: (key: string, _params?: Record<string, string | number>, fallback?: string) => string,
): AppNavModule[] {
  return items
    .filter((item) => isAppNavItemEnabled(profile, item) && canAccessAppNavItem(item, subject))
    .map((item) => ({
      ...item,
      path: visiblePathFor(profile, item),
      label: moduleLabelFor(profile, item, translate),
    }));
}

export function resolveAppNavModule(pathname: string): AppNavModule | null {
  return (
    APP_NAV_MODULES.filter(
      (module) => pathname === module.path || pathname.startsWith(`${module.path}/`),
    ).sort((left, right) => right.path.length - left.path.length)[0] ?? null
  );
}

export function resolveAppNavModuleForProfile(
  profile: OrgProfile,
  pathname: string,
): AppNavModule | null {
  return (
    APP_NAV_MODULES.filter((module) => {
      if (!isAppNavItemEnabled(profile, module)) return false;
      const path = visiblePathFor(profile, module);
      return pathname === path || pathname.startsWith(`${path}/`);
    }).sort((left, right) => {
      const leftPath = visiblePathFor(profile, left);
      const rightPath = visiblePathFor(profile, right);
      return rightPath.length - leftPath.length;
    })[0] ?? null
  );
}

export function getAppQuickActionsForProfile(_profile: OrgProfile): AppQuickAction[] {
  return [];
}

export function getAppCreateActionForProfile(
  profile: OrgProfile,
  moduleId: OrgModuleId,
): AppQuickAction | null {
  return (
    getAppQuickActionsForProfile(profile).find((action) => action.routeId === moduleId) ?? null
  );
}
