import { CheckIcon, MinusIcon } from '@/lib/icons';

import { Badge, type BadgeProps, formatDisplayDate } from '@oktavius/base-ui';

import { StatusBadge } from '@/components/feedback/StatusBadge';

import type { CrudColumn } from './crudTableTypes';

function safeRender(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  return String(value);
}

function formatCurrency(value: unknown, symbol: string): React.ReactNode {
  const num = Number(value);
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (Number.isNaN(num)) return String(value);
  return (
    <span className="tabular-nums">
      {symbol}
      {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function renderTypedCell<T>(item: T, column: CrudColumn<T>): React.ReactNode {
  if (column.render) return column.render(item);

  const value = (item as Record<string, unknown>)[column.key];

  switch (column.type) {
    case 'status':
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <StatusBadge
          status={String(value)}
          variantMap={column.meta?.variantMap as Record<string, BadgeProps['variant']>}
        />
      );
    case 'date':
      return (
        <span className="tabular-nums text-muted-foreground">
          {formatDisplayDate(
            value instanceof Date
              ? value
              : value === null || value === undefined
                ? null
                : String(value),
          )}
        </span>
      );
    case 'currency':
      return formatCurrency(value, (column.meta?.currencySymbol as string) || '€');
    case 'boolean':
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground">—</span>;
      }
      return value ? (
        <CheckIcon className="h-4 w-4 text-success" />
      ) : (
        <MinusIcon className="h-4 w-4 text-muted-foreground/40" />
      );
    case 'badge':
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground">—</span>;
      }
      return <Badge variant="outline">{String(value)}</Badge>;
    default:
      return safeRender(value);
  }
}

export function shouldTruncateCell<T>(column: CrudColumn<T>): boolean {
  if (column.truncate != null) return column.truncate;
  return column.type !== 'boolean';
}
