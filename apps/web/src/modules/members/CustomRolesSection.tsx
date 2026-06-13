// apps/web/src/modules/members/CustomRolesSection.tsx
import { Button, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DeleteIcon, EditIcon, PlusIcon } from '@/lib/icons';
import type { OsirisCustomRole } from '@/runtime/osiris/customRolesAdminClient';

type CustomRolesSectionProps = {
  roles: OsirisCustomRole[];
  onCreate: () => void;
  onEdit: (role: OsirisCustomRole) => void;
  onDelete: (roleId: string) => Promise<void>;
};

export function CustomRolesSection({ roles, onCreate, onEdit, onDelete }: CustomRolesSectionProps) {
  const [deleteTarget, setDeleteTarget] = useState<OsirisCustomRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns: SettingsTableColumn<OsirisCustomRole>[] = [
    { key: 'name', header: 'Role', cell: (row) => row.name },
    { key: 'description', header: 'Description', cell: (row) => row.description || '—' },
    { key: 'members', header: 'Members', cell: (row) => String(row.memberCount) },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" aria-label="Edit role" onClick={() => onEdit(row)}>
            <EditIcon size={16} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete role"
            onClick={() => setDeleteTarget(row)}
          >
            <DeleteIcon size={16} aria-hidden="true" />
          </Button>
        </div>
      ),
    },
  ];

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCreate}>
          <PlusIcon size={14} className="mr-1.5" aria-hidden="true" />
          Add custom role
        </Button>
      </div>
      <SettingsTable<OsirisCustomRole>
        columns={columns}
        rows={roles}
        getRowId={(row) => row.id}
        emptyMessage="No custom roles yet."
      />
      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete custom role?"
        description={`Members assigned "${deleteTarget?.name ?? ''}" fall back to its base role.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        confirmDisabled={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
