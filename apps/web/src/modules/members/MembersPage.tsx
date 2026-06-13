// apps/web/src/modules/members/MembersPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MODULE_PAGE_SECTION_NAV_CLASS } from '@/components/common/pageChrome';
import { PageHeaderCtaButton } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import {
  SettingsPageFactory,
  type SettingsSectionConfig,
} from '@/components/settings/SettingsPageFactory';
import { LinkIcon, LockIcon, TeamIcon, UserAddIcon } from '@/lib/icons';
import { membersPageIcon } from '@/lib/modulePageIcons';
import { appToast } from '@/lib/toast';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisInvitation, OsirisInviteLink } from '@/runtime/osiris/invitationsAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { CustomRolesSection } from './CustomRolesSection';
import { InvitationsSection } from './InvitationsSection';
import { InviteLinksSection } from './InviteLinksSection';
import { MembersSection } from './MembersSection';
import {
  buildRoleOptions,
  CUSTOM_ROLE_FORM_FIELDS,
  INVITE_LINK_FORM_FIELDS,
  inviteFormFields,
  roleValueToInput,
} from './shared';

export function MembersPage() {
  const runtime = useOptionalOsirisRuntime();
  const orgId = runtime?.activeOrgId ?? null;

  const [members, setMembers] = useState<OsirisOrgMember[]>([]);
  const [invitations, setInvitations] = useState<OsirisInvitation[]>([]);
  const [links, setLinks] = useState<OsirisInviteLink[]>([]);
  const [customRoles, setCustomRoles] = useState<OsirisCustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('members');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OsirisCustomRole | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const refreshMembers = useCallback(async () => {
    if (!orgId || !runtime?.listOrgMembers) return;
    setMembers(await runtime.listOrgMembers(orgId));
  }, [orgId, runtime]);
  const refreshInvitations = useCallback(async () => {
    if (!orgId || !runtime?.listInvitations) return;
    setInvitations(await runtime.listInvitations(orgId));
  }, [orgId, runtime]);
  const refreshLinks = useCallback(async () => {
    if (!orgId || !runtime?.listInviteLinks) return;
    setLinks(await runtime.listInviteLinks(orgId));
  }, [orgId, runtime]);
  const refreshRoles = useCallback(async () => {
    if (!orgId || !runtime?.listCustomRoles) return;
    setCustomRoles(await runtime.listCustomRoles(orgId));
  }, [orgId, runtime]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void Promise.all([refreshMembers(), refreshInvitations(), refreshLinks(), refreshRoles()])
      .catch((error: unknown) => appToast.fromApiError(error, 'Members could not be loaded.'))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshMembers, refreshInvitations, refreshLinks, refreshRoles]);

  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);

  const handleChangeRole = async (userId: string, value: string) => {
    if (!runtime?.updateMemberRole) return;
    try {
      await runtime.updateMemberRole(orgId, userId, roleValueToInput(value));
      await refreshMembers();
      appToast.success('Role updated.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be updated.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!runtime?.removeMember) return;
    try {
      await runtime.removeMember(orgId, userId);
      await refreshMembers();
      appToast.success('Member removed.');
    } catch (error) {
      appToast.fromApiError(error, 'Member could not be removed.');
    }
  };

  const handleInvite = async (values: Record<string, FormFieldValue>) => {
    if (!runtime?.createInvitation) return;
    setIsInviting(true);
    try {
      const { role, customRoleId } = roleValueToInput(String(values.role ?? 'member'));
      await runtime.createInvitation(orgId, {
        email: String(values.email ?? '').trim(),
        // roleValueToInput never yields 'owner' here (not an invitable option); narrow to the invite role union.
        role: role === 'owner' ? 'member' : role,
        customRoleId,
        expiresInDays: Number(values.expiresInDays ?? 7),
      });
      await refreshInvitations();
      appToast.success('Invitation sent.');
    } catch (error) {
      appToast.fromApiError(error, 'Invitation could not be sent.');
      throw error;
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateLink = async (values: Record<string, FormFieldValue>) => {
    if (!runtime?.createInviteLink) return;
    setIsCreatingLink(true);
    try {
      await runtime.createInviteLink(orgId, {
        role: String(values.role ?? 'member') as 'member' | 'viewer',
        maxUses: Number(values.maxUses ?? 10),
        expiresInDays: Number(values.expiresInDays ?? 7),
      });
      await refreshLinks();
      appToast.success('Invite link created.');
    } catch (error) {
      appToast.fromApiError(error, 'Invite link could not be created.');
      throw error;
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleSaveRole = async (values: Record<string, FormFieldValue>) => {
    if (!runtime) return;
    setIsSavingRole(true);
    // TODO(members): permission + module multiselect editors (sent empty for now).
    const input = {
      name: String(values.name ?? '').trim(),
      description: String(values.description ?? '').trim(),
      baseRole: String(values.baseRole ?? 'member') as 'member' | 'viewer',
      agentAccess: Boolean(values.agentAccess),
      permissions: [] as string[],
      allowedModules: [] as string[],
    };
    try {
      if (editingRole && runtime.updateCustomRole) {
        await runtime.updateCustomRole(orgId, editingRole.id, input);
      } else if (runtime.createCustomRole) {
        await runtime.createCustomRole(orgId, input);
      }
      await refreshRoles();
      appToast.success(editingRole ? 'Role saved.' : 'Role created.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be saved.');
      throw error;
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!runtime?.deleteCustomRole) return;
    try {
      await runtime.deleteCustomRole(orgId, roleId);
      await refreshRoles();
      appToast.success('Role deleted.');
    } catch (error) {
      appToast.fromApiError(error, 'Role could not be deleted.');
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
          isLoading={isLoading}
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
        <InvitationsSection
          invitations={invitations}
          onRevoke={async (id) => {
            if (!runtime?.revokeInvitation) return;
            try {
              await runtime.revokeInvitation(orgId, id);
              await refreshInvitations();
              appToast.success('Invitation revoked.');
            } catch (error) {
              appToast.fromApiError(error, 'Invitation could not be revoked.');
            }
          }}
        />
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
          onRevoke={async (id) => {
            if (!runtime?.revokeInviteLink) return;
            try {
              await runtime.revokeInviteLink(orgId, id);
              await refreshLinks();
              appToast.success('Invite link revoked.');
            } catch (error) {
              appToast.fromApiError(error, 'Invite link could not be revoked.');
            }
          }}
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
        isSubmitting={isInviting}
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
        isSubmitting={isCreatingLink}
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
        isSubmitting={isSavingRole}
        onSubmit={handleSaveRole}
      />
    </ModulePage>
  );
}
