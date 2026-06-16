// apps/web/src/modules/members/MembersPage.tsx
import { useMemo, useState } from 'react';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { PageHeaderCtaButton } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import { CustomRolesSection } from '@/components/settings/members/CustomRolesSection';
import {
  useCustomRoles,
  useInvitations,
  useInviteLinks,
  useMembers,
  useMembersMutations,
} from '@/components/settings/members/data/useMembersData';
import { InvitationsSection } from '@/components/settings/members/InvitationsSection';
import { InviteLinksSection } from '@/components/settings/members/InviteLinksSection';
import { MembersSection } from '@/components/settings/members/MembersSection';
import {
  buildRoleOptions,
  CUSTOM_ROLE_FORM_FIELDS,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from '@/components/settings/members/shared';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { LinkIcon, LockIcon, TeamIcon, UserAddIcon } from '@/lib/icons';
import { membersPageIcon } from '@/lib/modulePageIcons';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

export function MembersPage() {
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

  const [activeSection, setActiveSection] = useState('members');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OsirisCustomRole | null>(null);

  // Inline actions resolve once the request settles (so each section's confirm
  // dialog closes on completion) and never reject — failures are surfaced by
  // the mutation's own onError toast.
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

  const handleSaveRole = async (values: Record<string, FormFieldValue>) => {
    // TODO(members): permission + module multiselect editors (sent empty for now).
    await mutations.saveCustomRole.mutateAsync({
      roleId: editingRole?.id ?? null,
      input: {
        name: String(values.name ?? '').trim(),
        description: String(values.description ?? '').trim(),
        baseRole: String(values.baseRole ?? 'member') as 'member' | 'viewer',
        agentAccess: Boolean(values.agentAccess),
        permissions: [],
        allowedModules: [],
      },
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await mutations.deleteCustomRole.mutateAsync(roleId);
    } catch {
      /* surfaced by onError toast */
    }
  };

  const sections: SettingsSectionConfig[] = [
    {
      id: 'members',
      label: 'Members',
      icon: <TeamIcon size={16} weight="duotone" />,
      title: 'Members',
      sectionDescription: 'People with access to this workspace.',
      render: () => (
        <MembersSection
          members={members}
          customRoles={customRoles}
          isLoading={membersQuery.isLoading}
          onChangeRole={handleChangeRole}
          onRemove={handleRemoveMember}
        />
      ),
    },
    {
      id: 'invitations',
      label: 'Invitations',
      icon: <UserAddIcon size={16} weight="duotone" />,
      title: 'Invitations',
      sectionDescription: 'Pending email invitations.',
      render: () => (
        <InvitationsSection invitations={invitations} onRevoke={handleRevokeInvitation} />
      ),
    },
    {
      id: 'links',
      label: 'Invite links',
      icon: <LinkIcon size={16} weight="duotone" />,
      title: 'Invite links',
      sectionDescription: 'Shareable links anyone can use to join.',
      render: () => (
        <InviteLinksSection
          links={links}
          onCreate={() => setLinkOpen(true)}
          onRevoke={handleRevokeLink}
        />
      ),
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: <LockIcon size={16} weight="duotone" />,
      title: 'Custom roles',
      sectionDescription: 'Organization-specific permission roles.',
      render: () => (
        <CustomRolesSection
          roles={customRoles}
          onCreate={() => {
            setEditingRole(null);
            setRoleOpen(true);
          }}
          onEdit={(role) => {
            setEditingRole(role);
            setRoleOpen(true);
          }}
          onDelete={handleDeleteRole}
        />
      ),
    },
  ];

  return (
    <ModulePage
      title="Members"
      subtitle="Manage who can access this workspace"
      icon={membersPageIcon()}
      layoutClassName={MODULE_PAGE_SECTION_NAV_CLASS}
      actions={
        <PageHeaderCtaButton onClick={() => setInviteOpen(true)}>
          {/* eslint-disable-next-line oktavius/no-bare-jsx-strings -- members module pending i18n */}
          <UserAddIcon size={16} className="mr-1.5" aria-hidden="true" />
          Invite member
        </PageHeaderCtaButton>
      }
    >
      <SettingsPageFactory
        sections={sections}
        activeKey={activeSection}
        onActiveKeyChange={setActiveSection}
      />

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

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={roleOpen}
        onOpenChange={(open) => {
          setRoleOpen(open);
          if (!open) setEditingRole(null);
        }}
        title={editingRole ? 'Edit custom role' : 'Add custom role'}
        fields={CUSTOM_ROLE_FORM_FIELDS}
        defaultValues={{
          name: editingRole?.name ?? '',
          description: editingRole?.description ?? '',
          baseRole: editingRole?.baseRole ?? 'member',
          agentAccess: editingRole?.agentAccess ?? false,
        }}
        submitLabel={editingRole ? 'Save' : 'Create'}
        isSubmitting={mutations.saveCustomRole.isPending}
        onSubmit={handleSaveRole}
      />
    </ModulePage>
  );
}
