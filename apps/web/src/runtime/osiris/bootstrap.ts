import { normalizeOsirisRole } from './permissions';
import { normalizeOsirisRuntimeConfig } from './runtimeConfig';
import type {
  OsirisBootstrapOrganization,
  OsirisBootstrapResponse,
  OsirisOrganizationSummary,
  OsirisRuntimeState,
} from './types';

function normalizeOrganizationSummary(
  organization: OsirisBootstrapOrganization,
): OsirisOrganizationSummary {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    logoUrl: organization.logoUrl ?? organization.logo_data ?? null,
  };
}

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
      ...(typeof payload.profile?.preferred_language === 'string'
        ? { preferredLanguage: payload.profile.preferred_language }
        : {}),
    },
    organizations: payload.organizations.map(normalizeOrganizationSummary),
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
    config: normalizeOsirisRuntimeConfig(payload.config),
  };
}
