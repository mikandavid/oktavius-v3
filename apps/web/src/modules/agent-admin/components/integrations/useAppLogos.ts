import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PipedreamApp } from '@/runtime/osiris/agentIntegrationsClient';
import { resolveOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';
import { joinOsirisApiBaseUrl } from '@/runtime/osiris/apiBaseUrl';

import { NATIVE_INTEGRATION_LOGOS } from './connectionPresentation';

/**
 * Resolve app logos for connection rows. The connections endpoint only returns the
 * app key, so Pipedream logos are looked up through the app-search proxy (one cached
 * query per distinct app) while native integrations map to bundled assets.
 */
export function useAppLogos(appKeys: string[]): Record<string, string | undefined> {
  const baseUrl = resolveOsirisApiBaseUrl();
  const pipedreamKeys = useMemo(
    () => [...new Set(appKeys.filter((key) => key && !NATIVE_INTEGRATION_LOGOS[key]))].sort(),
    [appKeys],
  );

  const results = useQueries({
    queries: pipedreamKeys.map((appKey) => ({
      queryKey: ['agent-integration-app-logo', appKey],
      queryFn: async () => {
        const query = appKey.replace(/[_-]+/g, ' ');
        const url = joinOsirisApiBaseUrl(
          baseUrl,
          `/agent-integrations/apps?q=${encodeURIComponent(query)}`,
        );
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) return null;
        const { apps } = (await response.json()) as { apps: PipedreamApp[] };
        return apps.find((app) => app.nameSlug === appKey)?.imgSrc ?? null;
      },
      staleTime: Infinity,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  return useMemo(() => {
    const logos: Record<string, string | undefined> = { ...NATIVE_INTEGRATION_LOGOS };
    pipedreamKeys.forEach((appKey, index) => {
      logos[appKey] = results[index]?.data ?? undefined;
    });
    return logos;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- useQueries returns a fresh array; key on the data values.
  }, [pipedreamKeys, ...results.map((result) => result.data)]);
}
