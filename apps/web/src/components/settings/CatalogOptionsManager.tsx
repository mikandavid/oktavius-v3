import { useMemo, useState } from 'react';

import { Button, SectionCard, SettingsTable, type SettingsTableColumn } from '@oktavius/base-ui';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import { IconDeleteButton, IconEditButton } from '@/components/common/RecordIconButtons';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { type FormField } from '@/components/forms/EntityForm';
import { PlusIcon } from '@/lib/icons';

export interface CatalogOption {
  id: string;
  label: string;
  code?: string;
  active: boolean;
  sortOrder?: number;
}

export interface CatalogOptionsManagerProps {
  title: string;
  description?: string;
  options: CatalogOption[];
  onSave: (option: CatalogOption) => void;
  onDelete: (id: string) => void;
  className?: string;
}

type CatalogFormValues = {
  label: string;
  code: string;
  sortOrder: string;
  active: boolean;
};

const CATALOG_STATUS_MAP = {
  Active: 'success',
  Inactive: 'secondary',
} as const;

const catalogFormFields: FormField[] = [
  {
    name: 'label',
    label: 'Label',
    type: 'text',
    required: true,
    placeholder: 'e.g. Net 30',
  },
  {
    name: 'code',
    label: 'Code',
    type: 'text',
    placeholder: 'e.g. NET30',
  },
  {
    name: 'sortOrder',
    label: 'Sort order',
    type: 'number',
  },
  {
    name: 'active',
    label: 'Active',
    type: 'switch',
    description: 'Inactive options are hidden from pickers.',
  },
];

const emptyFormValues = (): CatalogFormValues => ({
  label: '',
  code: '',
  sortOrder: '0',
  active: true,
});

function toFormValues(option: CatalogOption): CatalogFormValues {
  return {
    label: option.label,
    code: option.code ?? '',
    sortOrder: String(option.sortOrder ?? 0),
    active: option.active,
  };
}

function toCatalogOption(values: CatalogFormValues, id: string): CatalogOption {
  return {
    id,
    label: values.label.trim(),
    code: values.code.trim() || undefined,
    sortOrder: Number(values.sortOrder) || 0,
    active: values.active,
  };
}

/** Settings block for user-editable catalog values (payment terms, case types, etc.). */
export function CatalogOptionsManager({
  title,
  description,
  options,
  onSave,
  onDelete,
  className,
}: CatalogOptionsManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CatalogOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogOption | null>(null);

  const sorted = useMemo(
    () => [...options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [options],
  );

  const openCreate = () => {
    setEditingOption(null);
    setEditorOpen(true);
  };

  const openEdit = (option: CatalogOption) => {
    setEditingOption(option);
    setEditorOpen(true);
  };

  const columns: SettingsTableColumn<CatalogOption>[] = [
    {
      key: 'label',
      header: 'Label',
      cell: (row) => <span className="font-medium text-foreground">{row.label}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      cell: (row) => <span className="text-muted-foreground">{row.code ?? '—'}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      cell: (row) => (
        <StatusBadge status={row.active ? 'Active' : 'Inactive'} variantMap={CATALOG_STATUS_MAP} />
      ),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'w-24',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconEditButton label={`Edit ${row.label}`} onClick={() => openEdit(row)} />
          <IconDeleteButton label={`Delete ${row.label}`} onClick={() => setDeleteTarget(row)} />
        </div>
      ),
    },
  ];

  return (
    <SectionCard
      title={title}
      meta={description}
      className={className}
      actions={
        <Button type="button" variant="outline" size="sm" onClick={openCreate}>
          <PlusIcon size={14} className="mr-1.5" />
          Add option
        </Button>
      }
    >
      <SettingsTable
        columns={columns}
        rows={sorted}
        getRowId={(row) => row.id}
        onRowClick={openEdit}
        emptyMessage="No catalog options yet. Add the first entry."
      />

      <SubEntityFormDialog<CatalogFormValues>
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title={editingOption ? 'Edit option' : 'Add option'}
        description="Catalog values appear in module dropdowns and filters."
        fields={catalogFormFields}
        defaultValues={editingOption ? toFormValues(editingOption) : emptyFormValues()}
        submitLabel={editingOption ? 'Save' : 'Create'}
        onSubmit={(values) => {
          onSave(toCatalogOption(values, editingOption?.id ?? `cat_${Date.now()}`));
          setEditingOption(null);
        }}
      />

      {deleteTarget ? (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title={`Delete ${deleteTarget.label}?`}
          description="This removes the catalog option from pickers. Existing records keep their stored value."
          confirmLabel="Delete"
          onConfirm={() => {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      ) : null}
    </SectionCard>
  );
}

// Exported for modules that define catalog editors in shared.tsx
export { catalogFormFields, type CatalogFormValues };
