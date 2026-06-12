import {
  applyOrderedIds,
  Button,
  nextSortOrder,
  SectionCard,
  SettingsTable,
  type SettingsTableColumn,
  sortBySortOrder,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormField, FormFieldValue } from '@/components/forms/EntityForm';
import { PlusIcon } from '@/lib/icons';
import {
  canUsePermissionRequirement,
  EMPTY_PERMISSION_SUBJECT,
  type PermissionRequirement,
} from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

type RowWithId = {
  id: string;
  sortOrder?: number;
};

export type CatalogBlockManagerProps<T extends RowWithId> = {
  title: string;
  description?: string;
  rows: T[];
  columns: SettingsTableColumn<T>[];
  formFields: FormField[];
  emptyValues: () => Record<string, FormFieldValue>;
  toFormValues: (row: T) => Record<string, FormFieldValue>;
  fromFormValues: (
    values: Record<string, FormFieldValue>,
    context: {
      id: string;
      rows: T[];
      editingRow: T | null;
      orderable: boolean;
    },
  ) => T;
  onCreate?: (draft: T) => void | Promise<void>;
  onUpdate?: (id: string, patch: T) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onReorder?: (rows: T[]) => void | Promise<void>;
  orderable?: boolean;
  permission?: PermissionRequirement;
  className?: string;
  createLabel?: string;
  dialogDescription?: string;
  getRowLabel?: (row: T) => string;
};

function sortRows<T extends RowWithId>(rows: T[], orderable: boolean) {
  if (orderable) return sortBySortOrder(rows);
  return [...rows];
}

export function CatalogBlockManager<T extends RowWithId>({
  title,
  description,
  rows,
  columns,
  formFields,
  emptyValues,
  toFormValues,
  fromFormValues,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
  orderable = false,
  permission,
  className,
  createLabel = 'Add option',
  dialogDescription = 'Catalog values appear in module dropdowns and filters.',
  getRowLabel = (row) => row.id,
}: CatalogBlockManagerProps<T>) {
  const osirisRuntime = useOptionalOsirisRuntime();
  const permissionSubject = useMemo(
    () => osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT,
    [osirisRuntime?.permissionSubject],
  );
  const canManage = canUsePermissionRequirement(permissionSubject, permission);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const sorted = useMemo(() => sortRows(rows, orderable), [orderable, rows]);

  const openCreate = () => {
    setEditingRow(null);
    setEditorOpen(true);
  };

  const openEdit = (row: T) => {
    setEditingRow(row);
    setEditorOpen(true);
  };

  const actionColumns: SettingsTableColumn<T>[] = canManage
    ? [
        ...columns,
        {
          key: 'actions',
          header: '',
          headerClassName: 'w-24',
          cell: (row) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click-shield that keeps row navigation from firing around the action buttons; not itself a control
            <div
              className="flex items-center justify-end gap-1"
              onClick={(event) => event.stopPropagation()}
            >
              <IconEditButton label={`Edit ${getRowLabel(row)}`} onClick={() => openEdit(row)} />
              <IconDeleteButton
                label={`Delete ${getRowLabel(row)}`}
                onClick={() => setDeleteTarget(row)}
              />
            </div>
          ),
        },
      ]
    : columns;

  return (
    <SectionCard
      title={title}
      meta={description}
      className={className}
      actions={
        canManage && onCreate ? (
          <Button type="button" variant="outline" size="sm" onClick={openCreate}>
            <PlusIcon size={14} className="mr-1.5" />
            {createLabel}
          </Button>
        ) : null
      }
    >
      <SettingsTable
        columns={actionColumns}
        rows={sorted}
        getRowId={(row) => row.id}
        onRowClick={canManage ? openEdit : undefined}
        onReorder={
          canManage && orderable && onReorder
            ? (orderedIds) => onReorder(applyOrderedIds(rows, orderedIds))
            : undefined
        }
        emptyMessage="No catalog options yet. Add the first entry."
      />

      <SubEntityFormDialog<Record<string, FormFieldValue>>
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editingRow ? 'Edit option' : createLabel}
        description={dialogDescription}
        fields={formFields}
        defaultValues={editingRow ? toFormValues(editingRow) : emptyValues()}
        submitLabel={editingRow ? 'Save' : 'Create'}
        onSubmit={(values) => {
          const row = fromFormValues(values, {
            id: editingRow?.id ?? `cat_${Date.now()}`,
            rows,
            editingRow,
            orderable,
          });
          if (editingRow) {
            void onUpdate?.(editingRow.id, row);
          } else {
            void onCreate?.(row);
          }
          setEditingRow(null);
        }}
      />

      {deleteTarget ? (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title={`Delete ${getRowLabel(deleteTarget)}?`}
          description="This removes the catalog option from pickers. Existing records keep their stored value."
          confirmLabel="Delete"
          onConfirm={() => {
            void onDelete?.(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </SectionCard>
  );
}

export { nextSortOrder };
