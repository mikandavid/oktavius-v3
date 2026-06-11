import { permitted, type PermissionSubject } from '@/lib/permissions';

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
    columns: columns.filter((column) => permitted(column.permission, subject)),
    rowActions: rowActions.filter((action) => permitted(action.permission, subject)),
    bulkActions: bulkActions.filter((action) => permitted(action.permission, subject)),
  };
}
