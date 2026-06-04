import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { resolveAppNavModuleForProfile } from '@/lib/appNavModules';
import { useOrgProfile } from '@/lib/org-profiles/useOrgProfile';

import type { AgentPageContextMetadata } from './page-routing';

type AgentPageRegistration = Omit<AgentPageContextMetadata, 'url' | 'pathname' | 'search'>;

type AgentPageContextValue = {
  pageContextMetadata: AgentPageContextMetadata;
  setRegistration: (value: AgentPageRegistration | null) => void;
};

const AgentPageContext = createContext<AgentPageContextValue | null>(null);

export function AgentPageContextProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const profile = useOrgProfile();
  const [registration, setRegistration] = useState<AgentPageRegistration | null>(null);

  const matchedModule = useMemo(
    () => resolveAppNavModuleForProfile(profile, location.pathname),
    [location.pathname, profile],
  );

  const pageContextMetadata = useMemo<AgentPageContextMetadata>(() => {
    const currentUrl =
      typeof window !== 'undefined' && window.location ? window.location.href : location.pathname;

    return {
      url: currentUrl,
      pathname: location.pathname,
      ...(location.search ? { search: location.search } : {}),
      ...(registration?.moduleId
        ? { moduleId: registration.moduleId }
        : matchedModule
          ? { moduleId: matchedModule.id }
          : {}),
      ...(registration?.moduleLabel
        ? { moduleLabel: registration.moduleLabel }
        : matchedModule
          ? { moduleLabel: matchedModule.label }
          : {}),
      ...(registration?.routeLabel ? { routeLabel: registration.routeLabel } : {}),
      ...(registration?.primaryEntity ? { primaryEntity: registration.primaryEntity } : {}),
    };
  }, [location.pathname, location.search, matchedModule, registration]);

  const value = useMemo(
    () => ({
      pageContextMetadata,
      setRegistration,
    }),
    [pageContextMetadata, setRegistration],
  );

  return <AgentPageContext.Provider value={value}>{children}</AgentPageContext.Provider>;
}

function useAgentPageContextInternal(): AgentPageContextValue {
  const value = useContext(AgentPageContext);
  if (!value) {
    throw new Error('useAgentPageContext must be used within AgentPageContextProvider');
  }
  return value;
}

export function useAgentPageContext(): AgentPageContextMetadata {
  return useAgentPageContextInternal().pageContextMetadata;
}

export function useRegisterAgentPageContext(value: AgentPageRegistration | null): void {
  const { setRegistration } = useAgentPageContextInternal();

  useEffect(() => {
    setRegistration(value);
    return () => {
      setRegistration(null);
    };
  }, [
    setRegistration,
    value?.moduleId,
    value?.moduleLabel,
    value?.routeLabel,
    value?.primaryEntity?.entityType,
    value?.primaryEntity?.entityId,
    value?.primaryEntity?.displayLabel,
    value,
  ]);
}
