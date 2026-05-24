import { useMemo, useState } from 'react';

import {
  Button,
  SectionCard,
  SettingsTable,
  applyOrderedIds,
  nextSortOrder,
  sortBySortOrder,
  type SettingsTableColumn,
} from '@oktavius/base-ui';

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
  /** Picker display order — set automatically when `orderable` is enabled. */
  sortOrder?: number;
}

type CatalogFormValues = {
  label: string;
  code: string;
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
    name: 'active',
    label: 'Enabled',
    type: 'switch',
    description: 'Inactive options are hidden from pickers.',
  },
];

const emptyFormValues = (): CatalogFormValues => ({
  label: '',
  code: '',
  active: true,
});

function toFormValues(option: CatalogOption): CatalogFormValues {
  return {
    label: option.label,
    code: option.code ?? '',
    active: option.active,
  };
}

function toCatalogOption(
  values: CatalogFormValues,
  id: string,
  options: CatalogOption[],
  editingOption: CatalogOption | null,
  orderable: boolean,
): CatalogOption {
  return {
    id,
    label: values.label.trim(),
    code: values.code.trim() || undefined,
    sortOrder: orderable ? (editingOption?.sortOrder ?? nextSortOrder(options)) : undefined,
    active: values.active,
  };
}

function sortCatalogOptions(options: CatalogOption[], orderable: boolean): CatalogOption[] {
  if (orderable) return sortBySortOrder(options);
  return [...options].sort((a, b) => a.label.localeCompare(b.label));
}

type CatalogOptionsManagerBaseProps = {
  title: string;
  description?: string;
  options: CatalogOption[];
  onSave: (option: CatalogOption) => void;
  onDelete: (id: string) => void;
  className?: string;
};

export type CatalogOptionsManagerProps =
  | (CatalogOptionsManagerBaseProps & {
      /** Drag-to-reorder for picker lists (payment terms, case types). Default: false. */
      orderable: true;
      onReorder: (options: CatalogOption[]) => void;
    })
  | (CatalogOptionsManagerBaseProps & {
      orderable?: false;
      onReorder?: never;
    });

/** Settings block for user-editable catalog values (payment terms, case types, etc.). */
export function CatalogOptionsManager({
  title,
  description,
  options,
  onSave,
  onDelete,
  orderable = false,
  onReorder,
  className,
}: CatalogOptionsManagerProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<CatalogOption | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogOption | null>(null);

  const sorted = useMemo(() => sortCatalogOptions(options, orderable), [options, orderable]);

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
        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
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
        onReorder={
          orderable && onReorder
            ? (orderedIds) => onReorder(applyOrderedIds(options, orderedIds))
            : undefined
        }
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
          onSave(
            toCatalogOption(
              values,
              editingOption?.id ?? `cat_${Date.now()}`,
              options,
              editingOption,
              orderable,
            ),
          );
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
