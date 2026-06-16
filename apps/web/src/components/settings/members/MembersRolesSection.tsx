// apps/web/src/components/settings/members/MembersRolesSection.tsx
import { useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormFieldValue } from '@/components/forms/EntityForm';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

import { CustomRolesSection } from './CustomRolesSection';
import { useCustomRoles, useMembersMutations } from './data/useMembersData';
import { CUSTOM_ROLE_FORM_FIELDS } from './shared';

export function MembersRolesSection() {
  const rolesQuery = useCustomRoles();
  const mutations = useMembersMutations();
  const customRoles = rolesQuery.data ?? [];

  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OsirisCustomRole | null>(null);

  // Intentionally not wrapped in try/catch: on failure the rejection propagates
  // so SubEntityFormDialog keeps the dialog open; the error surfaces via the
  // mutation's onError toast. (handleDeleteRole has no dialog, so it swallows.)
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

  return (
    <>
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
    </>
  );
}
