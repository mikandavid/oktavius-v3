import { describe, expect, it } from 'vitest';

import { canAccessAppNavItem, canDeleteRecords, canUsePermissionRequirement } from './permissions';
import type { AppNavModule } from './appNavModules';
import type { PermissionRequirement } from './permissions';

type TestNavItem = AppNavModule & {
  permission?: PermissionRequirement;
};

const navItem = (
  id: AppNavModule['id'],
  section: AppNavModule['section'],
  permission?: PermissionRequirement,
): TestNavItem => ({
  id,
  path: `/${id}`,
  label: id,
  section,
  icon: () => null,
  permission,
});

describe('canAccessAppNavItem', () => {
  it('requires org.manage for settings', () => {
    expect(
      canAccessAppNavItem(navItem('settings', 'admin'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('settings', 'admin'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['org.manage'],
      }),
    ).toBe(true);
  });

  it('keeps regular modules available when no permission is configured', () => {
    expect(
      canAccessAppNavItem(navItem('clients', 'modules'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('requires org.members.manage for users', () => {
    expect(
      canAccessAppNavItem(navItem('users', 'modules'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['org.manage'],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('users', 'modules'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['org.members.manage'],
      }),
    ).toBe(true);
  });

  it('requires superadmin for the showcase', () => {
    expect(
      canAccessAppNavItem(navItem('showcase', 'admin'), {
        isSuperadmin: false,
        role: 'admin',
        permissions: ['org.manage'],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('showcase', 'admin'), {
        isSuperadmin: true,
        role: 'viewer',
        permissions: [],
      }),
    ).toBe(true);
  });

  it('requires configured permissions for regular modules', () => {
    expect(
      canAccessAppNavItem(navItem('clients', 'modules', 'contacts.view'), {
        isSuperadmin: false,
        role: 'member',
        permissions: [],
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('clients', 'modules', 'contacts.view'), {
        isSuperadmin: false,
        role: 'member',
        permissions: ['contacts.view'],
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

  it('maps legacy symbolic requirements to Osiris permission keys', () => {
    const manager = {
      isSuperadmin: false,
      role: 'member',
      permissions: ['org.manage', 'records.delete'],
    } as const;
    const member = { isSuperadmin: false, role: 'member', permissions: [] } as const;

    expect(canUsePermissionRequirement(manager, 'manageOrganization')).toBe(true);
    expect(canUsePermissionRequirement(member, 'manageOrganization')).toBe(false);
    expect(canUsePermissionRequirement(manager, 'deleteRecords')).toBe(true);
    expect(canUsePermissionRequirement(member, 'deleteRecords')).toBe(false);
  });
});
