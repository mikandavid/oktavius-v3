import type { OsirisOrgRole, OsirisPermissionRequirement, OsirisPermissionSubject } from './types';

const CANONICAL_ROLES = new Set<OsirisOrgRole>(['owner', 'admin', 'member', 'viewer']);

export function normalizeOsirisRole(role: string | null | undefined): OsirisOrgRole | null {
  if (!role) return null;

  const normalized = role.toLowerCase();
  return CANONICAL_ROLES.has(normalized as OsirisOrgRole) ? (normalized as OsirisOrgRole) : null;
}

export function isCanonicalOrgRole(role: unknown): role is OsirisOrgRole {
  return typeof role === 'string' && CANONICAL_ROLES.has(role as OsirisOrgRole);
}

export function hasOsirisPermission(permissions: readonly string[], permission: string): boolean {
  return permissions.includes(permission);
}

export function canUseOsirisPermissionRequirement(
  subject: OsirisPermissionSubject,
  requirement?: OsirisPermissionRequirement,
): boolean {
  if (!requirement) return true;
  if (typeof requirement === 'function') return requirement(subject);
  if (requirement === 'superadmin') return Boolean(subject.isSuperadmin);

  const required = Array.isArray(requirement) ? requirement : [requirement];
  if (subject.isSuperadmin) return true;

  const permissions = Array.isArray(subject.permissions) ? subject.permissions : [];
  return required.every((permission) => hasOsirisPermission(permissions, permission));
}
