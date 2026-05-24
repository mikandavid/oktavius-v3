import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SplitViewProps {
  /** Left panel — list, nav, or master */
  sidebar: ReactNode;
  /** Right panel — detail or content */
  children: ReactNode;
  /** Tailwind width class for the sidebar. Default: `w-80` */
  sidebarWidth?: string;
  /** When true sidebar fills full height with its own scroll */
  sidebarScroll?: boolean;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
}

/**
 * Master-detail split layout.
 * On mobile the sidebar collapses — pass `hideSidebarOnMobile` if needed.
 */
export function SplitView({
  sidebar,
  children,
  sidebarWidth = 'w-80',
  sidebarScroll = true,
  className,
  sidebarClassName,
  contentClassName,
}: SplitViewProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 w-full min-w-0 gap-0 overflow-hidden rounded-card bg-card',
        className,
      )}
    >
      <aside
        className={cn(
          'shrink-0 border-r border-border/50',
          sidebarWidth,
          sidebarScroll && 'overflow-y-auto',
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
      <div className={cn('min-w-0 flex-1 overflow-y-auto', contentClassName)}>{children}</div>
    </div>
  );
}
