import { cn } from '@oktavius/base-ui';
import { useRef } from 'react';

import { APP_SHELL_BORDER_CLASS } from '@/components/common/pageChrome';
import { useTranslation } from '@/core/i18n';
import { PanelLeftCloseIcon, PanelLeftIcon } from '@/lib/icons';

import { useSidebarFlyout } from './SidebarFlyout';
import { SidebarNavPill } from './SidebarNavPill';

export function SidebarCollapseToggle({
  expanded,
  labelsVisible,
  isCompact,
  onToggle,
}: {
  expanded: boolean;
  labelsVisible: boolean;
  isCompact: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const collapseRowRef = useRef<HTMLDivElement>(null);
  const collapseFlyout = useSidebarFlyout('collapse');

  const toggleLabel = isCompact
    ? t('common.expandSidebar', undefined, 'Expand sidebar')
    : t('common.compactSidebar', undefined, 'Compact sidebar');

  return (
    <div className={cn('shrink-0 border-t px-2 py-2', APP_SHELL_BORDER_CLASS)}>
      {expanded ? (
        <button
          type="button"
          className="flex h-8 w-full items-center gap-3 rounded-md px-3 py-1.5 text-sidebar-foreground/40 transition-colors duration-150 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground active:bg-sidebar-foreground/[0.08] active:scale-[0.98]"
          onClick={onToggle}
          aria-label={toggleLabel}
        >
          {isCompact ? (
            <PanelLeftIcon className="h-4 w-4 shrink-0" />
          ) : (
            <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />
          )}
          <span
            className={cn(
              'text-sm transition-[width,opacity] duration-150',
              labelsVisible
                ? 'w-auto opacity-100'
                : 'pointer-events-none w-0 select-none opacity-0',
            )}
          >
            {isCompact
              ? t('common.expand', undefined, 'Expand')
              : t('common.compact', undefined, 'Compact')}
          </span>
        </button>
      ) : (
        <div
          ref={collapseRowRef}
          className="relative flex h-8 w-full items-center justify-center"
          onMouseEnter={collapseFlyout.show}
          onMouseLeave={collapseFlyout.hide}
        >
          <button
            type="button"
            aria-label={toggleLabel}
            className={cn(
              'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
              collapseFlyout.open && 'bg-sidebar-foreground/[0.08] text-sidebar-foreground',
              !collapseFlyout.open &&
                'text-sidebar-foreground/40 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
            )}
            onClick={onToggle}
          >
            {isCompact ? (
              <PanelLeftIcon className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />
            )}
          </button>
          <SidebarNavPill
            anchorRef={collapseRowRef}
            open={collapseFlyout.open}
            label={toggleLabel}
            isActive={false}
            onClick={onToggle}
            onPointerEnter={collapseFlyout.show}
            onPointerLeave={collapseFlyout.hide}
          />
        </div>
      )}
    </div>
  );
}
