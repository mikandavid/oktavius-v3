import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useDemoData } from '@/app/demo-data';
import { getOrgProfile } from '@/lib/org-profiles/profiles';

import { DEMO_LOCATIONS } from './demoLocations';
import type { LocationDetailItem } from './types';
import {
  getWindowStorage,
  safeStorageGet,
  safeStorageRemove,
  safeStorageSet,
} from '@/lib/storage/safeStorage';

const STORAGE_KEY = 'oktavius.activeLocationId';

type ActiveLocationContextValue = {
  activeLocationId: string | null;
  viewAllLocations: boolean;
  setActiveLocationId: (id: string | null) => void;
  setAllLocationsMode: () => void;
  locations: LocationDetailItem[];
  activeLocation: LocationDetailItem | null;
};

const ActiveLocationContext = createContext<ActiveLocationContextValue | null>(null);

function readStoredLocationId(locations: LocationDetailItem[]): string | null {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, STORAGE_KEY);
  if (stored && locations.some((location) => location.id === stored)) {
    return stored;
  }
  return locations[0]?.id ?? null;
}

export function ActiveLocationProvider({ children }: { children: ReactNode }) {
  const { activeOrgId } = useDemoData();
  const locations = useMemo(() => {
    const profile = getOrgProfile(activeOrgId);
    return profile.locations.length > 0 ? profile.locations : DEMO_LOCATIONS;
  }, [activeOrgId]);

  const [activeLocationId, setActiveLocationIdState] = useState<string | null>(() =>
    readStoredLocationId(locations),
  );
  const [viewAllLocations, setViewAllLocations] = useState(false);

  useEffect(() => {
    const nextId = readStoredLocationId(locations);
    setActiveLocationIdState((current) => (current === nextId ? current : nextId));
    setViewAllLocations((current) => (current ? false : current));
  }, [activeOrgId, locations]);

  const setActiveLocationId = useCallback((id: string | null) => {
    const storage = getWindowStorage('localStorage');
    setViewAllLocations(false);
    setActiveLocationIdState(id);
    if (id) {
      safeStorageSet(storage, STORAGE_KEY, id);
    } else {
      safeStorageRemove(storage, STORAGE_KEY);
    }
  }, []);

  const setAllLocationsMode = useCallback(() => {
    const storage = getWindowStorage('localStorage');
    setViewAllLocations(true);
    setActiveLocationIdState(null);
    safeStorageRemove(storage, STORAGE_KEY);
  }, []);

  const value = useMemo<ActiveLocationContextValue>(() => {
    const activeLocation =
      viewAllLocations || !activeLocationId
        ? null
        : (locations.find((location) => location.id === activeLocationId) ?? null);

    return {
      activeLocationId,
      viewAllLocations,
      setActiveLocationId,
      setAllLocationsMode,
      locations,
      activeLocation,
    };
  }, [activeLocationId, locations, setActiveLocationId, setAllLocationsMode, viewAllLocations]);

  return <ActiveLocationContext.Provider value={value}>{children}</ActiveLocationContext.Provider>;
}

export function useActiveLocation() {
  const context = useContext(ActiveLocationContext);
  if (!context) {
    throw new Error('useActiveLocation must be used inside ActiveLocationProvider');
  }
  return context;
}
