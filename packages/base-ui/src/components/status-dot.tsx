import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export type StatusDotTone = 'neutral' | 'success' | 'info' | 'warning' | 'destructive' | 'muted';
export type StatusDotSize = 'xs' | 'sm' | 'md';

const TONE_CLASS: Record<StatusDotTone, string> = {
  neutral: 'bg-muted-foreground',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/40',
};

const SIZE_CLASS: Record<StatusDotSize, string> = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
};

export interface StatusDotProps {
  tone: StatusDotTone;
  size?: StatusDotSize;
  /** Inline color override — takes precedence over `tone` */
  color?: string;
  className?: string;
}

/** Colored inline dot for status indicators, legend items, presence. */
export function StatusDot({ tone, size = 'sm', color, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full',
        SIZE_CLASS[size],
        !color && TONE_CLASS[tone],
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
      aria-hidden
    />
  );
}

export interface StatusDotLabelProps extends StatusDotProps {
  children: ReactNode;
  /** Emphasized leading value (counts, numbers). */
  value?: ReactNode;
  labelClassName?: string;
}

/** Dot + label pairing for legend rows, filter chips, status lines. */
export function StatusDotLabel({
  tone,
  size,
  color,
  children,
  value,
  className,
  labelClassName,
}: StatusDotLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <StatusDot tone={tone} size={size} color={color} className={className} />
      <span className={cn('text-sm', labelClassName)}>
        {value !== undefined && value !== null ? (
          <>
            <span className="font-semibold tabular-nums">{value}</span>{' '}
            <span className="text-muted-foreground">{children}</span>
          </>
        ) : (
          children
        )}
      </span>
    </span>
  );
}
