import type { ReactNode } from 'react';

import { cn } from '@oktavius/base-ui';

type Ratio = '1:1' | '1:2' | '2:1' | '1:3' | '3:1';

const RATIO: Record<Ratio, string> = {
  '1:1': 'md:grid-cols-2',
  '1:2': 'md:grid-cols-[1fr_2fr]',
  '2:1': 'md:grid-cols-[2fr_1fr]',
  '1:3': 'md:grid-cols-[1fr_3fr]',
  '3:1': 'md:grid-cols-[3fr_1fr]',
};

type Gap = 'sm' | 'md' | 'lg';
const GAP: Record<Gap, string> = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' };

export interface SplitProps {
  ratio?: Ratio;
  gap?: Gap;
  className?: string;
  children: ReactNode;
}

/**
 * Two-column split with fixed ratio. Collapses to single column below md.
 * Use for hero + summary, form + preview, content + meta-rail.
 */
export function Split({ ratio = '1:1', gap = 'md', className, children }: SplitProps) {
  return (
    <div className={cn('grid grid-cols-1', RATIO[ratio], GAP[gap], className)}>{children}</div>
  );
}
