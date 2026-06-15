import { cn } from '@oktavius/base-ui';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { APP_SHELL_BORDER_CLASS, APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { useTranslation } from '@/core/i18n';
import { buildVisibleAppNavItems, PRIMARY_NAV_ITEMS } from '@/lib/appNavModules';
import { getLocalizedOrgProfile } from '@/lib/org-profiles/terminology';
import { EMPTY_PERMISSION_SUBJECT } from '@/lib/permissions';
import { useUserPreferences } from '@/lib/userPreferences';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { SidebarBrand } from './SidebarBrand';
import { SidebarCollapseToggle } from './SidebarCollapseToggle';
import { SidebarFlyoutProvider } from './SidebarFlyout';
import { SidebarModuleOrderToggle } from './SidebarModuleOrderToggle';
import {
  buildRuntimeOrgProfile,
  buildVisibleAdminItems,
  buildVisibleModuleItems,
  ORG_HOME_PATH,
} from './sidebarNav';
import { SidebarNavItemRow } from './SidebarNavItemRow';
import { SidebarNavSection } from './SidebarNavSection';
import { useModuleOrder } from './useModuleOrder';
import { useSidebarHoverExpand } from './useSidebarHoverExpand';

type SidebarProps = {
  mobile?: boolean;
  /** Render inside a Drawer — no fixed positioning or slide transform. */
  embedded?: boolean;
  open?: boolean;
  onNavigate?: () => void;
};

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
  const { locale } = useUserPreferences();
  const { t } = useTranslation();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const organizations = osirisRuntime?.organizations ?? [];
  const permissionSubject = osirisRuntime?.permissionSubject ?? EMPTY_PERMISSION_SUBJECT;
  const activeOrganization = organizations.find((organization) => organization.id === activeOrgId);
  const activeOrganizationLogoUrl =
    osirisRuntime?.config?.org.logoUrl ?? activeOrganization?.logoUrl ?? null;
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

  const {
    orderedModuleItems,
    isEditingModules,
    draggingItemId,
    startModuleDrag,
    moveModuleItem,
    finishModuleDrag,
    toggleModuleEditing,
  } = useModuleOrder(profile.id, visibleModuleItems);

  const {
    isSidebarCompact,
    isSidebarLayoutCompact,
    isExpanded,
    isHoverExpanded,
    isLabelsVisible,
    toggleCollapsed,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
  } = useSidebarHoverExpand({ mobile, embedded });

  const brandIsActive = pathname === ORG_HOME_PATH;

  return (
    <aside
      className={cn(
        'relative z-40 flex shrink-0 flex-col transition-[width] duration-200 ease-out',
        embedded
          ? 'h-full w-full max-h-full overflow-x-hidden'
          : mobile
            ? cn(
                'fixed inset-y-0 left-0 h-dvh w-[min(20rem,88vw)] max-h-dvh overflow-x-hidden transition-[width,transform]',
                open ? 'translate-x-0' : '-translate-x-full',
              )
            : isSidebarCompact
              ? 'h-dvh w-12 max-h-dvh overflow-visible'
              : 'h-dvh w-52 max-h-dvh overflow-x-hidden',
      )}
    >
      <div
        data-sidebar-hover-panel
        className={cn(
          'flex min-h-0 flex-col overflow-x-hidden border-r transition-[width] duration-200 ease-out',
          APP_SHELL_BORDER_CLASS,
          APP_SHELL_SURFACE_CLASS,
          embedded
            ? 'h-full w-full'
            : mobile
              ? 'h-full w-full shadow-elevated'
              : isSidebarLayoutCompact
                ? cn('absolute inset-y-0 left-0 h-dvh', isHoverExpanded ? 'w-52' : 'w-12')
                : 'h-dvh w-full',
        )}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <SidebarBrand
          expanded={isExpanded}
          labelsVisible={isLabelsVisible}
          title={brandTitle}
          logoUrl={activeOrganizationLogoUrl}
          isActive={brandIsActive}
          onNavigate={onNavigate}
        />

        <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 py-3">
          <SidebarNavSection labelsVisible={isLabelsVisible}>
            {visiblePrimaryItems.map((item) => (
              <SidebarNavItemRow
                key={item.id}
                item={item}
                expanded={isExpanded}
                labelsVisible={isLabelsVisible}
                onNavigate={onNavigate}
              />
            ))}
          </SidebarNavSection>

          <SidebarNavSection
            topMargin
            label={t('common.modules', undefined, 'Modules')}
            labelsVisible={isLabelsVisible}
            headerAction={
              <SidebarModuleOrderToggle
                expanded={isExpanded}
                isEditing={isEditingModules}
                onToggle={toggleModuleEditing}
              />
            }
          >
            {orderedModuleItems.map((item) => (
              <SidebarNavItemRow
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
          </SidebarNavSection>

          {visibleAdminItems.length > 0 ? (
            <SidebarNavSection
              topMargin
              label={t('common.admin', undefined, 'Admin')}
              labelsVisible={isLabelsVisible}
            >
              {visibleAdminItems.map((item) => (
                <SidebarNavItemRow
                  key={item.id}
                  item={item}
                  expanded={isExpanded}
                  labelsVisible={isLabelsVisible}
                  onNavigate={onNavigate}
                />
              ))}
            </SidebarNavSection>
          ) : null}
        </nav>

        {!mobile && !embedded ? (
          <SidebarCollapseToggle
            expanded={isExpanded}
            labelsVisible={isLabelsVisible}
            isCompact={isSidebarCompact}
            onToggle={toggleCollapsed}
          />
        ) : null}
      </div>
    </aside>
  );
}
