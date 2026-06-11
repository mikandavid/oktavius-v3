import { useMemo } from 'react';

import { useUserPreferences } from '@/lib/userPreferences';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { casesBasePath, clientsBasePath, productsBasePath } from './nav-paths';
import { getLocalizedOrgProfile } from './terminology';
import { getOrgProfile } from './profiles';

export function useOrgProfile() {
  const osirisRuntime = useOptionalOsirisRuntime();
  const { locale } = useUserPreferences();
  const activeOrgId = osirisRuntime?.activeOrgId;
  const activeOrganization = osirisRuntime?.organizations.find((org) => org.id === activeOrgId);
  const profile = useMemo(() => {
    const fallback = getOrgProfile(activeOrgId);
    if (!activeOrganization) return fallback;
    return {
      ...fallback,
      id: activeOrganization.id,
      slug: activeOrganization.slug,
      name: activeOrganization.name,
    };
  }, [activeOrgId, activeOrganization]);

  return useMemo(() => getLocalizedOrgProfile(profile, locale), [locale, profile]);
}

export function useOrgNavPaths() {
  const profile = useOrgProfile();
  return useMemo(
    () => ({
      cases: casesBasePath(profile.navPaths),
      clients: clientsBasePath(profile.navPaths),
      products: productsBasePath(profile.navPaths),
      orders: profile.navPaths?.orders ?? '/orders',
      documents: profile.navPaths?.documents ?? '/documents',
    }),
    [profile.navPaths],
  );
}

export function useOrgTerminology() {
  return useOrgProfile().terminology;
}
