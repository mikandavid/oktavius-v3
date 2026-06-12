import { useMemo } from 'react';

import { useUserPreferences } from '@/lib/userPreferences';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { getOrgProfile } from './profiles';
import { getLocalizedOrgProfile } from './terminology';

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
