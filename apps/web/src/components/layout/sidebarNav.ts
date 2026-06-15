import {
  ADMIN_NAV_ITEMS,
  type AppNavModule,
  buildVisibleAppNavItems,
  MODULE_NAV_ITEMS,
} from '@/lib/appNavModules';
import { getOrgProfile } from '@/lib/org-profiles/profiles';
import type { OrgProfile } from '@/lib/org-profiles/types';
import type { PermissionSubject } from '@/lib/permissions';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';
import { MODULE_ORDER_STORAGE_KEY } from '@/lib/userPreferences';

export const ORG_HOME_PATH = '/dashboard';

export type TranslateFn = (
  key: string,
  _params?: Record<string, string | number>,
  fallback?: string,
) => string;

export function readStoredModuleOrder(): string[] {
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

export function writeStoredModuleOrder(order: string[]): void {
  safeStorageSet(getWindowStorage('localStorage'), MODULE_ORDER_STORAGE_KEY, JSON.stringify(order));
}

export function buildVisibleModuleItems(
  profile: OrgProfile,
  subject: PermissionSubject,
  translate: TranslateFn,
): AppNavModule[] {
  return buildVisibleAppNavItems(profile, subject, MODULE_NAV_ITEMS, translate);
}

export function buildVisibleAdminItems(
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

export function buildRuntimeOrgProfile(
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

export function orderItems(items: AppNavModule[], preferredOrder: string[]): AppNavModule[] {
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

export function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath === '/dashboard') return pathname === '/dashboard';
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * Opacity toggle for labels that fade in/out as the rail expands. Pair with the
 * element's own `transition-opacity` + static classes via `cn()`.
 */
export function labelFadeClass(visible: boolean): string {
  return visible ? 'opacity-100' : 'pointer-events-none select-none opacity-0';
}
