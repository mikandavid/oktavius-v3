import type { ComponentType } from 'react';

import {
  BotIcon,
  CalendarIcon,
  DocumentIcon,
  EmailIcon,
  HomeIcon,
  ReportsIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SuperadminIcon,
  TasksIcon,
} from '@/lib/icons';
import type { IconProps } from '@/lib/icons';
import type { OrgModuleId, OrgProfile, OrgTerminology } from '@/lib/org-profiles/types';

export type AppNavSection = 'primary' | 'modules' | 'admin';
export type AppNavRouteId = OrgModuleId;

export type AppNavModule = {
  id: AppNavRouteId;
  path: string;
  label: string;
  icon: ComponentType<IconProps>;
  section: AppNavSection;
  devOnly?: boolean;
  terminologyKey?: keyof OrgTerminology;
};

export type AppQuickAction = {
  label: string;
  path: string;
  routeId: OrgModuleId;
};

/** Static module nav — longest path match wins (same logic as sidebar). */
export const APP_NAV_MODULES: AppNavModule[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    section: 'primary',
    terminologyKey: 'dashboard',
  },
  { id: 'ai-chat', path: '/ai-chat', label: 'AI Chat', icon: BotIcon, section: 'primary' },
  { id: 'tasks', path: '/tasks', label: 'Tasks', icon: TasksIcon, section: 'modules' },
  {
    id: 'documents',
    path: '/documents',
    label: 'Documents',
    icon: DocumentIcon,
    section: 'modules',
    terminologyKey: 'documents',
  },
  { id: 'email', path: '/email', label: 'Email', icon: EmailIcon, section: 'modules' },
  { id: 'calendar', path: '/calendar', label: 'Calendar', icon: CalendarIcon, section: 'modules' },
  { id: 'reports', path: '/reports', label: 'Reports', icon: ReportsIcon, section: 'modules' },
  { id: 'settings', path: '/settings', label: 'Settings', icon: SettingsIcon, section: 'admin' },
  {
    id: 'superadmin',
    path: '/superadmin',
    label: 'Superadmin',
    icon: SuperadminIcon,
    section: 'admin',
  },
  {
    id: 'showcase',
    path: '/showcase',
    label: 'Component showcase',
    icon: SlidersHorizontalIcon,
    section: 'admin',
    devOnly: true,
  },
];

export const PRIMARY_NAV_ITEMS = APP_NAV_MODULES.filter((item) => item.section === 'primary');
export const MODULE_NAV_ITEMS = APP_NAV_MODULES.filter(
  (item) => item.section === 'modules' && isOrgModuleId(item.id),
);
export const ADMIN_NAV_ITEMS = APP_NAV_MODULES.filter((item) => item.section === 'admin');

export function isOrgModuleId(_id: AppNavRouteId): _id is OrgModuleId {
  return true;
}

export function moduleLabelFor(profile: OrgProfile, item: AppNavModule) {
  return item.terminologyKey ? profile.terminology[item.terminologyKey] : item.label;
}

export function visiblePathFor(profile: OrgProfile, item: AppNavModule) {
  return isOrgModuleId(item.id) ? (profile.navPaths?.[item.id] ?? item.path) : item.path;
}

export function isAppNavItemEnabled(profile: OrgProfile, item: AppNavModule) {
  return !isOrgModuleId(item.id) || profile.enabledModules.includes(item.id);
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

export function getAppQuickActionsForProfile(profile: OrgProfile): AppQuickAction[] {
  if (!profile.enabledModules.includes('superadmin')) return [];

  return [
    {
      label: 'New organization',
      path: '/superadmin/orgs/new',
      routeId: 'superadmin',
    },
  ];
}

export function getAppCreateActionForProfile(
  profile: OrgProfile,
  moduleId: OrgModuleId,
): AppQuickAction | null {
  return (
    getAppQuickActionsForProfile(profile).find((action) => action.routeId === moduleId) ?? null
  );
}
