// apps/web/src/runtime/osiris/customRolesAdminClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringArray,
} from './osirisClientUtils';

export type OsirisCustomRoleBase = 'member' | 'viewer';

export type OsirisCustomRole = {
  id: string;
  name: string;
  description: string;
  baseRole: OsirisCustomRoleBase;
  agentAccess: boolean;
  permissions: string[];
  allowedModules: string[];
  memberCount: number;
};

export type OsirisCreateCustomRoleInput = {
  name: string;
  description?: string;
  baseRole: OsirisCustomRoleBase;
  agentAccess: boolean;
  permissions: string[];
  allowedModules: string[];
};

export type OsirisUpdateCustomRoleInput = Partial<OsirisCreateCustomRoleInput>;

export type OsirisCustomRolesAdminClientOptions = { baseUrl?: string };

const CUSTOM_ROLE_BASES: readonly OsirisCustomRoleBase[] = ['member', 'viewer'];

function readCustomRoleBase(value: unknown): OsirisCustomRoleBase {
  return CUSTOM_ROLE_BASES.includes(value as OsirisCustomRoleBase)
    ? (value as OsirisCustomRoleBase)
    : 'member';
}

function normalizeCustomRole(row: unknown): OsirisCustomRole {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    name: readString(v.name),
    description: readString(v.description),
    baseRole: readCustomRoleBase(v.base_role ?? v.baseRole),
    agentAccess: Boolean(v.agent_access ?? v.agentAccess),
    permissions: readStringArray(v.permissions),
    allowedModules: readStringArray(v.allowed_modules ?? v.allowedModules),
    memberCount: readNumber(v.member_count ?? v.memberCount),
  };
}

async function readRoleResponse(response: Response): Promise<OsirisCustomRole> {
  return normalizeCustomRole(readRecord(await response.json()).customRole);
}

export function createOsirisCustomRolesAdminClient(
  options: OsirisCustomRolesAdminClientOptions = {},
) {
  const base = (orgId: string, suffix = '') =>
    joinOsirisApiBaseUrl(
      options.baseUrl,
      `/orgs/${encodeURIComponent(orgId)}/custom-roles${suffix}`,
    );

  return {
    async listCustomRoles(orgId: string): Promise<OsirisCustomRole[]> {
      const response = await fetch(base(orgId), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Roles could not be loaded.'));
      const roles = readRecord(await response.json()).customRoles;
      return Array.isArray(roles) ? roles.map(normalizeCustomRole) : [];
    },

    async createCustomRole(
      orgId: string,
      input: OsirisCreateCustomRoleInput,
    ): Promise<OsirisCustomRole> {
      const response = await fetch(base(orgId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be created.'));
      return readRoleResponse(response);
    },

    async updateCustomRole(
      orgId: string,
      roleId: string,
      input: OsirisUpdateCustomRoleInput,
    ): Promise<OsirisCustomRole> {
      const response = await fetch(base(orgId, `/${encodeURIComponent(roleId)}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be saved.'));
      return readRoleResponse(response);
    },

    async deleteCustomRole(orgId: string, roleId: string): Promise<void> {
      const response = await fetch(base(orgId, `/${encodeURIComponent(roleId)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Role could not be deleted.'));
    },
  };
}
