import { cn, Skeleton } from '@oktavius/base-ui';

import type { ColumnType, CrudColumn } from './crudTableTypes';

const SKELETON_WIDTHS: Record<ColumnType, string> = {
  text: 'w-24',
  status: 'w-16 rounded-full',
  date: 'w-20',
  currency: 'ml-auto w-14',
  boolean: 'w-4',
  badge: 'w-16 rounded-full',
};

export function CrudTableLoadingState<T>({
  compact,
  columns,
  selectable,
  hasActions,
}: {
  compact?: boolean;
  columns: CrudColumn<T>[];
  selectable: boolean;
  hasActions: boolean;
}) {
  const rows = compact ? 6 : 8;

  return (
    <div className="overflow-hidden bg-card">
      <div className="border-b bg-muted/20 px-5 py-2">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-1 px-4 py-2.5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn('flex items-center gap-2 rounded-sm pl-1 pr-2', compact ? 'h-9' : 'h-11')}
          >
            {selectable ? <Skeleton className="h-3.5 w-3.5 rounded" /> : null}
            {columns.map((column) => (
              <Skeleton
                key={`${rowIndex}-${column.key}`}
                className={cn('h-3.5 shrink-0', SKELETON_WIDTHS[column.type ?? 'text'])}
              />
            ))}
            {hasActions ? <Skeleton className="ml-auto h-6 w-6 rounded" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
