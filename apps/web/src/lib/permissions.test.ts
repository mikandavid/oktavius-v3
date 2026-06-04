import { describe, expect, it } from 'vitest';

import { canAccessAppNavItem, canDeleteRecords, canUsePermissionRequirement } from './permissions';
import type { AppNavModule } from './appNavModules';

const navItem = (id: AppNavModule['id'], section: AppNavModule['section']): AppNavModule => ({
  id,
  path: `/${id}`,
  label: id,
  section,
  icon: () => null,
});

describe('canAccessAppNavItem', () => {
  it('restricts superadmin navigation to platform superadmins', () => {
    expect(
      canAccessAppNavItem(navItem('superadmin', 'admin'), {
        isSuperadmin: false,
        orgRole: 'Owner',
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('superadmin', 'admin'), {
        isSuperadmin: true,
        orgRole: 'Member',
      }),
    ).toBe(true);
  });

  it('restricts admin configuration to owner and admin memberships', () => {
    expect(
      canAccessAppNavItem(navItem('settings', 'admin'), {
        isSuperadmin: false,
        orgRole: 'Member',
      }),
    ).toBe(false);

    expect(
      canAccessAppNavItem(navItem('settings', 'admin'), {
        isSuperadmin: false,
        orgRole: 'Admin',
      }),
    ).toBe(true);
  });

  it('keeps regular modules available to member memberships', () => {
    expect(
      canAccessAppNavItem(navItem('clients', 'modules'), {
        isSuperadmin: false,
        orgRole: 'Member',
      }),
    ).toBe(true);
  });

  it('treats user management as an admin action even when it lives in the modules group', () => {
    expect(
      canAccessAppNavItem(navItem('users', 'modules'), {
        isSuperadmin: false,
        orgRole: 'Member',
      }),
    ).toBe(false);
  });
});

describe('canDeleteRecords', () => {
  it('allows destructive record actions only for organization managers and superadmins', () => {
    expect(canDeleteRecords({ isSuperadmin: false, orgRole: 'Member' })).toBe(false);
    expect(canDeleteRecords({ isSuperadmin: false, orgRole: null })).toBe(false);
    expect(canDeleteRecords({ isSuperadmin: false, orgRole: 'Admin' })).toBe(true);
    expect(canDeleteRecords({ isSuperadmin: false, orgRole: 'Owner' })).toBe(true);
    expect(canDeleteRecords({ isSuperadmin: true, orgRole: 'Member' })).toBe(true);
  });
});

describe('canUsePermissionRequirement', () => {
  it('evaluates declarative list/form/detail permission requirements', () => {
    const member = { isSuperadmin: false, orgRole: 'Member' } as const;
    const admin = { isSuperadmin: false, orgRole: 'Admin' } as const;
    const superadmin = { isSuperadmin: true, orgRole: 'Member' } as const;

    expect(canUsePermissionRequirement(member)).toBe(true);
    expect(canUsePermissionRequirement(member, 'manageOrganization')).toBe(false);
    expect(canUsePermissionRequirement(member, 'deleteRecords')).toBe(false);
    expect(canUsePermissionRequirement(member, 'superadmin')).toBe(false);
    expect(canUsePermissionRequirement(admin, 'manageOrganization')).toBe(true);
    expect(canUsePermissionRequirement(admin, 'deleteRecords')).toBe(true);
    expect(canUsePermissionRequirement(admin, 'superadmin')).toBe(false);
    expect(canUsePermissionRequirement(superadmin, 'superadmin')).toBe(true);
    expect(canUsePermissionRequirement(member, (subject) => subject.orgRole === 'Member')).toBe(
      true,
    );
  });
});
