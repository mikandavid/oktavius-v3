import { describe, expect, it } from 'vitest';

import {
  APP_NAV_MODULES,
  PRIMARY_NAV_ITEMS,
  buildVisibleAppNavItems,
  getAppCreateActionForProfile,
  getAppQuickActionsForProfile,
  isAppNavItemEnabled,
  isOrgModuleId,
} from './appNavModules';
import { ORG_APEX_ID, ORG_KUNZ_ID } from '@/app/demo-data/orgIds';
import { DEMO_ORG_PROFILES } from '@/app/demo-data/orgProfiles';

import { getLocalizedOrgProfile } from './org-profiles/terminology';

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

describe('app navigation module manifest', () => {
  it('keeps every profile module decision backed by a manifest item', () => {
    const manifestIds = new Set(
      APP_NAV_MODULES.filter((item) => isOrgModuleId(item.id)).map((item) => item.id),
    );

    for (const profile of Object.values(DEMO_ORG_PROFILES)) {
      expect(profile.enabledModules.every((id) => manifestIds.has(id))).toBe(true);
    }
  });

  it('keeps profile-disabled modules out of enabled navigation', () => {
    const apex = DEMO_ORG_PROFILES[ORG_APEX_ID];
    const kunz = DEMO_ORG_PROFILES[ORG_KUNZ_ID];
    const moduleById = new Map(APP_NAV_MODULES.map((item) => [item.id, item]));

    expect(isAppNavItemEnabled(apex, moduleById.get('reports')!)).toBe(true);
    expect(isAppNavItemEnabled(kunz, moduleById.get('reports')!)).toBe(false);
  });

  it('does not expose removed business CRUD modules', () => {
    expect(APP_NAV_MODULES.map((item) => item.id)).not.toEqual(
      expect.arrayContaining(REMOVED_BUSINESS_MODULE_IDS),
    );
    for (const profile of Object.values(DEMO_ORG_PROFILES)) {
      expect(profile.enabledModules).not.toEqual(
        expect.arrayContaining(REMOVED_BUSINESS_MODULE_IDS),
      );
    }
  });

  it('declares Osiris permission metadata for permissioned runtime modules', () => {
    expect(
      Object.fromEntries(APP_NAV_MODULES.map((item) => [item.id, item.permission])),
    ).toMatchObject({
      'ai-chat': 'agent-chat.view',
      email: 'email.view_own',
      calendar: 'calendar-v2.view',
      reports: 'reports.view',
    });
  });

  it('filters permissioned primary navigation items through Osiris permissions', () => {
    const apex = getLocalizedOrgProfile(DEMO_ORG_PROFILES[ORG_APEX_ID], 'en');
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
    const apex = DEMO_ORG_PROFILES[ORG_APEX_ID];
    const kunz = getLocalizedOrgProfile(DEMO_ORG_PROFILES[ORG_KUNZ_ID], 'en');

    expect(getAppQuickActionsForProfile(apex)).toEqual([]);
    expect(getAppQuickActionsForProfile(kunz)).toEqual([]);
  });

  it('exposes no platform create actions', () => {
    const apex = getLocalizedOrgProfile(DEMO_ORG_PROFILES[ORG_APEX_ID], 'en');

    expect(getAppQuickActionsForProfile(apex).map((action) => action.routeId)).not.toContain(
      'superadmin',
    );
    expect(getAppCreateActionForProfile(apex, 'clients')).toBeNull();
  });
});
