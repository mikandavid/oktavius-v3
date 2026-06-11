import { describe, expect, it } from 'vitest';

import { normalizeOsirisBootstrap } from './bootstrap';
import type { OsirisBootstrapResponse } from './types';

describe('normalizeOsirisBootstrap', () => {
  it('normalizes profile, memberships, permissions, and active org/site', () => {
    const payload = {
      user: { id: 'usr_1', email: 'anna@example.test' },
      profile: {
        user_id: 'usr_1',
        email: 'anna@example.test',
        full_name: 'Anna',
        is_super_admin: false,
        active_org_id: 'org_1',
        active_site_id: 'site_1',
        preferred_language: 'de',
      },
      memberships: [
        { org_id: 'org_1', role: 'Admin', is_active: true },
        { org_id: 'org_2', role: 'Owner', is_active: true },
      ],
      organizations: [
        { id: 'org_1', name: 'Osiris Demo', slug: 'osiris-demo' },
        { id: 'org_2', name: 'Other Org', slug: 'other-org' },
      ],
      permissions: ['contacts.view', 'contacts.update'],
      locationAccess: {
        activeSiteId: 'site_fallback',
        accessibleSiteIds: ['site_1'],
        canViewAllSites: false,
        canEditAllSites: false,
        orgSiteCount: 1,
        sites: [{ id: 'site_1', name: 'Vienna', isActive: true }],
      },
      config: {
        org: {
          id: 'org_1',
          name: 'Oktavius Demo',
          slug: 'oktavius-demo',
          industryKey: 'general',
          industryName: 'General',
          enabledModules: ['contacts'],
          theme: {},
          settings: {},
          logoUrl: null,
        },
        terminology: {},
        permissions: ['contacts.view', 'contacts.update'],
        preferences: {},
        agentAccess: true,
      },
    } satisfies OsirisBootstrapResponse;

    const result = normalizeOsirisBootstrap(payload);

    expect(result.currentUser).toEqual({
      id: 'usr_1',
      email: 'anna@example.test',
      fullName: 'Anna',
      isSuperadmin: false,
      preferredLanguage: 'de',
    });
    expect(result.organizations).toBe(payload.organizations);
    expect(result.memberships).toBe(payload.memberships);
    expect(result.permissions).toBe(payload.permissions);
    expect(result.config?.org?.enabledModules).toEqual(['contacts']);
    expect(result.config?.org?.settings.dateTime.dateFormat).toBe('DD.MM.YYYY');
    expect(result.locationAccess).toBe(payload.locationAccess);
    expect(result.activeOrgId).toBe('org_1');
    expect(result.activeSiteId).toBe('site_1');
    expect(result.permissionSubject).toEqual({
      isSuperadmin: false,
      role: 'admin',
      permissions: ['contacts.view', 'contacts.update'],
    });
  });

  it('uses nullable-safe defaults when profile and location access are missing', () => {
    const payload = {
      user: { id: 'usr_2', email: null },
      profile: null,
      memberships: [{ org_id: 'org_1', role: 'Owner', is_active: true }],
      organizations: [{ id: 'org_1', name: 'Osiris Demo', slug: 'osiris-demo' }],
      permissions: [],
      locationAccess: null,
      config: null,
    } satisfies OsirisBootstrapResponse;

    const result = normalizeOsirisBootstrap(payload);

    expect(result.currentUser).toEqual({
      id: 'usr_2',
      email: null,
      fullName: null,
      isSuperadmin: false,
    });
    expect(result.activeOrgId).toBe(null);
    expect(result.activeSiteId).toBe(null);
    expect(result.locationAccess).toBe(null);
    expect(result.permissionSubject).toEqual({
      isSuperadmin: false,
      role: null,
      permissions: [],
    });
  });

  it('uses location access as the active site fallback', () => {
    const payload = {
      user: { id: 'usr_3', email: 'mara@example.test' },
      profile: {
        user_id: 'usr_3',
        email: 'mara@example.test',
        full_name: null,
        is_super_admin: true,
        active_org_id: 'org_1',
        active_site_id: null,
      },
      memberships: [{ org_id: 'org_1', role: 'viewer', is_active: true }],
      organizations: [{ id: 'org_1', name: 'Osiris Demo', slug: 'osiris-demo' }],
      permissions: ['reports.view'],
      locationAccess: {
        activeSiteId: 'site_2',
        accessibleSiteIds: ['site_2'],
        canViewAllSites: true,
        canEditAllSites: true,
        orgSiteCount: 1,
        sites: [{ id: 'site_2', name: 'Graz' }],
      },
      config: null,
    } satisfies OsirisBootstrapResponse;

    const result = normalizeOsirisBootstrap(payload);

    expect(result.activeSiteId).toBe('site_2');
    expect(result.permissionSubject).toEqual({
      isSuperadmin: true,
      role: 'viewer',
      permissions: ['reports.view'],
    });
  });
});
