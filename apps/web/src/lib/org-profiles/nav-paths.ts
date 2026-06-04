import type { OrgModuleId } from './types';

/** Osiris-style paths used by Bestattung Kunz (and other funeral tenants). */
export const KUNZ_NAV_PATHS: Partial<Record<OrgModuleId, string>> = {
  cases: '/funeral/cases',
  products: '/catalog',
  orders: '/sales',
};

export const OSIRIS_FUNERAL_PATH_PREFIXES = ['/funeral', '/catalog', '/sales'] as const;

export function isOsirisFuneralPath(pathname: string): boolean {
  return OSIRIS_FUNERAL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function modulePathFor(
  moduleId: OrgModuleId,
  defaultPath: string,
  overrides?: Partial<Record<OrgModuleId, string>>,
): string {
  return overrides?.[moduleId] ?? defaultPath;
}

export function casesBasePath(overrides?: Partial<Record<OrgModuleId, string>>): string {
  return overrides?.cases ?? '/cases';
}

export function clientsBasePath(overrides?: Partial<Record<OrgModuleId, string>>): string {
  return overrides?.clients ?? '/clients';
}

export function productsBasePath(overrides?: Partial<Record<OrgModuleId, string>>): string {
  return overrides?.products ?? '/products';
}
