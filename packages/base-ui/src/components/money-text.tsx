import { cn } from '../lib/utils';

export interface MoneyTextProps {
  value: number | string | null | undefined;
  currency?: string;
  locale?: string;
  /** Show as compact: 1.2K, 3.4M */
  compact?: boolean;
  className?: string;
}

/**
 * Consistent currency display using Intl.NumberFormat.
 * Uses tabular numerals for alignment in tables.
 */
export function MoneyText({
  value,
  currency = 'EUR',
  locale = 'de-AT',
  compact = false,
  className,
}: MoneyTextProps) {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num))
    return <span className={cn('tabular-nums text-muted-foreground', className)}>—</span>;

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2,
  }).format(num);

  return <span className={cn('tabular-nums', className)}>{formatted}</span>;
}
