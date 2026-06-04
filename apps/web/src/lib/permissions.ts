import {
  canUseOsirisPermissionRequirement,
  normalizeOsirisRole,
} from '@/runtime/osiris/permissions';
import type { OsirisPermissionRequirement, OsirisPermissionSubject } from '@/runtime/osiris/types';

import type { AppNavModule } from './appNavModules';

export type PermissionSubject = OsirisPermissionSubject;
export type PermissionRequirement = OsirisPermissionRequirement;

type PermissionBearingNavModule = AppNavModule & {
  permission?: PermissionRequirement;
};

function resolvePublicPermissionRequirement(
  requirement: PermissionRequirement,
): PermissionRequirement {
  if (requirement === 'manageOrganization') return 'org.manage';
  if (requirement === 'deleteRecords') return 'records.delete';

  return requirement;
}

export function permissionSubjectFor(
  user: { isSuperadmin?: boolean; permissions?: readonly string[] },
  membership?: { role?: string | null; permissions?: readonly string[] } | null,
): PermissionSubject {
  return {
    isSuperadmin: Boolean(user.isSuperadmin),
    role: normalizeOsirisRole(membership?.role),
    permissions: [...(membership?.permissions ?? user.permissions ?? [])],
  };
}

export function canManageOrganization(subject: PermissionSubject) {
  return canUseOsirisPermissionRequirement(subject, 'org.manage');
}

export function canDeleteRecords(subject: PermissionSubject, permission = 'records.delete') {
  return canUseOsirisPermissionRequirement(subject, permission);
}

export function canUsePermissionRequirement(
  subject: PermissionSubject,
  requirement?: PermissionRequirement,
) {
  return canUseOsirisPermissionRequirement(
    subject,
    requirement ? resolvePublicPermissionRequirement(requirement) : requirement,
  );
}

export function canAccessAppNavItem(item: PermissionBearingNavModule, subject: PermissionSubject) {
  if (item.id === 'showcase') {
    return subject.isSuperadmin;
  }

  if (item.id === 'settings') {
    return canUsePermissionRequirement(subject, 'org.manage');
  }

  if (item.id === 'users') {
    return canUsePermissionRequirement(subject, 'org.members.manage');
  }

  if (item.permission) {
    return canUsePermissionRequirement(subject, item.permission);
  }

  return true;
}
