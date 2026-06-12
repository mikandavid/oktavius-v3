import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

type Side = 'left' | 'right';
type Width = 'sm' | 'md' | 'lg';

const WIDTH: Record<Width, string> = {
  sm: 'lg:w-60',
  md: 'lg:w-72',
  lg: 'lg:w-96',
};

export interface SidebarProps {
  side?: Side;
  width?: Width;
  gap?: 'sm' | 'md' | 'lg';
  aside: ReactNode;
  className?: string;
  children: ReactNode;
}

const GAP = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' } as const;

/**
 * Main content with a fixed-width side rail. Stacks below lg.
 * Use for detail pages with related-records rail, settings with help column.
 */
export function Sidebar({
  side = 'right',
  width = 'md',
  gap = 'md',
  aside,
  className,
  children,
}: SidebarProps) {
  const railClass = cn('shrink-0 w-full', WIDTH[width]);
  return (
    <div className={cn('flex flex-col lg:flex-row', GAP[gap], className)}>
      {side === 'left' ? <div className={railClass}>{aside}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {side === 'right' ? <div className={railClass}>{aside}</div> : null}
    </div>
  );
}
