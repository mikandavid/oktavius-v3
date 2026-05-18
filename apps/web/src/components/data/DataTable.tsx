import type { ReactNode } from 'react';
import { CaretDown, CaretUp, DotsThree } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@oktavius/base-ui';

import { EmptyState } from '@/components/common/EmptyState';

export type DataColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
};

export type DataRowAction<T> = {
  key: string;
  label: string;
  onClick: (row: T) => void;
};

type DataTableProps<T extends { id: string }> = {
  rows: T[];
  columns: DataColumn<T>[];
  emptyTitle: string;
  emptyDescription?: string;
  getRowHref?: (row: T) => string;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  rowActions?: DataRowAction<T>[];
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  emptyTitle,
  emptyDescription,
  getRowHref,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  rowActions = [],
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} compact />;
  }

  return (
    <div className="overflow-hidden rounded-card border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                {column.sortable && onSortChange ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => onSortChange(column.key)}
                  >
                    {column.header}
                    {sortKey === column.key ? (
                      sortDirection === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />
                    ) : null}
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            ))}
            {rowActions.length > 0 ? <TableHead className="w-[52px]" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column, index) => (
                <TableCell key={column.key}>
                  {index === 0 && getRowHref ? (
                    <Link className="font-medium text-foreground hover:underline" to={getRowHref(row)}>
                      {column.render(row)}
                    </Link>
                  ) : (
                    column.render(row)
                  )}
                </TableCell>
              ))}
              {rowActions.length > 0 ? (
                <TableCell className="text-right">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Row actions">
                        <DotsThree size={16} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-44 p-1">
                      <div className="space-y-1">
                        {rowActions.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            className="flex w-full rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-muted"
                            onClick={() => action.onClick(row)}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
