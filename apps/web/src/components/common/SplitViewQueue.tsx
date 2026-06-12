import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

/**
 * Spaced stack for master-detail sidebars (incident queue, document list, etc.).
 * Parent `SplitView` should be `w-full`; items use `ListRow variant="queue"`.
 */
export function SplitViewQueue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('flex flex-col gap-2 p-3', className)}>{children}</div>;
}

/** Subtle selected queue item — background only, no ring or left accent bar. */
export const QUEUE_ITEM_SELECTED_CLASS =
  'border-border/80 bg-muted/70 shadow-none ring-0 outline-none';
