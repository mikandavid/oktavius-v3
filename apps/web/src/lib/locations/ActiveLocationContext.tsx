import { useQueryClient } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react';

import { appToast } from '@/lib/toast';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

import type { LocationDetailItem } from './types';

type ActiveLocationContextValue = {
  activeLocationId: string | null;
  viewAllLocations: boolean;
  setActiveLocationId: (id: string | null) => void;
  setAllLocationsMode: () => void;
  locations: LocationDetailItem[];
  activeLocation: LocationDetailItem | null;
};

const ActiveLocationContext = createContext<ActiveLocationContextValue | null>(null);

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeOrgId = osirisRuntime?.activeOrgId ?? null;
  const activeSiteId = osirisRuntime?.activeSiteId ?? null;
  const locations = useMemo(
    () =>
      (osirisRuntime?.locationAccess?.sites ?? []).map<LocationDetailItem>((site) => ({
        id: site.id,
        name: site.name,
        isActive: site.isActive ?? true,
        branchCode: null,
        designation: null,
        locality: null,
        category: null,
        phone: null,
        mobilePhone: null,
        fax: null,
        companyName: null,
        email: null,
        street: null,
        postalCode: null,
      })),
    [osirisRuntime?.locationAccess?.sites],
  );

  useEffect(() => {
    if (activeSiteId === null) return;
    if (locations.some((location) => location.id === activeSiteId)) return;
    void Promise.resolve(osirisRuntime?.setActiveSiteId?.(locations[0]?.id ?? null)).catch(
      (error: unknown) => {
        appToast.fromApiError(error, 'Location could not be switched.');
      },
    );
  }, [activeSiteId, locations, osirisRuntime]);

  useEffect(() => {
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'scope' });
  }, [activeOrgId, activeSiteId, queryClient]);

  const setActiveLocationId = useCallback(
    (id: string | null) => {
      void Promise.resolve(osirisRuntime?.setActiveSiteId?.(id)).catch((error: unknown) => {
        appToast.fromApiError(error, 'Location could not be switched.');
      });
    },
    [osirisRuntime],
  );

  const setAllLocationsMode = useCallback(() => {
    void Promise.resolve(osirisRuntime?.setActiveSiteId?.(null)).catch((error: unknown) => {
      appToast.fromApiError(error, 'Location could not be switched.');
    });
  }, [osirisRuntime]);

  const value = useMemo<ActiveLocationContextValue>(() => {
    const viewAllLocations = activeSiteId === null;
    const activeLocation =
      viewAllLocations || !activeSiteId
        ? null
        : (locations.find((location) => location.id === activeSiteId) ?? null);

    return {
      activeLocationId: activeSiteId,
      viewAllLocations,
      setActiveLocationId,
      setAllLocationsMode,
      locations,
      activeLocation,
    };
  }, [activeSiteId, locations, setActiveLocationId, setAllLocationsMode]);

  return <ActiveLocationContext.Provider value={value}>{children}</ActiveLocationContext.Provider>;
}

export function useActiveLocation() {
  const context = useContext(ActiveLocationContext);
  if (!context) {
    throw new Error('useActiveLocation must be used inside ActiveLocationProvider');
  }
  return context;
}
