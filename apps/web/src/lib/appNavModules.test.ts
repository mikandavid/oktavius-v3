import { describe, expect, it } from 'vitest';

import {
  APP_NAV_MODULES,
  getAppCreateActionForProfile,
  getAppQuickActionsForProfile,
  isAppNavItemEnabled,
  isOrgModuleId,
  resolveAppNavModule,
  resolveAppNavModuleForProfile,
  visiblePathFor,
} from './appNavModules';
import { ORG_APEX_ID, ORG_KUNZ_ID, ORG_PROFILES } from './org-profiles/profiles';
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

    for (const profile of Object.values(ORG_PROFILES)) {
      expect(profile.enabledModules.every((id) => manifestIds.has(id))).toBe(true);
    }
  });

  it('applies profile path overrides to visible nav paths', () => {
    const kunz = ORG_PROFILES[ORG_KUNZ_ID];
    const documents = APP_NAV_MODULES.find((item) => item.id === 'documents');

    expect(documents).toBeDefined();
    expect(visiblePathFor(kunz, documents!)).toBe('/storage');
  });

  it('resolves profile override routes to the owning module', () => {
    const kunz = ORG_PROFILES[ORG_KUNZ_ID];

    expect(resolveAppNavModuleForProfile(kunz, '/storage')?.id).toBe('documents');
    expect(resolveAppNavModuleForProfile(kunz, '/storage/generated_1')?.id).toBe('documents');
  });

  it('keeps profile-disabled modules out of enabled navigation', () => {
    const apex = ORG_PROFILES[ORG_APEX_ID];
    const kunz = ORG_PROFILES[ORG_KUNZ_ID];
    const moduleById = new Map(APP_NAV_MODULES.map((item) => [item.id, item]));

    expect(isAppNavItemEnabled(apex, moduleById.get('reports')!)).toBe(true);
    expect(isAppNavItemEnabled(kunz, moduleById.get('reports')!)).toBe(false);
  });

  it('keeps the default resolver working for default app routes', () => {
    expect(resolveAppNavModule('/documents/generated_1')?.id).toBe('documents');
  });

  it('does not expose removed business CRUD modules', () => {
    expect(APP_NAV_MODULES.map((item) => item.id)).not.toEqual(
      expect.arrayContaining(REMOVED_BUSINESS_MODULE_IDS),
    );
    for (const profile of Object.values(ORG_PROFILES)) {
      expect(profile.enabledModules).not.toEqual(
        expect.arrayContaining(REMOVED_BUSINESS_MODULE_IDS),
      );
    }
  });

  it('derives platform quick action paths', () => {
    const apex = ORG_PROFILES[ORG_APEX_ID];
    const kunz = getLocalizedOrgProfile(ORG_PROFILES[ORG_KUNZ_ID], 'en');

    expect(getAppQuickActionsForProfile(apex)).toEqual([
      { label: 'New organization', path: '/superadmin/orgs/new', routeId: 'superadmin' },
    ]);
    expect(getAppQuickActionsForProfile(kunz)).toEqual([]);
  });

  it('exposes platform create actions only', () => {
    const apex = getLocalizedOrgProfile(ORG_PROFILES[ORG_APEX_ID], 'en');

    expect(getAppCreateActionForProfile(apex, 'superadmin')).toMatchObject({
      label: 'New organization',
      path: '/superadmin/orgs/new',
    });
    expect(getAppCreateActionForProfile(apex, 'clients')).toBeNull();
  });
});
