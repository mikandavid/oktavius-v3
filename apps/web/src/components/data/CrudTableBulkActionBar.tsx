import { Button, Checkbox, cn } from '@oktavius/base-ui';

import { type PermissionSubject, permitted } from '@/lib/permissions';

import {
  CRUD_TABLE_SELECTION_CHECKBOX_CLASS,
  crudTableSelectColumnSlotClass,
} from './crudTableDensity';
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
      className="flex min-h-11 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-sidebar-primary/15 bg-sidebar-primary/[0.06] py-2 pr-5"
    >
      <div className="flex min-w-0 items-center gap-x-3">
        <div className={crudTableSelectColumnSlotClass()}>
          <Checkbox
            className={CRUD_TABLE_SELECTION_CHECKBOX_CLASS}
            checked={allRowsSelected ? true : hasPartialSelection ? 'indeterminate' : false}
            aria-label="Select all on this page"
            onCheckedChange={onToggleAll}
          />
        </div>
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
            className={cn('h-8 gap-1.5', !action.destructive && 'bg-background/80')}
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
