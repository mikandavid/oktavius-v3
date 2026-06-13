import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import { readErrorMessage, readRecord, readString, readStringOrNull } from './osirisClientUtils';
import type { OsirisOrgRole } from './types';

export type OsirisOrgMember = {
  userId: string;
  membershipId: string | null;
  role: OsirisOrgRole;
  customRoleId: string | null;
  email: string | null;
  fullName: string;
};

export type OsirisUpdateMemberRoleInput = {
  role: OsirisOrgRole;
  customRoleId?: string | null;
};

export type OsirisMembersAdminClientOptions = {
  baseUrl?: string;
};

const ORG_ROLES: readonly OsirisOrgRole[] = ['owner', 'admin', 'member', 'viewer'];

function readRole(value: unknown): OsirisOrgRole {
  return ORG_ROLES.includes(value as OsirisOrgRole) ? (value as OsirisOrgRole) : 'member';
}

function normalizeMember(row: unknown): OsirisOrgMember {
  const value = readRecord(row);
  return {
    userId: readString(value.user_id ?? value.userId),
    membershipId: readStringOrNull(value.membership_id ?? value.membershipId),
    role: readRole(value.org_role ?? value.orgRole ?? value.role),
    customRoleId: readStringOrNull(value.custom_role_id ?? value.customRoleId),
    email: readStringOrNull(value.email),
    fullName: readString(value.full_name ?? value.fullName),
  };
}

export function createOsirisMembersAdminClient(options: OsirisMembersAdminClientOptions = {}) {
  return {
    async listOrgMembers(orgId: string): Promise<OsirisOrgMember[]> {
      const response = await fetch(
        joinOsirisApiBaseUrl(options.baseUrl, `/orgs/${encodeURIComponent(orgId)}/users`),
        { credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Members could not be loaded.'));
      }
      const payload: unknown = await response.json();
      const users = readRecord(payload).users;
      return Array.isArray(users) ? users.map(normalizeMember) : [];
    },

    async updateMemberRole(
      orgId: string,
      userId: string,
      input: OsirisUpdateMemberRoleInput,
    ): Promise<void> {
      const response = await fetch(
        joinOsirisApiBaseUrl(
          options.baseUrl,
          `/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}/role`,
        ),
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: input.role, customRoleId: input.customRoleId ?? null }),
        },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Role could not be updated.'));
      }
    },

    async removeMember(orgId: string, userId: string): Promise<void> {
      const response = await fetch(
        joinOsirisApiBaseUrl(
          options.baseUrl,
          `/orgs/${encodeURIComponent(orgId)}/users/${encodeURIComponent(userId)}`,
        ),
        { method: 'DELETE', credentials: 'include' },
      );
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, 'Member could not be removed.'));
      }
    },
  };
}
