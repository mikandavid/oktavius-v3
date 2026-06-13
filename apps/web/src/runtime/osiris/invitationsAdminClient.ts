// apps/web/src/runtime/osiris/invitationsAdminClient.ts
import { joinOsirisApiBaseUrl } from './apiBaseUrl';
import {
  readErrorMessage,
  readNumber,
  readRecord,
  readString,
  readStringOrNull,
} from './osirisClientUtils';

export type OsirisInvitationRole = 'admin' | 'member' | 'viewer';
export type OsirisInviteLinkRole = 'member' | 'viewer';

export type OsirisInvitation = {
  id: string;
  orgId: string | null;
  email: string | null;
  role: OsirisInvitationRole;
  customRoleId: string | null;
  token: string;
  invitedBy: string | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string | null;
};

export type OsirisInviteLink = {
  id: string;
  orgId: string | null;
  token: string;
  role: OsirisInviteLinkRole;
  customRoleId: string | null;
  maxUses: number;
  useCount: number;
  createdBy: string | null;
  expiresAt: string | null;
  createdAt: string | null;
};

export type OsirisCreateInvitationInput = {
  email: string;
  role: OsirisInvitationRole;
  customRoleId?: string | null;
  expiresInDays: number;
};

export type OsirisCreateInviteLinkInput = {
  role: OsirisInviteLinkRole;
  customRoleId?: string | null;
  maxUses: number;
  expiresInDays: number;
};

export type OsirisCreatedInvitation = { invitation: OsirisInvitation; acceptUrl: string };
export type OsirisCreatedInviteLink = { link: OsirisInviteLink; inviteUrl: string };

export type OsirisInvitationsAdminClientOptions = { baseUrl?: string };

const INVITATION_ROLES: readonly OsirisInvitationRole[] = ['admin', 'member', 'viewer'];
const INVITE_LINK_ROLES: readonly OsirisInviteLinkRole[] = ['member', 'viewer'];

function readInvitationRole(value: unknown): OsirisInvitationRole {
  return INVITATION_ROLES.includes(value as OsirisInvitationRole)
    ? (value as OsirisInvitationRole)
    : 'member';
}

function readInviteLinkRole(value: unknown): OsirisInviteLinkRole {
  return INVITE_LINK_ROLES.includes(value as OsirisInviteLinkRole)
    ? (value as OsirisInviteLinkRole)
    : 'member';
}

function normalizeInvitation(row: unknown): OsirisInvitation {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    email: readStringOrNull(v.email),
    role: readInvitationRole(v.role),
    customRoleId: readStringOrNull(v.custom_role_id ?? v.customRoleId),
    token: readString(v.token),
    invitedBy: readStringOrNull(v.invited_by ?? v.invitedBy),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    acceptedAt: readStringOrNull(v.accepted_at ?? v.acceptedAt),
    createdAt: readStringOrNull(v.created_at ?? v.createdAt),
  };
}

function normalizeInviteLink(row: unknown): OsirisInviteLink {
  const v = readRecord(row);
  return {
    id: readString(v.id),
    orgId: readStringOrNull(v.org_id ?? v.orgId),
    token: readString(v.token),
    role: readInviteLinkRole(v.role),
    customRoleId: readStringOrNull(v.custom_role_id ?? v.customRoleId),
    maxUses: readNumber(v.max_uses ?? v.maxUses),
    useCount: readNumber(v.use_count ?? v.useCount),
    createdBy: readStringOrNull(v.created_by ?? v.createdBy),
    expiresAt: readStringOrNull(v.expires_at ?? v.expiresAt),
    createdAt: readStringOrNull(v.created_at ?? v.createdAt),
  };
}

export function createOsirisInvitationsAdminClient(
  options: OsirisInvitationsAdminClientOptions = {},
) {
  const base = (path: string) => joinOsirisApiBaseUrl(options.baseUrl, path);
  // The Osiris invitations service is mounted under its own /invitations prefix.
  const org = (orgId: string) => `/invitations/orgs/${encodeURIComponent(orgId)}`;

  return {
    async listInvitations(orgId: string): Promise<OsirisInvitation[]> {
      const response = await fetch(base(`${org(orgId)}/invitations`), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitations could not be loaded.'));
      const payload: unknown = await response.json();
      const invitations = readRecord(payload).invitations;
      return Array.isArray(invitations) ? invitations.map(normalizeInvitation) : [];
    },

    async createInvitation(
      orgId: string,
      input: OsirisCreateInvitationInput,
    ): Promise<OsirisCreatedInvitation> {
      const response = await fetch(base(`${org(orgId)}/invitations`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email,
          role: input.role,
          customRoleId: input.customRoleId ?? null,
          expiresInDays: input.expiresInDays,
        }),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitation could not be created.'));
      const payload = readRecord(await response.json());
      return {
        invitation: normalizeInvitation(payload.invitation),
        acceptUrl: readString(payload.acceptUrl),
      };
    },

    async revokeInvitation(orgId: string, invitationId: string): Promise<void> {
      const response = await fetch(
        base(`${org(orgId)}/invitations/${encodeURIComponent(invitationId)}`),
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invitation could not be revoked.'));
    },

    async listInviteLinks(orgId: string): Promise<OsirisInviteLink[]> {
      const response = await fetch(base(`${org(orgId)}/links`), { credentials: 'include' });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite links could not be loaded.'));
      const payload: unknown = await response.json();
      const links = readRecord(payload).links;
      return Array.isArray(links) ? links.map(normalizeInviteLink) : [];
    },

    async createInviteLink(
      orgId: string,
      input: OsirisCreateInviteLinkInput,
    ): Promise<OsirisCreatedInviteLink> {
      const response = await fetch(base(`${org(orgId)}/links`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: input.role,
          customRoleId: input.customRoleId ?? null,
          maxUses: input.maxUses,
          expiresInDays: input.expiresInDays,
        }),
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite link could not be created.'));
      const payload = readRecord(await response.json());
      return { link: normalizeInviteLink(payload.link), inviteUrl: readString(payload.inviteUrl) };
    },

    async revokeInviteLink(orgId: string, linkId: string): Promise<void> {
      const response = await fetch(base(`${org(orgId)}/links/${encodeURIComponent(linkId)}`), {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok)
        throw new Error(await readErrorMessage(response, 'Invite link could not be revoked.'));
    },
  };
}
