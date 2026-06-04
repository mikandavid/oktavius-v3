import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { normalizeOsirisBootstrap } from './bootstrap';
import type { OsirisBootstrapResponse, OsirisRuntimeState } from './types';
import { OsirisRuntimeContext } from './useOsirisRuntime';

const EMPTY_STATE: OsirisRuntimeState = {
  currentUser: { id: '', email: null, fullName: null, isSuperadmin: false },
  organizations: [],
  memberships: [],
  activeOrgId: null,
  activeSiteId: null,
  permissions: [],
  permissionSubject: { isSuperadmin: false, role: null, permissions: [] },
  locationAccess: null,
  config: null,
};

async function fetchBootstrap(): Promise<OsirisBootstrapResponse> {
  const response = await fetch('/bootstrap', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Bootstrap failed with ${response.status}`);
  }
  return (await response.json()) as OsirisBootstrapResponse;
}

export function OsirisAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OsirisRuntimeState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setState(normalizeOsirisBootstrap(await fetchBootstrap()));
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <OsirisRuntimeContext.Provider value={{ ...state, isLoading, error, reload }}>
      {children}
    </OsirisRuntimeContext.Provider>
  );
}
