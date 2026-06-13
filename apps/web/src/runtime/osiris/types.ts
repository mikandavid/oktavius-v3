import type { SavedViewsRuntimeAdapter } from '@/components/data/savedViewsRuntime';
import type { NotificationsRuntimeAdapter } from '@/components/layout/NotificationsRuntime';
import type { SearchRuntimeAdapter } from '@/lib/search/SearchRuntime';
import type { UserPreferencesRuntimeAdapter } from '@/lib/userPreferences';

import type {
  OsirisAcceptedInvitation,
  OsirisAuthProviderName,
  OsirisInvitationResolution,
  OsirisPasswordChangeInput,
  OsirisProfileUpdateInput,
  OsirisProviderSessionInput,
  OsirisRegisterInvitationInput,
} from './authClient';
import type {
  OsirisCreateCustomRoleInput,
  OsirisCustomRole,
  OsirisUpdateCustomRoleInput,
} from './customRolesAdminClient';
import type {
  OsirisCreatedInvitation,
  OsirisCreatedInviteLink,
  OsirisCreateInvitationInput,
  OsirisCreateInviteLinkInput,
  OsirisInvitation,
  OsirisInviteLink,
} from './invitationsAdminClient';
import type { OsirisOrgLocation, OsirisOrgLocationInput } from './locationAdminClient';
import type { OsirisOrgMember, OsirisUpdateMemberRoleInput } from './membersAdminClient';
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

export type OsirisBootstrapOrganization = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  logo_data?: string | null;
};

export type OsirisOrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
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
  organizations: readonly OsirisBootstrapOrganization[];
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
    preferredLanguage?: string | null;
  };
  organizations: readonly OsirisOrganizationSummary[];
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
  listOrgMembers?: (orgId?: string | null) => Promise<OsirisOrgMember[]>;
  updateMemberRole?: (
    orgId: string | null | undefined,
    userId: string,
    input: OsirisUpdateMemberRoleInput,
  ) => Promise<void>;
  removeMember?: (orgId: string | null | undefined, userId: string) => Promise<void>;
  listInvitations?: (orgId?: string | null) => Promise<OsirisInvitation[]>;
  createInvitation?: (
    orgId: string | null | undefined,
    input: OsirisCreateInvitationInput,
  ) => Promise<OsirisCreatedInvitation>;
  revokeInvitation?: (orgId: string | null | undefined, invitationId: string) => Promise<void>;
  listInviteLinks?: (orgId?: string | null) => Promise<OsirisInviteLink[]>;
  createInviteLink?: (
    orgId: string | null | undefined,
    input: OsirisCreateInviteLinkInput,
  ) => Promise<OsirisCreatedInviteLink>;
  revokeInviteLink?: (orgId: string | null | undefined, linkId: string) => Promise<void>;
  listCustomRoles?: (orgId?: string | null) => Promise<OsirisCustomRole[]>;
  createCustomRole?: (
    orgId: string | null | undefined,
    input: OsirisCreateCustomRoleInput,
  ) => Promise<OsirisCustomRole>;
  updateCustomRole?: (
    orgId: string | null | undefined,
    roleId: string,
    input: OsirisUpdateCustomRoleInput,
  ) => Promise<OsirisCustomRole>;
  deleteCustomRole?: (orgId: string | null | undefined, roleId: string) => Promise<void>;
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
  savedViewsRuntime?: SavedViewsRuntimeAdapter;
  userPreferencesRuntime?: UserPreferencesRuntimeAdapter;
  config: OsirisRuntimeConfig | null;
};
