import type { PermissionSubject } from '@/lib/permissions';
import { canUsePermissionRequirement } from '@/lib/permissions';

import type { BulkAction, CrudColumn, CrudRowAction } from './crudTableTypes';

type FilterCrudListPermissionsInput<T> = {
  columns: CrudColumn<T>[];
  rowActions: CrudRowAction<T>[];
  bulkActions: BulkAction[];
  subject: PermissionSubject;
};

export function filterCrudListPermissions<T>({
  columns,
  rowActions,
  bulkActions,
  subject,
}: FilterCrudListPermissionsInput<T>) {
  return {
    columns: columns.filter((column) => canUsePermissionRequirement(subject, column.permission)),
    rowActions: rowActions.filter((action) =>
      canUsePermissionRequirement(subject, action.permission),
    ),
    bulkActions: bulkActions.filter((action) =>
      canUsePermissionRequirement(subject, action.permission),
    ),
  };
}
