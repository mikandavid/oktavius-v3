import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

type Cols = 2 | 3 | 4 | 6;
type Gap = 'sm' | 'md' | 'lg';

const COLS: Record<Cols, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
};

const GAP: Record<Gap, string> = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };

export interface GridProps {
  cols?: Cols;
  gap?: Gap;
  className?: string;
  children: ReactNode;
}

/**
 * Responsive grid. Use for KPI tiles, stat rows, card decks.
 * Collapses to 1 column on small screens.
 */
export function Grid({ cols = 3, gap = 'md', className, children }: GridProps) {
  return <div className={cn('grid grid-cols-1', COLS[cols], GAP[gap], className)}>{children}</div>;
}
