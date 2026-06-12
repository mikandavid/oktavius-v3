import { Button, Checkbox } from '@oktavius/base-ui';

import { permitted, type PermissionSubject } from '@/lib/permissions';

import { CRUD_TABLE_SELECTION_CHECKBOX_CLASS } from './crudTableDensity';
import type { BulkAction } from './crudTableTypes';

function bulkActionVisible(
  action: BulkAction,
  selectedCount: number,
  permissionSubject: PermissionSubject,
) {
  if (!permitted(action.permission, permissionSubject)) return false;
  if (action.minSelection != null && selectedCount < action.minSelection) return false;
  if (action.maxSelection != null && selectedCount > action.maxSelection) return false;
  return true;
}

export function CrudTableBulkActionBar({
  selectedCount,
  actions,
  selectedIds,
  rowIds,
  onClear,
  onToggleAll,
  invokeBulkAction,
  permissionSubject,
}: {
  selectedCount: number;
  actions: BulkAction[];
  selectedIds: string[];
  rowIds: string[];
  onClear: () => void;
  onToggleAll: () => void;
  invokeBulkAction: (action: BulkAction, ids: string[]) => void;
  permissionSubject: PermissionSubject;
}) {
  const visibleActions = actions.filter((action) =>
    bulkActionVisible(action, selectedCount, permissionSubject),
  );
  if (selectedCount === 0 || visibleActions.length === 0) return null;

  const allRowsSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
  const hasPartialSelection = !allRowsSelected && rowIds.some((id) => selectedIds.includes(id));

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sidebar-primary/15 bg-sidebar-primary/[0.06] px-5 py-2"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Checkbox
          className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
          checked={allRowsSelected ? true : hasPartialSelection ? 'indeterminate' : false}
          aria-label="Select all on this page"
          onCheckedChange={onToggleAll}
        />
        <span className="truncate text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.key}
            variant={action.destructive ? 'destructive' : 'outline'}
            size="sm"
            className="h-8 gap-1.5 bg-background/80"
            onClick={() => invokeBulkAction(action, selectedIds)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
