import type { NavigateFunction } from 'react-router-dom';

import { DeleteIcon, EditIcon } from '@/lib/icons';
import { toast } from '@/lib/toast';

import type { BulkAction, CrudRowAction } from './CrudTable';

export type StandardListCrudConfig<T extends { id: string }> = {
  /** Singular noun for copy, e.g. `client` */
  entityLabel: string;
  /** Plural noun — defaults to `${entityLabel}s` */
  pluralLabel?: string;
  getDetailHref: (row: T) => string;
  navigate: NavigateFunction;
  /** Optional hook when rows are deleted (demo data is not mutated by default) */
  onDelete?: (ids: string[]) => void;
  /** Called after row/bulk delete so the parent can clear selection */
  onAfterDelete?: (ids: string[]) => void;
};

export function buildStandardListCrudActions<T extends { id: string }>({
  entityLabel,
  pluralLabel,
  getDetailHref,
  navigate,
  onDelete,
  onAfterDelete,
}: StandardListCrudConfig<T>): {
  selectable: true;
  rowActions: CrudRowAction<T>[];
  bulkActions: BulkAction[];
} {
  const plural = pluralLabel ?? `${entityLabel}s`;
  const titleCase = entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1);

  const finishDelete = (ids: string[]) => {
    onDelete?.(ids);
    onAfterDelete?.(ids);
    if (ids.length === 1) {
      toast.success(`${titleCase} deleted.`);
    } else {
      toast.success(`Deleted ${ids.length} ${plural}.`);
    }
  };

  const rowActions: CrudRowAction<T>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditIcon size={14} />,
      onClick: (row) => navigate(getDetailHref(row)),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteIcon size={14} />,
      destructive: true,
      confirm: {
        title: `Delete this ${entityLabel}?`,
        description: 'This action cannot be undone.',
        actionLabel: 'Delete',
      },
      onClick: (row) => finishDelete([row.id]),
    },
  ];

  const bulkActions: BulkAction[] = [
    {
      key: 'bulk-edit',
      label: 'Edit',
      icon: <EditIcon size={14} />,
      maxSelection: 1,
      onClick: (ids) => navigate(getDetailHref({ id: ids[0] } as T)),
    },
    {
      key: 'bulk-delete',
      label: 'Delete selected',
      icon: <DeleteIcon size={14} />,
      destructive: true,
      confirm: {
        title: (count) =>
          `Delete ${count} ${count === 1 ? entityLabel : plural}?`,
        description: 'This action cannot be undone.',
        actionLabel: 'Delete',
      },
      onClick: (ids) => finishDelete(ids),
    },
  ];

  return { selectable: true, rowActions, bulkActions };
}
