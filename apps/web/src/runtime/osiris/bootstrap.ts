import { normalizeOsirisRole } from './permissions';
import type { OsirisBootstrapResponse, OsirisRuntimeState } from './types';

export function normalizeOsirisBootstrap(payload: OsirisBootstrapResponse): OsirisRuntimeState {
  const activeOrgId = payload.profile?.active_org_id ?? null;
  const activeMembership =
    payload.memberships.find(
      (membership) => membership.org_id === activeOrgId && membership.is_active,
    ) ?? null;
  const isSuperadmin = payload.profile?.is_super_admin === true;

  return {
    currentUser: {
      id: payload.user.id,
      email: payload.user.email,
      fullName: payload.profile?.full_name ?? null,
      isSuperadmin,
    },
    organizations: payload.organizations,
    memberships: payload.memberships,
    activeOrgId,
    activeSiteId: payload.profile?.active_site_id ?? payload.locationAccess?.activeSiteId ?? null,
    permissions: payload.permissions,
    permissionSubject: {
      isSuperadmin,
      role: normalizeOsirisRole(activeMembership?.role),
      permissions: payload.permissions,
    },
    locationAccess: payload.locationAccess ?? null,
    config: payload.config,
  };
}
