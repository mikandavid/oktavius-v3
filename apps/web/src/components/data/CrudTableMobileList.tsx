import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@oktavius/base-ui';
import { cn } from '@oktavius/base-ui';
import { Fragment } from 'react';

import { MoreIcon } from '@/lib/icons';

import { renderTypedCell } from './crudTableCells';
import type { CrudColumn, CrudRowAction } from './crudTableTypes';

const TABLE_SELECTION_CHECKBOX_CLASS =
  'border-border/80 data-[state=checked]:border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground data-[state=indeterminate]:border-sidebar-primary data-[state=indeterminate]:bg-sidebar-primary/80 data-[state=indeterminate]:text-sidebar-primary-foreground';

type CrudTableMobileListProps<T extends { id: string }> = {
  rows: T[];
  columns: CrudColumn<T>[];
  selectable?: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  rowActions?: CrudRowAction<T>[];
  onRowClick?: (item: T) => void;
  highlightedId?: string;
  compact?: boolean;
  onRowActionConfirm: (action: CrudRowAction<T>, item: T) => void;
};

function toggleId(selectedIds: string[], id: string): string[] {
  return selectedIds.includes(id)
    ? selectedIds.filter((currentId) => currentId !== id)
    : [...selectedIds, id];
}

export function CrudTableMobileList<T extends { id: string }>({
  rows,
  columns,
  selectable = false,
  selectedIds,
  onSelectionChange,
  rowActions = [],
  onRowClick,
  highlightedId,
  compact,
  onRowActionConfirm,
}: CrudTableMobileListProps<T>) {
  const primaryColumn = columns[0];
  const statusColumn = columns.find(
    (column) => column.type === 'status' && column.key !== primaryColumn?.key,
  );
  const detailColumns = columns.filter(
    (column) => column.key !== primaryColumn?.key && column.key !== statusColumn?.key,
  );

  return (
    <ul className="divide-y divide-border/50 bg-background">
      {rows.map((row) => {
        const visibleActions = rowActions.filter((action) => !action.hidden?.(row));
        const normalActions = visibleActions.filter((action) => !action.destructive);
        const destructiveActions = visibleActions.filter((action) => action.destructive);

        return (
          <li key={row.id}>
            <div
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(event) => {
                if (!onRowClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onRowClick(row);
                }
              }}
              className={cn(
                'flex gap-3 px-4',
                compact ? 'py-2.5' : 'py-3',
                onRowClick &&
                  'cursor-pointer transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none',
                highlightedId === row.id && 'bg-muted/30',
              )}
            >
              {selectable ? (
                <div className="flex shrink-0 items-start pt-0.5">
                  <Checkbox
                    className={TABLE_SELECTION_CHECKBOX_CLASS}
                    checked={selectedIds.includes(row.id)}
                    aria-label="Select row"
                    onClick={(event) => event.stopPropagation()}
                    onCheckedChange={() => onSelectionChange(toggleId(selectedIds, row.id))}
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    {primaryColumn ? (
                      <div className="truncate text-sm font-medium text-foreground">
                        {renderTypedCell(row, primaryColumn)}
                      </div>
                    ) : null}
                    {statusColumn ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {renderTypedCell(row, statusColumn)}
                      </div>
                    ) : null}
                  </div>

                  {visibleActions.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreIcon className="h-4 w-4" weight="bold" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {normalActions.map((action) => (
                          <DropdownMenuItem
                            key={action.key}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (action.confirm) {
                                onRowActionConfirm(action, row);
                                return;
                              }
                              action.onClick(row);
                            }}
                          >
                            {action.icon ? <span className="mr-2">{action.icon}</span> : null}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                        {normalActions.length > 0 && destructiveActions.length > 0 ? (
                          <DropdownMenuSeparator />
                        ) : null}
                        {destructiveActions.map((action) => (
                          <DropdownMenuItem
                            key={action.key}
                            className="text-destructive focus:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (action.confirm) {
                                onRowActionConfirm(action, row);
                                return;
                              }
                              action.onClick(row);
                            }}
                          >
                            {action.icon ? <span className="mr-2">{action.icon}</span> : null}
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>

                {detailColumns.length > 0 ? (
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                    {detailColumns.map((column) => (
                      <Fragment key={`${row.id}-${column.key}`}>
                        <dt className="text-muted-foreground">{column.header}</dt>
                        <dd className="min-w-0 truncate text-foreground">
                          {renderTypedCell(row, column)}
                        </dd>
                      </Fragment>
                    ))}
                  </dl>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
