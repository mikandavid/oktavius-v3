import { cn, MouseTooltip } from '@oktavius/base-ui';
import { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import type { AppNavModule } from '@/lib/appNavModules';
import { SortIcon } from '@/lib/icons';
import { prefetchAppNavModule } from '@/lib/routing/prefetchRouteChunk';

import { useSidebarFlyout } from './SidebarFlyout';
import { isNavItemActive } from './sidebarNav';
import { SidebarNavPill } from './SidebarNavPill';

export function SidebarNavItemRow({
  item,
  expanded,
  labelsVisible,
  onNavigate,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragOver,
  onDrop,
  dragHandleTitle,
}: {
  item: AppNavModule;
  expanded: boolean;
  labelsVisible: boolean;
  onNavigate?: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (itemId: string) => void;
  onDragOver?: (itemId: string) => void;
  onDrop?: () => void;
  dragHandleTitle?: string;
}) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const rowRef = useRef<HTMLDivElement>(null);
  const flyout = useSidebarFlyout(item.id);
  const isActiveRoute = isNavItemActive(pathname, item.path);
  // Warm the target route chunk on hover/focus so the click renders instantly.
  const prefetch = () => prefetchAppNavModule(item);

  if (expanded) {
    return (
      <NavLink
        to={item.path}
        onClick={onNavigate}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        draggable={draggable}
        onDragStart={draggable ? () => onDragStart?.(item.id) : undefined}
        onDragOver={
          draggable
            ? (event) => {
                event.preventDefault();
                onDragOver?.(item.id);
              }
            : undefined
        }
        onDrop={
          draggable
            ? (event) => {
                event.preventDefault();
                onDrop?.();
              }
            : undefined
        }
        onDragEnd={draggable ? () => onDrop?.() : undefined}
        className={({ isActive }) =>
          cn(
            'relative flex h-8 w-full items-center rounded-md py-1.5 transition-colors duration-150',
            isActive
              ? 'bg-sidebar-primary/10 font-medium text-sidebar-primary'
              : 'text-muted-foreground hover:bg-sidebar-primary/5 hover:text-foreground active:bg-sidebar-primary/10',
            'gap-3 px-3',
            isDragging && 'opacity-60',
          )
        }
      >
        {draggable ? (
          <MouseTooltip content={dragHandleTitle}>
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center text-sidebar-foreground/40"
              aria-label={dragHandleTitle}
            >
              <SortIcon size={12} />
            </span>
          </MouseTooltip>
        ) : null}
        <Icon size={16} className="h-4 w-4 shrink-0" />
        <span
          className={cn(
            'truncate text-sm transition-opacity duration-150',
            labelsVisible ? 'opacity-100' : 'pointer-events-none absolute select-none opacity-0',
          )}
        >
          {item.label}
        </span>
      </NavLink>
    );
  }

  return (
    <div
      ref={rowRef}
      className="relative h-8 w-full"
      onMouseEnter={() => {
        flyout.show();
        prefetch();
      }}
      onMouseLeave={flyout.hide}
    >
      <NavLink
        to={item.path}
        onClick={onNavigate}
        onFocus={prefetch}
        aria-label={item.label}
        className={({ isActive }) =>
          cn(
            'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
            (flyout.open || isActive) && 'bg-sidebar-primary/10 text-sidebar-primary',
            !flyout.open &&
              !isActive &&
              'text-muted-foreground hover:bg-sidebar-primary/5 hover:text-foreground',
          )
        }
      >
        <Icon size={16} className="h-4 w-4 shrink-0" />
      </NavLink>
      <SidebarNavPill
        anchorRef={rowRef}
        open={flyout.open}
        label={item.label}
        isActive={isActiveRoute}
        href={item.path}
        onNavigate={onNavigate}
        onPointerEnter={flyout.show}
        onPointerLeave={flyout.hide}
      />
    </div>
  );
}
