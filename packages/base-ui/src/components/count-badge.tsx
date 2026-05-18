import { cn } from '../lib/utils';
import { badgeVariants, type BadgeProps } from './badge';

export interface CountBadgeProps {
  count: number;
  /** Hide when zero. Default false. */
  hideZero?: boolean;
  /** Show `${max}+` when count exceeds max. */
  max?: number;
  variant?: BadgeProps['variant'];
  className?: string;
}

/** Compact count chip for tab triggers, section headings, and filter labels. */
export function CountBadge({
  count,
  hideZero = false,
  max,
  variant = 'outline',
  className,
}: CountBadgeProps) {
  if (hideZero && count === 0) return null;
  const display = max !== undefined && count > max ? `${max}+` : String(count);

  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        'h-4 rounded-full px-1.5 py-0 text-[10px] font-normal leading-none tabular-nums',
        className,
      )}
    >
      {display}
    </span>
  );
}
