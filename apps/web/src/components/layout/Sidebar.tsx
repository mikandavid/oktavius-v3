import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { MouseTooltip, cn } from '@oktavius/base-ui';

import { CheckIcon, EditIcon, SortIcon, PanelLeftCloseIcon, PanelLeftIcon } from '@/lib/icons';

import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';
import { MODULE_ORDER_STORAGE_KEY, useUserPreferences } from '@/lib/userPreferences';
import {
  ADMIN_NAV_ITEMS,
  MODULE_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  type AppNavModule,
  buildVisibleAppNavItems,
} from '@/lib/appNavModules';
import { getOrgProfile } from '@/lib/org-profiles/profiles';
import type { OrgProfile } from '@/lib/org-profiles/types';
import { getLocalizedOrgProfile } from '@/lib/org-profiles/terminology';
import { EMPTY_PERMISSION_SUBJECT, type PermissionSubject } from '@/lib/permissions';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';
import { useTranslation } from '@/core/i18n';

import { useAppShellLayout } from './AppShellLayoutContext';
import { BrandMark } from './BrandMark';

type SidebarProps = {
  mobile?: boolean;
  /** Render inside a Drawer — no fixed positioning or slide transform. */
  embedded?: boolean;
  open?: boolean;
  onNavigate?: () => void;
};

const LABELS_VISIBLE_DELAY_MS = 80;
const COLLAPSED_PILL_GAP_PX = 10;
const ORG_HOME_PATH = '/dashboard';

function readStoredModuleOrder() {
  const storage = getWindowStorage('localStorage');
  if (!storage) return [];
  try {
    const raw = safeStorageGet(storage, MODULE_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeStoredModuleOrder(order: string[]) {
  safeStorageSet(getWindowStorage('localStorage'), MODULE_ORDER_STORAGE_KEY, JSON.stringify(order));
}

type TranslateFn = (
  key: string,
  _params?: Record<string, string | number>,
  fallback?: string,
) => string;

function buildVisibleModuleItems(
  profile: OrgProfile,
  subject: PermissionSubject,
  translate: TranslateFn,
): AppNavModule[] {
  return buildVisibleAppNavItems(profile, subject, MODULE_NAV_ITEMS, translate);
}

function buildVisibleAdminItems(
  profile: OrgProfile,
  subject: PermissionSubject,
  translate: TranslateFn,
): AppNavModule[] {
  return buildVisibleAppNavItems(
    profile,
    subject,
    ADMIN_NAV_ITEMS.filter((item) => item.id !== 'showcase' || import.meta.env.DEV),
    translate,
  );
}

function buildRuntimeOrgProfile(
  activeOrganization: { id: string; name: string; slug: string } | undefined,
): OrgProfile {
  if (!activeOrganization) return getOrgProfile(undefined);

  const fallback = getOrgProfile(activeOrganization.id);

  return {
    ...fallback,
    id: activeOrganization.id,
    slug: activeOrganization.slug,
    name: activeOrganization.name,
  };
}

function orderItems(items: AppNavModule[], preferredOrder: string[]) {
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

function isNavItemActive(pathname: string, itemPath: string) {
  if (itemPath === '/dashboard') return pathname === '/dashboard';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function useAnchorRect(anchorRef: React.RefObject<HTMLElement | null>, open: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setRect(null);
      return;
    }

    const update = () => {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, open]);

  return rect;
}

const FLYOUT_HIDE_DELAY_MS = 120;

type SidebarFlyoutContextValue = {
  activeId: string | null;
  show: (id: string) => void;
  hide: (id: string) => void;
};

const SidebarFlyoutContext = createContext<SidebarFlyoutContextValue | null>(null);

function SidebarFlyoutProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((id: string) => {
    clearTimeout(hideTimeoutRef.current);
    setActiveId(id);
  }, []);

  const hide = useCallback((id: string) => {
    hideTimeoutRef.current = setTimeout(() => {
      setActiveId((current) => (current === id ? null : current));
    }, FLYOUT_HIDE_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideTimeoutRef.current), []);

  return (
    <SidebarFlyoutContext.Provider value={{ activeId, show, hide }}>
      {children}
    </SidebarFlyoutContext.Provider>
  );
}

function useSidebarFlyout(id: string) {
  const context = useContext(SidebarFlyoutContext);
  if (!context) {
    throw new Error('useSidebarFlyout must be used within SidebarFlyoutProvider');
  }

  return {
    open: context.activeId === id,
    show: () => context.show(id),
    hide: () => context.hide(id),
  };
}

function SidebarNavPill({
  anchorRef,
  open,
  label,
  isActive,
  href,
  onNavigate,
  onClick,
  onPointerEnter,
  onPointerLeave,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  label: string;
  isActive?: boolean;
  href?: string;
  onNavigate?: () => void;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  const rect = useAnchorRect(anchorRef, open);

  if (!open || !rect || typeof document === 'undefined') return null;

  const pillClass = cn(
    'flex h-8 max-w-[14rem] items-center truncate rounded-full border px-3 text-sm shadow-elevated active:scale-[0.98]',
    isActive
      ? cn(
          'border-sidebar-primary font-medium text-sidebar-primary shadow-md',
          APP_SHELL_SURFACE_CLASS,
        )
      : cn('text-foreground', APP_SHELL_SURFACE_CLASS, APP_SHELL_BORDER_CLASS),
  );

  const labelNode = href ? (
    <Link to={href} onClick={onNavigate} className="truncate">
      {label}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className="truncate text-left">
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed z-[100] flex items-center"
      style={{
        top: rect.top,
        left: rect.right,
        height: rect.height,
        paddingLeft: COLLAPSED_PILL_GAP_PX,
        transition: 'none',
      }}
      onMouseEnter={onPointerEnter}
      onMouseLeave={onPointerLeave}
    >
      <div className={pillClass}>{labelNode}</div>
    </div>,
    document.body,
  );
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

  if (expanded) {
    return (
      <NavLink
        to={item.path}
        onClick={onNavigate}
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
      onMouseEnter={flyout.show}
      onMouseLeave={flyout.hide}
    >
      <NavLink
        to={item.path}
        onClick={onNavigate}
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

export function Sidebar(props: SidebarProps) {
  return (
    <SidebarFlyoutProvider>
      <SidebarContent {...props} />
    </SidebarFlyoutProvider>
  );
}

function SidebarContent({
  mobile = false,
  embedded = false,
  open = false,
  onNavigate,
}: SidebarProps) {
  const { pathname } = useLocation();
  const { isSidebarCompact, toggleSidebarCollapsed } = useAppShellLayout();
  const { locale, moduleOrderPreference, setModuleOrderPreference } = useUserPreferences();
  const { t } = useTranslation();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const organizations = osirisRuntime?.organizations ?? [];
  const permissionSubject = osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT;
  const activeOrganization = organizations.find((organization) => organization.id === activeOrgId);
  const profile = useMemo(
    () => getLocalizedOrgProfile(buildRuntimeOrgProfile(activeOrganization), locale),
    [activeOrganization, locale],
  );
  const brandTitle = activeOrganization?.name ?? 'Oktavius ERP';
  const visiblePrimaryItems = useMemo(
    () => buildVisibleAppNavItems(profile, permissionSubject, PRIMARY_NAV_ITEMS, t),
    [permissionSubject, profile, t],
  );
  const visibleModuleItems = useMemo(
    () => buildVisibleModuleItems(profile, permissionSubject, t),
    [permissionSubject, profile, t],
  );
  const visibleAdminItems = useMemo(
    () => buildVisibleAdminItems(profile, permissionSubject, t),
    [permissionSubject, profile, t],
  );
  const [preferredModuleOrder, setPreferredModuleOrder] = useState<string[]>(() =>
    moduleOrderPreference.length > 0 ? moduleOrderPreference : readStoredModuleOrder(),
  );
  const preferredModuleOrderRef = useRef(preferredModuleOrder);

  useEffect(() => {
    preferredModuleOrderRef.current = preferredModuleOrder;
  }, [preferredModuleOrder]);

  useEffect(() => {
    if (moduleOrderPreference.length > 0) {
      preferredModuleOrderRef.current = moduleOrderPreference;
      setPreferredModuleOrder(moduleOrderPreference);
    }
  }, [moduleOrderPreference]);

  useEffect(() => {
    const allowedIds = visibleModuleItems.map((item) => item.id);
    const allowed = new Set<string>(allowedIds);
    setPreferredModuleOrder((current) => {
      const filtered = current.filter((id) => allowed.has(id));
      const nextOrder = filtered.length > 0 ? filtered : allowedIds;
      preferredModuleOrderRef.current = nextOrder;
      return nextOrder;
    });
  }, [profile.id, visibleModuleItems]);
  const [isEditingModules, setIsEditingModules] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const draggingItemIdRef = useRef<string | null>(null);
  const [isLabelsVisible, setIsLabelsVisible] = useState(false);
  const brandRowRef = useRef<HTMLDivElement>(null);
  const collapseRowRef = useRef<HTMLDivElement>(null);
  const brandFlyout = useSidebarFlyout('brand');
  const collapseFlyout = useSidebarFlyout('collapse');
  const isExpanded = mobile || embedded ? true : !isSidebarCompact;

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
    toggleSidebarCollapsed();
  }, [toggleSidebarCollapsed]);

  const orderedModuleItems = orderItems(visibleModuleItems, preferredModuleOrder);

  const startModuleDrag = useCallback((itemId: string) => {
    draggingItemIdRef.current = itemId;
    setDraggingItemId(itemId);
  }, []);

  const moveModuleItem = useCallback(
    (targetItemId: string) => {
      if (!draggingItemId || draggingItemId === targetItemId) return;
      const currentIds = orderedModuleItems.map((item) => item.id as string);
      const fromIndex = currentIds.indexOf(draggingItemId);
      const toIndex = currentIds.indexOf(targetItemId);
      if (fromIndex === -1 || toIndex === -1) return;

      const nextIds = [...currentIds];
      const [movedId] = nextIds.splice(fromIndex, 1);
      nextIds.splice(toIndex, 0, movedId);
      preferredModuleOrderRef.current = nextIds;
      setPreferredModuleOrder(nextIds);
    },
    [draggingItemId, orderedModuleItems],
  );

  const finishModuleDrag = useCallback(() => {
    const draggedItemId = draggingItemIdRef.current;
    draggingItemIdRef.current = null;
    setDraggingItemId(null);
    if (draggedItemId) {
      setModuleOrderPreference(preferredModuleOrderRef.current);
    }
  }, [setModuleOrderPreference]);

  const toggleModuleEditing = useCallback(() => {
    if (isEditingModules) {
      setModuleOrderPreference(preferredModuleOrderRef.current);
    }
    setIsEditingModules((current) => !current);
  }, [isEditingModules, setModuleOrderPreference]);

  const brandIsActive = pathname === ORG_HOME_PATH;

  return (
    <aside
      className={cn(
        'relative z-40 flex shrink-0 flex-col overflow-x-hidden border-r transition-[width] duration-200 ease-out',
        APP_SHELL_BORDER_CLASS,
        APP_SHELL_SURFACE_CLASS,
        embedded
          ? 'h-full w-full max-h-full overflow-x-hidden'
          : mobile
            ? cn(
                'fixed inset-y-0 left-0 h-dvh w-[min(20rem,88vw)] max-h-dvh overflow-x-hidden shadow-elevated transition-[width,transform]',
                open ? 'translate-x-0' : '-translate-x-full',
              )
            : isExpanded
              ? 'h-dvh w-52 max-h-dvh'
              : 'h-dvh w-12 max-h-dvh',
      )}
    >
      {isExpanded ? (
        <Link
          to={ORG_HOME_PATH}
          onClick={onNavigate}
          className={cn(
            'flex h-12 w-full shrink-0 items-center gap-2 px-3 transition-colors duration-150 hover:bg-sidebar-foreground/[0.05] active:bg-sidebar-foreground/[0.08]',
          )}
        >
          <BrandMark />
          <span
            className={cn(
              'truncate text-sm font-semibold text-sidebar-foreground transition-opacity duration-150',
              isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
            )}
          >
            {brandTitle}
          </span>
        </Link>
      ) : (
        <div
          ref={brandRowRef}
          className={cn('relative flex h-12 w-full shrink-0 items-center justify-center')}
          onMouseEnter={brandFlyout.show}
          onMouseLeave={brandFlyout.hide}
        >
          <Link
            to={ORG_HOME_PATH}
            onClick={onNavigate}
            aria-label={brandTitle}
            className={cn(
              'mx-auto flex h-9 w-9 items-center justify-center rounded-full',
              (brandFlyout.open || brandIsActive) && 'bg-sidebar-primary/10',
              !brandFlyout.open && !brandIsActive && 'hover:bg-sidebar-foreground/[0.05]',
            )}
          >
            <BrandMark />
          </Link>
          <SidebarNavPill
            anchorRef={brandRowRef}
            open={brandFlyout.open}
            label={brandTitle}
            isActive={brandIsActive}
            href={ORG_HOME_PATH}
            onNavigate={onNavigate}
            onPointerEnter={brandFlyout.show}
            onPointerLeave={brandFlyout.hide}
          />
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 py-3">
        <div>
          <div className="mb-1.5 h-5 px-3" />
          <div className="space-y-0.5">
            {visiblePrimaryItems.map((item) => (
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
          <div className="group/module-header mb-1.5 flex h-5 items-center justify-between px-3">
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
                isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
              )}
            >
              {t('common.modules', undefined, 'Modules')}
            </span>
            {isExpanded ? (
              <MouseTooltip
                content={
                  isEditingModules
                    ? t('common.saveOrder', undefined, 'Save order')
                    : t('common.editOrder', undefined, 'Edit order')
                }
              >
                <button
                  type="button"
                  className={cn(
                    'h-5 w-5 rounded-full text-sidebar-foreground/45 transition-opacity duration-150 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
                    !isEditingModules &&
                      'pointer-events-none opacity-0 group-hover/module-header:pointer-events-auto group-hover/module-header:opacity-100',
                  )}
                  onClick={toggleModuleEditing}
                  aria-label={
                    isEditingModules
                      ? t('common.saveOrder', undefined, 'Save order')
                      : t('common.editOrder', undefined, 'Edit order')
                  }
                >
                  {isEditingModules ? (
                    <CheckIcon size={12} className="mx-auto" />
                  ) : (
                    <EditIcon size={12} className="mx-auto" />
                  )}
                </button>
              </MouseTooltip>
            ) : null}
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
                onDragStart={startModuleDrag}
                onDragOver={moveModuleItem}
                onDrop={finishModuleDrag}
                dragHandleTitle={t('common.dragToReorder', undefined, 'Drag to reorder')}
              />
            ))}
          </div>
        </div>

        {visibleAdminItems.length > 0 ? (
          <div className="mt-4">
            <div className="mb-1.5 h-5 px-3">
              <span
                className={cn(
                  'text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/40 transition-opacity duration-150',
                  isLabelsVisible ? 'opacity-100' : 'pointer-events-none select-none opacity-0',
                )}
              >
                {t('common.admin', undefined, 'Admin')}
              </span>
            </div>
            <div className="space-y-0.5">
              {visibleAdminItems.map((item) => (
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
        ) : null}
      </nav>

      {!mobile && !embedded ? (
        <div className={cn('shrink-0 border-t px-2 py-2', APP_SHELL_BORDER_CLASS)}>
          {isExpanded ? (
            <button
              type="button"
              className="flex h-8 w-full items-center gap-3 rounded-md px-3 py-1.5 text-sidebar-foreground/40 transition-colors duration-150 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground active:bg-sidebar-foreground/[0.08] active:scale-[0.98]"
              onClick={toggleCollapsed}
              aria-label={
                isSidebarCompact
                  ? t('common.expandSidebar', undefined, 'Expand sidebar')
                  : t('common.compactSidebar', undefined, 'Compact sidebar')
              }
            >
              {isSidebarCompact ? (
                <PanelLeftIcon className="h-4 w-4 shrink-0" />
              ) : (
                <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm transition-[width,opacity] duration-150',
                  isLabelsVisible
                    ? 'w-auto opacity-100'
                    : 'pointer-events-none w-0 select-none opacity-0',
                )}
              >
                {isSidebarCompact
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
                aria-label={
                  isSidebarCompact
                    ? t('common.expandSidebar', undefined, 'Expand sidebar')
                    : t('common.compactSidebar', undefined, 'Compact sidebar')
                }
                className={cn(
                  'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                  collapseFlyout.open && 'bg-sidebar-foreground/[0.08] text-sidebar-foreground',
                  !collapseFlyout.open &&
                    'text-sidebar-foreground/40 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground',
                )}
                onClick={toggleCollapsed}
              >
                {isSidebarCompact ? (
                  <PanelLeftIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <PanelLeftCloseIcon className="h-4 w-4 shrink-0" />
                )}
              </button>
              <SidebarNavPill
                anchorRef={collapseRowRef}
                open={collapseFlyout.open}
                label={
                  isSidebarCompact
                    ? t('common.expandSidebar', undefined, 'Expand sidebar')
                    : t('common.compactSidebar', undefined, 'Compact sidebar')
                }
                isActive={false}
                onClick={toggleCollapsed}
                onPointerEnter={collapseFlyout.show}
                onPointerLeave={collapseFlyout.hide}
              />
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
}
