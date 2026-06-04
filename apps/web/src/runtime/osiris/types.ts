export type OsirisOrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OsirisPermissionKey = string;

export type OsirisPermissionSubject = {
  isSuperadmin: boolean;
  role: OsirisOrgRole | null;
  permissions: readonly OsirisPermissionKey[];
};

export type OsirisPermissionRequirement =
  | OsirisPermissionKey
  | OsirisPermissionKey[]
  | 'superadmin'
  | ((subject: OsirisPermissionSubject) => boolean);

export type OsirisLocationAccess = {
  activeSiteId: string | null;
  accessibleSiteIds: readonly string[] | null;
  canViewAllSites: boolean;
  canEditAllSites: boolean;
  orgSiteCount: number;
  sites: readonly {
    id: string;
    name: string;
    isActive?: boolean;
  }[];
};

export type OsirisBootstrapResponse = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    user_id: string;
    email: string | null;
    full_name: string | null;
    is_super_admin: boolean;
    active_org_id: string | null;
    active_site_id: string | null;
    preferred_language?: string | null;
  } | null;
  memberships: readonly {
    org_id: string;
    role: string;
    is_active: boolean;
  }[];
  organizations: readonly {
    id: string;
    name: string;
    slug: string;
  }[];
  permissions: readonly OsirisPermissionKey[];
  locationAccess?: OsirisLocationAccess | null;
  config: unknown | null;
};

export type OsirisRuntimeState = {
  currentUser: {
    id: string;
    email: string | null;
    fullName: string | null;
    isSuperadmin: boolean;
  };
  organizations: OsirisBootstrapResponse['organizations'];
  memberships: OsirisBootstrapResponse['memberships'];
  activeOrgId: string | null;
  activeSiteId: string | null;
  permissions: OsirisBootstrapResponse['permissions'];
  permissionSubject: OsirisPermissionSubject;
  locationAccess: OsirisLocationAccess | null;
  config: unknown | null;
};
