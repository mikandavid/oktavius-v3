import type { OrgMembershipRecord, UserRecord } from '@/app/demo-data';

import type { AppNavModule } from './appNavModules';

export type PermissionSubject = {
  isSuperadmin?: boolean;
  orgRole?: OrgMembershipRecord['role'] | null;
};

export type PermissionRequirement =
  | 'manageOrganization'
  | 'deleteRecords'
  | 'superadmin'
  | ((subject: PermissionSubject) => boolean);

export function permissionSubjectFor(
  user: Pick<UserRecord, 'isSuperadmin'>,
  membership?: Pick<OrgMembershipRecord, 'role'> | null,
): PermissionSubject {
  return {
    isSuperadmin: Boolean(user.isSuperadmin),
    orgRole: membership?.role ?? null,
  };
}

export function canManageOrganization(subject: PermissionSubject) {
  return Boolean(
    subject.isSuperadmin || subject.orgRole === 'Owner' || subject.orgRole === 'Admin',
  );
}

export function canDeleteRecords(subject: PermissionSubject) {
  return canManageOrganization(subject);
}

export function canUsePermissionRequirement(
  subject: PermissionSubject,
  requirement?: PermissionRequirement,
) {
  if (!requirement) return true;
  if (typeof requirement === 'function') return requirement(subject);

  if (requirement === 'manageOrganization') {
    return canManageOrganization(subject);
  }

  if (requirement === 'deleteRecords') {
    return canDeleteRecords(subject);
  }

  if (requirement === 'superadmin') {
    return Boolean(subject.isSuperadmin);
  }

  return false;
}

export function canAccessAppNavItem(item: AppNavModule, subject: PermissionSubject) {
  if (item.id === 'superadmin' || item.id === 'showcase') {
    return Boolean(subject.isSuperadmin);
  }

  if (item.section === 'admin' || item.id === 'users') {
    return canManageOrganization(subject);
  }

  return true;
}
