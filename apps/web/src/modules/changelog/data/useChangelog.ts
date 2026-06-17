import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import { createChangelogClient } from './changelogClient';
import { changelogKeys } from './changelogKeys';

export function useChangelogClient() {
  return useMemo(() => createChangelogClient({ baseUrl: resolveOsirisApiBaseUrl() }), []);
}

export function useChangelog() {
  const client = useChangelogClient();
  const org = useOptionalOsirisRuntime()?.activeOrgId ?? null;
  return useQuery({
    queryKey: changelogKeys.list(org),
    queryFn: () => client.listReleases(),
  });
}
