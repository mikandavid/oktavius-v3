import type { SearchRuntimeAdapter } from '@/lib/search/SearchRuntime';
import type { NotificationsRuntimeAdapter } from '@/components/layout/NotificationsRuntime';

import type {
  OsirisAcceptedInvitation,
  OsirisAuthProviderName,
  OsirisInvitationResolution,
  OsirisPasswordChangeInput,
  OsirisProfileUpdateInput,
  OsirisProviderSessionInput,
  OsirisRegisterInvitationInput,
} from './authClient';
import type { OsirisOrgLocation, OsirisOrgLocationInput } from './locationAdminClient';
import type { OsirisRuntimeConfig } from './runtimeConfig';
import type { OsirisWorkspaceSettings } from './workspaceSettingsClient';

export type OsirisOrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OsirisPermissionKey = string;

export type OsirisPermissionSubject = {
  isSuperadmin: boolean;
  role: OsirisOrgRole | null;
  permissions: readonly OsirisPermissionKey[];
};

export type OsirisSessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'expired';

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
  sessionStatus?: OsirisSessionStatus;
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
  setActiveOrgId?: (orgId: string | null) => void | Promise<void>;
  setActiveSiteId?: (siteId: string | null) => void | Promise<void>;
  signIn?: (email: string, password: string) => Promise<void>;
  signInWithProvider?: (
    provider: OsirisAuthProviderName,
    redirectTo?: string | null,
  ) => Promise<void>;
  completeProviderSignIn?: (session: OsirisProviderSessionInput) => Promise<void>;
  requestPasswordReset?: (email: string) => Promise<void>;
  updateRecoveryPassword?: (input: { accessToken: string; password: string }) => Promise<void>;
  changePassword?: (input: OsirisPasswordChangeInput) => Promise<void>;
  updateProfile?: (input: OsirisProfileUpdateInput) => Promise<void>;
  updatePreferredLanguage?: (language: string) => Promise<void>;
  loadWorkspaceSettings?: (orgId?: string | null) => Promise<OsirisWorkspaceSettings>;
  updateWorkspaceSettings?: (
    settings: OsirisWorkspaceSettings,
    orgId?: string | null,
  ) => Promise<OsirisWorkspaceSettings>;
  listOrgLocations?: (orgId?: string | null) => Promise<OsirisOrgLocation[]>;
  createOrgLocation?: (
    orgId: string | null | undefined,
    input: OsirisOrgLocationInput,
  ) => Promise<OsirisOrgLocation>;
  updateOrgLocation?: (
    orgId: string | null | undefined,
    locationId: string,
    input: OsirisOrgLocationInput,
  ) => Promise<OsirisOrgLocation>;
  deactivateOrgLocation?: (
    orgId: string | null | undefined,
    locationId: string,
  ) => Promise<OsirisOrgLocation>;
  resolveInvitationToken?: (token: string) => Promise<OsirisInvitationResolution>;
  acceptInvitation?: (token: string) => Promise<OsirisAcceptedInvitation>;
  registerInvitation?: (input: OsirisRegisterInvitationInput) => Promise<void>;
  signOut?: () => Promise<void>;
  expireSession?: () => void;
  permissions: OsirisBootstrapResponse['permissions'];
  permissionSubject: OsirisPermissionSubject;
  locationAccess: OsirisLocationAccess | null;
  notificationsRuntime?: NotificationsRuntimeAdapter;
  searchRuntime?: SearchRuntimeAdapter;
  config: OsirisRuntimeConfig | null;
};
