type OrgId = string | null;

export const changelogKeys = {
  root: (org: OrgId) => ['changelog', org] as const,
  list: (org: OrgId) => ['changelog', org, 'list'] as const,
};
