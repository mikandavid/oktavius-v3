import type { SettingsTableColumn } from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';
import { type FormField, type FormFieldValue } from '@/components/forms/EntityForm';

import { CatalogBlockManager, nextSortOrder } from './CatalogBlockManager';

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

function asCatalogFormValues(values: Record<string, FormFieldValue>): CatalogFormValues {
  return {
    label: String(values.label ?? ''),
    code: String(values.code ?? ''),
    active: Boolean(values.active),
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

const columns: SettingsTableColumn<CatalogOption>[] = [
  {
    key: 'label',
    header: 'Label',
    cell: (row) => <span className="font-medium text-foreground">{row.label}</span>,
  },
  {
    key: 'code',
    header: 'Code',
    cell: (row) => <span className="text-muted-foreground">{row.code ?? '-'}</span>,
  },
  {
    key: 'active',
    header: 'Status',
    cell: (row) => (
      <StatusBadge status={row.active ? 'Active' : 'Inactive'} variantMap={CATALOG_STATUS_MAP} />
    ),
  },
];

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

/** Backwards-compatible payment-term catalog wrapper over the generic CatalogBlockManager. */
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
  return (
    <CatalogBlockManager<CatalogOption>
      title={title}
      description={description}
      rows={options}
      columns={columns}
      formFields={catalogFormFields}
      emptyValues={emptyFormValues}
      toFormValues={toFormValues}
      fromFormValues={(values, context) =>
        toCatalogOption(
          asCatalogFormValues(values),
          context.id,
          options,
          context.editingRow,
          orderable,
        )
      }
      orderable={orderable}
      onCreate={onSave}
      onUpdate={(_id, option) => onSave(option)}
      onDelete={onDelete}
      onReorder={orderable ? onReorder : undefined}
      className={className}
      getRowLabel={(row) => row.label}
    />
  );
}

// Exported for modules that define catalog editors in shared.tsx
export { catalogFormFields, type CatalogFormValues };
