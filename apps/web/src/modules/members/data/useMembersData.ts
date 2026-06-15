import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { appToast } from '@/lib/toast';
import type { OsirisCreateCustomRoleInput } from '@/runtime/osiris/customRolesAdminClient';
import type {
  OsirisCreateInvitationInput,
  OsirisCreateInviteLinkInput,
} from '@/runtime/osiris/invitationsAdminClient';
import type { OsirisUpdateMemberRoleInput } from '@/runtime/osiris/membersAdminClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { membersKeys } from './membersKeys';

function useOrgId() {
  return useOptionalOsirisRuntime()?.activeOrgId ?? null;
}

/** A capability the runtime might not expose; throwing surfaces misuse clearly. */
function required<T>(fn: T | undefined, name: string): T {
  if (!fn) throw new Error(`Osiris runtime does not support ${name} in this environment.`);
  return fn;
}

export function useMembers() {
  const runtime = useOptionalOsirisRuntime();
  const org = useOrgId();
  return useQuery({
    queryKey: membersKeys.members(org),
    queryFn: () => required(runtime?.listOrgMembers, 'listOrgMembers')(org),
    enabled: Boolean(org && runtime?.listOrgMembers),
  });
}

export function useInvitations() {
  const runtime = useOptionalOsirisRuntime();
  const org = useOrgId();
  return useQuery({
    queryKey: membersKeys.invitations(org),
    queryFn: () => required(runtime?.listInvitations, 'listInvitations')(org),
    enabled: Boolean(org && runtime?.listInvitations),
  });
}

export function useInviteLinks() {
  const runtime = useOptionalOsirisRuntime();
  const org = useOrgId();
  return useQuery({
    queryKey: membersKeys.links(org),
    queryFn: () => required(runtime?.listInviteLinks, 'listInviteLinks')(org),
    enabled: Boolean(org && runtime?.listInviteLinks),
  });
}

export function useCustomRoles() {
  const runtime = useOptionalOsirisRuntime();
  const org = useOrgId();
  return useQuery({
    queryKey: membersKeys.roles(org),
    queryFn: () => required(runtime?.listCustomRoles, 'listCustomRoles')(org),
    enabled: Boolean(org && runtime?.listCustomRoles),
  });
}

/**
 * Mutations for the members admin surface. Each invalidates only the list it
 * affects and carries its own success/error toast, so callers can `mutateAsync`
 * without try/catch — and a rejected dialog submit keeps the dialog open.
 */
export function useMembersMutations() {
  const runtime = useOptionalOsirisRuntime();
  const org = useOrgId();
  const queryClient = useQueryClient();

  const invalidate = (key: readonly unknown[]) => () => {
    void queryClient.invalidateQueries({ queryKey: key });
  };

  const updateMemberRole = useMutation({
    mutationFn: (vars: { userId: string; input: OsirisUpdateMemberRoleInput }) =>
      required(runtime?.updateMemberRole, 'updateMemberRole')(org, vars.userId, vars.input),
    onSuccess: () => {
      invalidate(membersKeys.members(org))();
      appToast.success('Role updated.');
    },
    onError: (error) => appToast.fromApiError(error, 'Role could not be updated.'),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => required(runtime?.removeMember, 'removeMember')(org, userId),
    onSuccess: () => {
      invalidate(membersKeys.members(org))();
      appToast.success('Member removed.');
    },
    onError: (error) => appToast.fromApiError(error, 'Member could not be removed.'),
  });

  const createInvitation = useMutation({
    mutationFn: (input: OsirisCreateInvitationInput) =>
      required(runtime?.createInvitation, 'createInvitation')(org, input),
    onSuccess: () => {
      invalidate(membersKeys.invitations(org))();
      appToast.success('Invitation sent.');
    },
    onError: (error) => appToast.fromApiError(error, 'Invitation could not be sent.'),
  });

  const revokeInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      required(runtime?.revokeInvitation, 'revokeInvitation')(org, invitationId),
    onSuccess: () => {
      invalidate(membersKeys.invitations(org))();
      appToast.success('Invitation revoked.');
    },
    onError: (error) => appToast.fromApiError(error, 'Invitation could not be revoked.'),
  });

  const createInviteLink = useMutation({
    mutationFn: (input: OsirisCreateInviteLinkInput) =>
      required(runtime?.createInviteLink, 'createInviteLink')(org, input),
    onSuccess: () => {
      invalidate(membersKeys.links(org))();
      appToast.success('Invite link created.');
    },
    onError: (error) => appToast.fromApiError(error, 'Invite link could not be created.'),
  });

  const revokeInviteLink = useMutation({
    mutationFn: (linkId: string) =>
      required(runtime?.revokeInviteLink, 'revokeInviteLink')(org, linkId),
    onSuccess: () => {
      invalidate(membersKeys.links(org))();
      appToast.success('Invite link revoked.');
    },
    onError: (error) => appToast.fromApiError(error, 'Invite link could not be revoked.'),
  });

  const saveCustomRole = useMutation({
    // Full create input; update accepts a Partial, so the same shape serves both.
    mutationFn: (vars: { roleId: string | null; input: OsirisCreateCustomRoleInput }) =>
      vars.roleId
        ? required(runtime?.updateCustomRole, 'updateCustomRole')(org, vars.roleId, vars.input)
        : required(runtime?.createCustomRole, 'createCustomRole')(org, vars.input),
    onSuccess: (_data, vars) => {
      invalidate(membersKeys.roles(org))();
      appToast.success(vars.roleId ? 'Role saved.' : 'Role created.');
    },
    onError: (error) => appToast.fromApiError(error, 'Role could not be saved.'),
  });

  const deleteCustomRole = useMutation({
    mutationFn: (roleId: string) =>
      required(runtime?.deleteCustomRole, 'deleteCustomRole')(org, roleId),
    onSuccess: () => {
      invalidate(membersKeys.roles(org))();
      appToast.success('Role deleted.');
    },
    onError: (error) => appToast.fromApiError(error, 'Role could not be deleted.'),
  });

  return {
    updateMemberRole,
    removeMember,
    createInvitation,
    revokeInvitation,
    createInviteLink,
    revokeInviteLink,
    saveCustomRole,
    deleteCustomRole,
  };
}
