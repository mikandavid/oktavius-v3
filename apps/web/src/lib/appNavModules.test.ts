import { describe, expect, it } from 'vitest';

import {
  APP_NAV_MODULES,
  buildVisibleAppNavItems,
  getAppCreateActionForProfile,
  getAppQuickActionsForProfile,
  isAppNavItemEnabled,
  PRIMARY_NAV_ITEMS,
} from './appNavModules';
import { createDefaultOrgProfile } from './org-profiles/profiles';
import { getLocalizedOrgProfile } from './org-profiles/terminology';
import type { OrgProfile } from './org-profiles/types';

const REMOVED_BUSINESS_MODULE_IDS = [
  'cases',
  'incidents',
  'clients',
  'contacts',
  'vendors',
  'leads',
  'staff',
  'purchasing',
  'contracts',
  'products',
  'projects',
  'orders',
  'invoices',
  'users',
];

const genericProfile: OrgProfile = {
  ...createDefaultOrgProfile('org_generic'),
  enabledModules: ['dashboard', 'ai-chat', 'email', 'calendar', 'reports', 'settings'],
};

const funeralProfile: OrgProfile = {
  ...createDefaultOrgProfile('org_funeral'),
  name: 'Test Funeral Org',
  industryKey: 'funeral',
  enabledModules: ['dashboard', 'ai-chat', 'email', 'calendar', 'settings'],
  navPaths: { cases: '/funeral/cases', products: '/catalog', orders: '/sales' },
};

describe('app navigation module manifest', () => {
  it('keeps every profile module decision backed by a manifest item', () => {
    const manifestIds = new Set(APP_NAV_MODULES.map((item) => item.id));

    for (const profile of [genericProfile, funeralProfile]) {
      expect(profile.enabledModules.every((id) => manifestIds.has(id))).toBe(true);
    }
  });

  it('keeps profile-disabled modules out of enabled navigation', () => {
    const moduleById = new Map(APP_NAV_MODULES.map((item) => [item.id, item]));

    expect(isAppNavItemEnabled(genericProfile, moduleById.get('reports')!)).toBe(true);
    expect(isAppNavItemEnabled(funeralProfile, moduleById.get('reports')!)).toBe(false);
  });

  it('does not expose removed business CRUD modules', () => {
    expect(APP_NAV_MODULES.map((item) => item.id)).not.toEqual(
      expect.arrayContaining(REMOVED_BUSINESS_MODULE_IDS),
    );
  });

  it('declares Osiris permission metadata for permissioned runtime modules', () => {
    expect(
      Object.fromEntries(APP_NAV_MODULES.map((item) => [item.id, item.permission])),
    ).toMatchObject({
      'ai-chat': 'agent-chat.view',
      email: 'email.view_own',
      calendar: 'calendar.view',
      reports: 'reports.view',
    });
  });

  it('filters permissioned primary navigation items through Osiris permissions', () => {
    const apex = getLocalizedOrgProfile(genericProfile, 'en');
    const baseSubject = { isSuperadmin: false, role: 'member', permissions: [] } as const;
    const agentSubject = {
      isSuperadmin: false,
      role: 'member',
      permissions: ['agent-chat.view'],
    } as const;

    expect(
      buildVisibleAppNavItems(apex, baseSubject, PRIMARY_NAV_ITEMS).map((item) => item.id),
    ).toEqual(['dashboard']);
    expect(
      buildVisibleAppNavItems(apex, agentSubject, PRIMARY_NAV_ITEMS).map((item) => item.id),
    ).toEqual(['dashboard', 'ai-chat']);
  });

  it('derives platform quick action paths', () => {
    const kunz = getLocalizedOrgProfile(funeralProfile, 'en');

    expect(getAppQuickActionsForProfile(genericProfile)).toEqual([]);
    expect(getAppQuickActionsForProfile(kunz)).toEqual([]);
  });

  it('exposes no platform create actions', () => {
    const apex = getLocalizedOrgProfile(genericProfile, 'en');

    expect(getAppQuickActionsForProfile(apex).map((action) => action.routeId)).not.toContain(
      'superadmin',
    );
    expect(getAppCreateActionForProfile(apex, 'reports')).toBeNull();
  });
});
