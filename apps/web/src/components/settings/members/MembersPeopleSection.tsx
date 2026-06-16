// apps/web/src/components/settings/members/MembersPeopleSection.tsx
import { Button } from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import { UserAddIcon } from '@/lib/icons';

import {
  useCustomRoles,
  useInvitations,
  useInviteLinks,
  useMembers,
  useMembersMutations,
} from './data/useMembersData';
import { InvitationsSection } from './InvitationsSection';
import { InviteLinksSection } from './InviteLinksSection';
import { MembersSection } from './MembersSection';
import {
  buildRoleOptions,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from './shared';

export function MembersPeopleSection() {
  const membersQuery = useMembers();
  const invitationsQuery = useInvitations();
  const linksQuery = useInviteLinks();
  const rolesQuery = useCustomRoles();
  const mutations = useMembersMutations();

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const invitations = useMemo(() => invitationsQuery.data ?? [], [invitationsQuery.data]);
  const links = useMemo(() => linksQuery.data ?? [], [linksQuery.data]);
  const customRoles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Inline actions resolve once the request settles (so each section's confirm
  // dialog closes on completion) and never reject — failures surface via the
  // mutation's own onError toast.
  const handleChangeRole = async (userId: string, value: string) => {
    try {
      await mutations.updateMemberRole.mutateAsync({ userId, input: roleValueToInput(value) });
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await mutations.removeMember.mutateAsync(userId);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await mutations.revokeInvitation.mutateAsync(id);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleRevokeLink = async (id: string) => {
    try {
      await mutations.revokeInviteLink.mutateAsync(id);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const handleInvite = async (values: Record<string, FormFieldValue>) => {
    const { role, customRoleId } = roleValueToInput(String(values.role ?? 'member'));
    await mutations.createInvitation.mutateAsync({
      email: String(values.email ?? '').trim(),
      // roleValueToInput never yields 'owner' here (not an invitable option); narrow to the invite role union.
      role: role === 'owner' ? 'member' : role,
      customRoleId,
      expiresInDays: Number(values.expiresInDays ?? 7),
    });
  };

  const handleCreateLink = async (values: Record<string, FormFieldValue>) => {
    await mutations.createInviteLink.mutateAsync({
      role: String(values.role ?? 'member') as 'member' | 'viewer',
      maxUses: Number(values.maxUses ?? 10),
      expiresInDays: Number(values.expiresInDays ?? 7),
    });
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
            {}
            <UserAddIcon size={14} className="mr-1.5" aria-hidden="true" />
            Invite member
          </Button>
        </div>
        <MembersSection
          members={members}
          customRoles={customRoles}
          isLoading={membersQuery.isLoading}
          onChangeRole={handleChangeRole}
          onRemove={handleRemoveMember}
        />
      </section>

      <section className="space-y-3">
        {}
        <h3 className="text-sm font-semibold text-foreground">Pending invitations</h3>
        <InvitationsSection invitations={invitations} onRevoke={handleRevokeInvitation} />
      </section>

      <section className="space-y-3">
        {}
        <h3 className="text-sm font-semibold text-foreground">Invite links</h3>
        <InviteLinksSection
          links={links}
          onCreate={() => setLinkOpen(true)}
          onRevoke={handleRevokeLink}
        />
      </section>

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        title="Invite member"
        description="Send an email invitation to join this workspace."
        fields={inviteFormFields(roleOptions)}
        defaultValues={{ email: '', role: 'member', expiresInDays: 7 }}
        submitLabel="Send invite"
        isSubmitting={mutations.createInvitation.isPending}
        onSubmit={handleInvite}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Create invite link"
        description="Generate a shareable link with a fixed role and usage cap."
        fields={INVITE_LINK_FORM_FIELDS}
        defaultValues={{ role: 'member', maxUses: 10, expiresInDays: 7 }}
        submitLabel="Create link"
        isSubmitting={mutations.createInviteLink.isPending}
        onSubmit={handleCreateLink}
      />
    </div>
  );
}
