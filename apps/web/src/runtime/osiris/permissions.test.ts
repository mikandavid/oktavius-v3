import { describe, expect, it } from 'vitest';

import {
  canUseOsirisPermissionRequirement,
  hasOsirisPermission,
  isCanonicalOrgRole,
  normalizeOsirisRole,
} from './permissions';

describe('osiris permissions', () => {
  it('normalizes canonical Osiris roles', () => {
    expect(normalizeOsirisRole('Owner')).toBe('owner');
    expect(normalizeOsirisRole('admin')).toBe('admin');
    expect(normalizeOsirisRole('MEMBER')).toBe('member');
    expect(normalizeOsirisRole('viewer')).toBe('viewer');
    expect(normalizeOsirisRole('unknown')).toBe(null);
  });

  it('recognizes canonical roles only', () => {
    expect(isCanonicalOrgRole('owner')).toBe(true);
    expect(isCanonicalOrgRole('Viewer')).toBe(false);
    expect(isCanonicalOrgRole(null)).toBe(false);
  });

  it('checks exact Osiris permission keys', () => {
    expect(hasOsirisPermission(['contacts.view'], 'contacts.view')).toBe(true);
    expect(hasOsirisPermission(['contacts.view'], 'contacts.update')).toBe(false);
  });

  it('allows superadmins through explicit superadmin requirements', () => {
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: true, role: 'member', permissions: [] },
        'superadmin',
      ),
    ).toBe(true);
  });

  it('checks all required permission keys', () => {
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: false, role: 'member', permissions: ['contacts.view', 'contacts.update'] },
        ['contacts.view', 'contacts.update'],
      ),
    ).toBe(true);
    expect(
      canUseOsirisPermissionRequirement(
        { isSuperadmin: false, role: 'member', permissions: ['contacts.view'] },
        ['contacts.view', 'contacts.update'],
      ),
    ).toBe(false);
  });

  it('denies malformed subjects without crashing when permissions are missing', () => {
    const legacySubject = { isSuperadmin: false, role: 'member' } as never;

    expect(canUseOsirisPermissionRequirement(legacySubject, 'contacts.view')).toBe(false);
  });
});
