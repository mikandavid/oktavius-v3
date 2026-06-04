import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

type Gap = 'xs' | 'sm' | 'md' | 'lg';

const GAP: Record<Gap, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export interface ClusterProps {
  gap?: Gap;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Horizontal cluster of inline things (badges, buttons, chips). Wraps by default.
 * Use for toolbars, tag rows, action groups.
 */
export function Cluster({
  gap = 'sm',
  align = 'center',
  justify = 'start',
  wrap = true,
  className,
  children,
}: ClusterProps) {
  return (
    <div
      className={cn(
        'flex',
        wrap && 'flex-wrap',
        GAP[gap],
        align === 'start' && 'items-start',
        align === 'center' && 'items-center',
        align === 'end' && 'items-end',
        align === 'baseline' && 'items-baseline',
        justify === 'start' && 'justify-start',
        justify === 'center' && 'justify-center',
        justify === 'end' && 'justify-end',
        justify === 'between' && 'justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}
