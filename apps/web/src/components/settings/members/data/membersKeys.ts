type OrgId = string | null;

/**
 * Query keys are scoped by org id, so switching the active org swaps to a
 * separate cache entry instead of bleeding the previous org's rows into the
 * new one (the stale-data race the manual-fetch version had).
 */
export const membersKeys = {
  root: (org: OrgId) => ['members', org] as const,
  members: (org: OrgId) => ['members', org, 'members'] as const,
  invitations: (org: OrgId) => ['members', org, 'invitations'] as const,
  links: (org: OrgId) => ['members', org, 'links'] as const,
  roles: (org: OrgId) => ['members', org, 'roles'] as const,
};
