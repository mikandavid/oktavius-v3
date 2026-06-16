import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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

  // NOTE: `url`/`search` are intentionally omitted here. They change on every
  // navigation (incl. list search/filter/sort/pagination via query params), and
  // including them would re-render every AgentPageContext consumer — notably the
  // always-mounted agent chat panel — on each keystroke. The live url/search are
  // read directly from window.location by `captureAgentPageContext` at send time
  // (see page-routing.ts), so omitting them here changes nothing the agent sees.
  const pageContextMetadata = useMemo<AgentPageContextMetadata>(() => {
    return {
      pathname: location.pathname,
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
  }, [location.pathname, matchedModule, registration]);

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
