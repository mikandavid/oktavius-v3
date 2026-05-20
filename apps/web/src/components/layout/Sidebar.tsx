import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { Tooltip, TooltipContent, TooltipTrigger, cn } from '@oktavius/base-ui';
import type { IconProps } from '@/lib/icons';

import {
  BotIcon,
  CheckIcon,
  EditIcon,
  HomeIcon,
  SortIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
  ProjectsIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from '@/lib/icons';

import { BrandMark } from './BrandMark';

type SidebarProps = {
  mobile?: boolean;
  open?: boolean;
  onNavigate?: () => void;
};

type NavItem = {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<IconProps>;
};

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed';
const MODULE_ORDER_STORAGE_KEY = 'sidebar-modules-order-v1';
const LABELS_VISIBLE_DELAY_MS = 80;
const ORG_HOME_PATH = '/dashboard';

const PRIMARY_ITEMS: NavItem[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'ai-chat', path: '/ai-chat', label: 'AI Chat', icon: BotIcon },
];

const MODULE_ITEMS: NavItem[] = [
  { id: 'clients', path: '/clients', label: 'Clients', icon: ProjectsIcon },
  { id: 'users', path: '/users', label: 'Users', icon: UsersIcon },
];

const ADMIN_ITEMS: NavItem[] = [
  { id: 'showcase', path: '/showcase', label: 'Showcase', icon: SlidersHorizontalIcon },
  { id: 'settings', path: '/showcase', label: 'Settings', icon: SettingsIcon },
];

const SIDEBAR_SECTIONS = [
  { title: 'Primary', items: PRIMARY_ITEMS },
  { title: 'Modules', items: MODULE_ITEMS },
  { title: 'Admin', items: ADMIN_ITEMS },
] as const;

function readStoredCollapsedState() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
}

function readStoredModuleOrder() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MODULE_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredModuleOrder(order: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MODULE_ORDER_STORAGE_KEY, JSON.stringify(order));
}

function orderItems(items: NavItem[], preferredOrder: string[]) {
  if (preferredOrder.length === 0) return items;
  const orderIndex = new Map(preferredOrder.map((id, index) => [id, index]));
  return [...items].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id);
    const rightIndex = orderIndex.get(right.id);
    if (leftIndex == null && rightIndex == null) return 0;
    if (leftIndex == null) return 1;
    if (rightIndex == null) return -1;
    return leftIndex - rightIndex;
  });
}

function NavItemRow({
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
  item: NavItem;
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

  const content = (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      draggable={draggable}
      onDragStart={draggable ? () => onDragStart?.(item.id) : undefined}
      onDragOver={draggable ? (event) => {
        event.preventDefault();
        onDragOver?.(item.id);
      } : undefined}
      onDrop={draggable ? (event) => {
        event.preventDefault();
        onDrop?.();
      } : undefined}
      onDragEnd={draggable ? () => onDrop?.() : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex h-8 items-center rounded-md py-1.5 transition-colors',
          isActive
            ? 'bg-sidebar-foreground/[0.08] font-medium text-foreground'
            : 'text-muted-foreground hover:bg-sidebar-foreground/[0.05] hover:text-foreground',
          expanded ? 'gap-3 px-2' : 'mx-auto w-8 justify-center px-0',
          isDragging && 'opacity-60',
        )
      }
      title={!expanded ? item.label : undefined}
    >
      {draggable && expanded ? (
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center text-sidebar-foreground/40"
          title={dragHandleTitle}
        >
          <SortIcon size={12} />
        </span>
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

  if (expanded) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

export function Sidebar({ mobile = false, open = false, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(readStoredCollapsedState);
  const [preferredModuleOrder, setPreferredModuleOrder] = useState<string[]>(readStoredModuleOrder);
  const [isEditingModules, setIsEditingModules] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [isLabelsVisible, setIsLabelsVisible] = useState(false);
  const isExpanded = mobile ? true : !isCollapsed;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isExpanded) {
      timer = setTimeout(() => setIsLabelsVisible(true), LABELS_VISIBLE_DELAY_MS);
    } else {
      setIsLabelsVisible(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isExpanded]);

  useEffect(() => {
    writeStoredModuleOrder(preferredModuleOrder);
  }, [preferredModuleOrder]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => !current);
  }, []);

  const orderedModuleItems = orderItems(MODULE_ITEMS, preferredModuleOrder);

  const moveModuleItem = useCallback(
    (targetItemId: string) => {
      if (!draggingItemId || draggingItemId === targetItemId) return;
      const currentIds = orderedModuleItems.map((item) => item.id);
      const fromIndex = currentIds.indexOf(draggingItemId);
      const toIndex = currentIds.indexOf(targetItemId);
      if (fromIndex === -1 || toIndex === -1) return;

      const nextIds = [...currentIds];
      const [movedId] = nextIds.splice(fromIndex, 1);
      nextIds.splice(toIndex, 0, movedId);
      setPreferredModuleOrder(nextIds);
    },
    [draggingItemId, orderedModuleItems],
  );

  return (
    <aside
      className={cn(
        'relative z-40 flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 ease-out',
          mobile ? 'fixed inset-y-0 left-0 h-dvh w-full max-h-dvh' : isExpanded ? 'h-dvh w-52 max-h-dvh' : 'h-dvh w-12 max-h-dvh',
          mobile ? (open ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0',
        )}
      >
        <Link
          to={ORG_HOME_PATH}
          onClick={onNavigate}
          className="flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-2.5 transition-colors hover:bg-sidebar-foreground/[0.05]"
        >
          <BrandMark />
          <span
            className={cn(
              'truncate text-sm font-semibold text-sidebar-foreground transition-opacity duration-150',
              isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
            )}
          >
            Oktavius ERP
          </span>
        </Link>

        <nav className="flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 py-3">
          <div>
            <div className="mb-1.5 h-5 px-2">
              <span
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
                  isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
                )}
              >
                Main
              </span>
            </div>
            <div className="space-y-0.5">
              {SIDEBAR_SECTIONS[0].items.map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  expanded={isExpanded}
                  labelsVisible={isLabelsVisible}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="group/module-header mb-1.5 flex h-5 items-center justify-between px-2">
              <span
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
                  isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
                )}
              >
                Modules
              </span>
              <button
                type="button"
                className={cn(
                  'h-5 w-5 rounded-full text-sidebar-foreground/45 transition-opacity duration-150 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
                  !isExpanded && 'pointer-events-none opacity-0',
                  isExpanded &&
                    !isEditingModules &&
                    'pointer-events-none opacity-0 group-hover/module-header:pointer-events-auto group-hover/module-header:opacity-100',
                )}
                onClick={() => setIsEditingModules((current) => !current)}
                title={isEditingModules ? 'Save order' : 'Edit order'}
              >
                {isEditingModules ? <CheckIcon size={12} className="mx-auto" /> : <EditIcon size={12} className="mx-auto" />}
              </button>
            </div>
            <div className="space-y-0.5">
              {orderedModuleItems.map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  expanded={isExpanded}
                  labelsVisible={isLabelsVisible}
                  onNavigate={onNavigate}
                  draggable={isEditingModules && isExpanded}
                  isDragging={draggingItemId === item.id}
                  onDragStart={setDraggingItemId}
                  onDragOver={moveModuleItem}
                  onDrop={() => setDraggingItemId(null)}
                  dragHandleTitle="Drag to reorder"
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 h-5 px-2">
              <span
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
                  isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
                )}
              >
                Admin
              </span>
            </div>
            <div className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  expanded={isExpanded}
                  labelsVisible={isLabelsVisible}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </nav>

        {!mobile ? (
          <div className="shrink-0 border-t border-sidebar-border p-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-8 items-center rounded-md py-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
                    isExpanded ? 'w-full gap-3 px-2' : 'mx-auto w-8 justify-center px-0',
                  )}
                  onClick={toggleCollapsed}
                >
                  {isCollapsed ? (
                    <PanelLeftIcon className="h-4 w-4 shrink-0" />
                  ) : (
                    <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-sm transition-[width,opacity] duration-150',
                      isLabelsVisible ? 'w-auto opacity-100' : 'pointer-events-none w-0 select-none opacity-0',
                    )}
                  >
                    {isCollapsed ? 'Expand' : 'Compact'}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Toggle sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        ) : null}
    </aside>
  );
}
