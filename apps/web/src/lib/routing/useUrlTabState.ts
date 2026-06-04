import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs detail (or settings) tab selection to `?tab=` for shareable deep links.
 */
export function useUrlTabState(
  defaultTab = 'overview',
  allowedTabs?: readonly string[],
  paramKey = 'tab',
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo(() => {
    const raw = searchParams.get(paramKey) ?? defaultTab;
    if (allowedTabs && !allowedTabs.includes(raw)) return defaultTab;
    return raw;
  }, [searchParams, paramKey, defaultTab, allowedTabs]);

  const setActiveTab = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === defaultTab) {
            params.delete(paramKey);
          } else {
            params.set(paramKey, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams, paramKey, defaultTab],
  );

  return [activeTab, setActiveTab] as const;
}
