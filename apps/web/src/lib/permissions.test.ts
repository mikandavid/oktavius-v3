import { describe, expect, it } from 'vitest';

import type { AppNavModule } from './appNavModules';
import type { PermissionRequirement } from './permissions';
import { canAccessAppNavItem, canDeleteRecords, canUsePermissionRequirement } from './permissions';

const navItem = (
  id: AppNavModule['id'],
  section: AppNavModule['section'],
  permission?: PermissionRequirement,
  options?: { superadminOnly?: boolean },
): AppNavModule => ({
  id,
  path: `/${id}`,
  label: id,
  section,
  icon: () => null,
  permission,
  superadminOnly: options?.superadminOnly,
  loadPage: () => Promise.resolve({}),
  pageExport: 'TestPage',
});

describe('canAccessAppNavItem', () => {
  it('enforces the declared permission for settings', () => {
    expect(
      canAccessAppNavItem(navItem('settings', 'admin', 'org.manage'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('settings', 'admin', 'org.manage'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['org.manage'],
      }),
    ).toBe(true);
  });

  it('keeps regular modules available when no permission is configured', () => {
    expect(
      canAccessAppNavItem(navItem('email', 'modules'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('requires superadmin for superadmin-only items regardless of permissions', () => {
    expect(
      canAccessAppNavItem(navItem('showcase', 'admin', undefined, { superadminOnly: true }), {
        isSuperadmin: false,
        role: 'admin',
        permissions: ['org.manage'],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('showcase', 'admin', undefined, { superadminOnly: true }), {
        isSuperadmin: true,
        role: 'viewer',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('requires configured permissions for regular modules', () => {
    expect(
      canAccessAppNavItem(navItem('email', 'modules', 'email.view_own'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('email', 'modules', 'email.view_own'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['email.view_own'],
      }),
    ).toBe(true);
  });
});

describe('canDeleteRecords', () => {
  it('requires the configured delete permission by default', () => {
    expect(canDeleteRecords({ isSuperadmin: false, role: 'member', permissions: [] })).toBe(false);
    expect(
      canDeleteRecords({ isSuperadmin: false, role: 'member', permissions: ['records.delete'] }),
    ).toBe(true);
    expect(canDeleteRecords({ isSuperadmin: true, role: 'viewer', permissions: [] })).toBe(true);
  });
});

describe('canUsePermissionRequirement', () => {
  it('evaluates Osiris permission requirements', () => {
    const member = { isSuperadmin: false, role: 'member', permissions: ['contacts.view'] } as const;
    const admin = {
      isSuperadmin: false,
      role: 'admin',
      permissions: ['org.manage', 'org.members.manage', 'contacts.delete'],
    } as const;
    const superadmin = { isSuperadmin: true, role: 'viewer', permissions: [] } as const;

    expect(canUsePermissionRequirement(member)).toBe(true);
    expect(canUsePermissionRequirement(member, 'org.manage')).toBe(false);
    expect(canUsePermissionRequirement(member, 'contacts.delete')).toBe(false);
    expect(canUsePermissionRequirement(member, 'superadmin')).toBe(false);
    expect(canUsePermissionRequirement(admin, 'org.manage')).toBe(true);
    expect(canUsePermissionRequirement(admin, 'contacts.delete')).toBe(true);
    expect(canUsePermissionRequirement(admin, 'superadmin')).toBe(false);
    expect(canUsePermissionRequirement(superadmin, 'superadmin')).toBe(true);
    expect(canUsePermissionRequirement(member, (subject) => subject.role === 'member')).toBe(true);
  });

  it('maps public permission names to Osiris permission keys in the adapter', () => {
    const manager = {
      isSuperadmin: false,
      role: 'member',
      permissions: ['org.manage', 'records.delete'],
    } as const;
    const member = { isSuperadmin: false, role: 'member', permissions: [] } as const;
    const calendarUser = {
      isSuperadmin: false,
      role: 'member',
      permissions: ['calendar-v2.view'],
    } as const;

    expect(canUsePermissionRequirement(manager, 'manageOrganization')).toBe(true);
    expect(canUsePermissionRequirement(member, 'manageOrganization')).toBe(false);
    expect(canUsePermissionRequirement(manager, 'deleteRecords')).toBe(true);
    expect(canUsePermissionRequirement(member, 'deleteRecords')).toBe(false);
    expect(canUsePermissionRequirement(calendarUser, 'calendar.view')).toBe(true);
    expect(canUsePermissionRequirement(member, 'calendar.view')).toBe(false);
  });
});
