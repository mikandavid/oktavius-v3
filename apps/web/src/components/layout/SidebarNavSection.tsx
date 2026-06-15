import { cn } from '@oktavius/base-ui';
import type { ReactNode } from 'react';

import { labelFadeClass } from './sidebarNav';

/**
 * A nav group: an optional fading uppercase header (with an optional right-side
 * action) followed by its rows, passed as `children`. Drag/active wiring lives
 * on the rows themselves, so this stays a dumb presentational wrapper.
 */
export function SidebarNavSection({
  label,
  labelsVisible,
  headerAction,
  topMargin = false,
  children,
}: {
  label?: string;
  labelsVisible: boolean;
  headerAction?: ReactNode;
  topMargin?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(topMargin && 'mt-4')}>
      {label ? (
        <div
          className={cn(
            'mb-1.5 h-5 px-3',
            headerAction && 'group/module-header flex items-center justify-between',
          )}
        >
          <span
            className={cn(
              'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
              labelFadeClass(labelsVisible),
            )}
          >
            {label}
          </span>
          {headerAction}
        </div>
      ) : null}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
