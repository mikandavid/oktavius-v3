import { useMemo } from 'react';

import { useDemoData } from '@/app/demo-data';
import { useUserPreferences } from '@/lib/userPreferences';

import { casesBasePath, clientsBasePath, productsBasePath } from './nav-paths';
import { getLocalizedOrgProfile } from './terminology';
import { getOrgProfile } from './profiles';

export function useOrgProfile() {
  const { activeOrgId } = useDemoData();
  const { locale } = useUserPreferences();
  const profile = getOrgProfile(activeOrgId);

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
