// apps/web/src/components/settings/members/MembersSection.tsx
import { useMemo, useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { CrudListShell } from '@/components/data/CrudListShell';
import type { CrudRowAction } from '@/components/data/CrudTable';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import { useListPageState } from '@/lib/useListPageState';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';
import type { OsirisOrgMember } from '@/runtime/osiris/membersAdminClient';

import {
  buildRoleOptions,
  MEMBER_COLUMNS,
  memberRoleValue,
  type MemberRow,
  toMemberRow,
} from './shared';

type MembersSectionProps = {
  members: OsirisOrgMember[];
  customRoles: OsirisCustomRole[];
  isLoading: boolean;
  onChangeRole: (userId: string, value: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};

export function MembersSection({
  members,
  customRoles,
  isLoading,
  onChangeRole,
  onRemove,
}: MembersSectionProps) {
  const roleOptions = useMemo(() => buildRoleOptions(customRoles), [customRoles]);
  const rows = useMemo(
    () => members.map((member) => toMemberRow(member, customRoles)),
    [members, customRoles],
  );

  const list = useListPageState<MemberRow>({
    rows,
    defaultSort: 'name',
    filterKeys: [],
    searchKeys: ['name', 'email'],
    queryNamespace: 'members',
  });

  const [roleDialogMember, setRoleDialogMember] = useState<OsirisOrgMember | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const rowActions: CrudRowAction<MemberRow>[] = [
    {
      key: 'change-role',
      label: 'Change role',
      // Owners are managed elsewhere; never reassign an owner from this list.
      hidden: (row) => row.member.role === 'owner',
      onClick: (row) => setRoleDialogMember(row.member),
    },
    {
      key: 'remove',
      label: 'Remove from workspace',
      destructive: true,
      hidden: (row) => row.member.role === 'owner',
      confirm: {
        title: 'Remove member?',
        description: 'They lose access to this workspace immediately. This cannot be undone.',
        actionLabel: 'Remove',
      },
      onClick: (row) => onRemove(row.member.userId),
    },
  ];

  return (
    <>
      <CrudListShell<MemberRow>
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder="Search members"
        rows={list.paged}
        columns={MEMBER_COLUMNS}
        rowActions={rowActions}
        sort={list.sort}
        onSortChange={list.onSortChange}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.onPageChange}
        isLoading={isLoading}
        emptyTitle="No members yet"
        emptyDescription="Invite teammates to give them access to this workspace."
        entityLabel="member"
        enableListCrud={false}
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={roleDialogMember !== null}
        onOpenChange={(open) => {
          if (!open) setRoleDialogMember(null);
        }}
        title="Change role"
        description={roleDialogMember?.email ?? undefined}
        fields={[
          { name: 'role', label: 'Role', type: 'combobox', required: true, options: roleOptions },
        ]}
        defaultValues={{
          role: roleDialogMember ? memberRoleValue(roleDialogMember) : 'member',
        }}
        submitLabel="Save"
        isSubmitting={isSavingRole}
        onSubmit={async (values) => {
          if (!roleDialogMember) return;
          setIsSavingRole(true);
          try {
            await onChangeRole(roleDialogMember.userId, String(values.role ?? 'member'));
            setRoleDialogMember(null);
          } finally {
            setIsSavingRole(false);
          }
        }}
      />
    </>
  );
}
