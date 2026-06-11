import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';
import { SIDEBAR_COLLAPSED_STORAGE_KEY, useOptionalUserPreferences } from '@/lib/userPreferences';

function readStoredCollapsedState() {
  const storage = getWindowStorage('localStorage');
  return safeStorageGet(storage, SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
}

type AppShellLayoutContextValue = {
  hasSecondaryNav: boolean;
  registerSecondaryNav: () => void;
  unregisterSecondaryNav: () => void;
  hasFillHeightPage: boolean;
  registerFillHeightPage: () => void;
  unregisterFillHeightPage: () => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  isSidebarCompact: boolean;
};

const AppShellLayoutContext = createContext<AppShellLayoutContextValue | null>(null);

export function AppShellLayoutProvider({ children }: { children: ReactNode }) {
  const userPreferences = useOptionalUserPreferences();
  const preferredSidebarCollapsed = userPreferences?.sidebarCollapsedPreference ?? null;
  const [secondaryNavCount, setSecondaryNavCount] = useState(0);
  const [fillHeightPageCount, setFillHeightPageCount] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(
    () => preferredSidebarCollapsed ?? readStoredCollapsedState(),
  );
  const [detailExpandedOverride, setDetailExpandedOverride] = useState(false);

  const hasSecondaryNav = secondaryNavCount > 0;
  const hasFillHeightPage = fillHeightPageCount > 0;

  useEffect(() => {
    setDetailExpandedOverride(false);
  }, [hasSecondaryNav]);

  useEffect(() => {
    if (preferredSidebarCollapsed != null) {
      setIsSidebarCollapsedState(preferredSidebarCollapsed);
    }
  }, [preferredSidebarCollapsed]);

  const setSidebarCollapsed = useCallback(
    (collapsed: boolean) => {
      setIsSidebarCollapsedState(collapsed);
      if (userPreferences) {
        userPreferences.setSidebarCollapsedPreference(collapsed);
        return;
      }
      safeStorageSet(
        getWindowStorage('localStorage'),
        SIDEBAR_COLLAPSED_STORAGE_KEY,
        String(collapsed),
      );
    },
    [userPreferences],
  );

  const toggleSidebarCollapsed = useCallback(() => {
    if (hasSecondaryNav) {
      setDetailExpandedOverride((current) => !current);
      return;
    }
    setSidebarCollapsed(!isSidebarCollapsed);
  }, [hasSecondaryNav, isSidebarCollapsed, setSidebarCollapsed]);

  const registerSecondaryNav = useCallback(() => {
    setSecondaryNavCount((count) => count + 1);
  }, []);

  const unregisterSecondaryNav = useCallback(() => {
    setSecondaryNavCount((count) => Math.max(0, count - 1));
  }, []);

  const registerFillHeightPage = useCallback(() => {
    setFillHeightPageCount((count) => count + 1);
  }, []);

  const unregisterFillHeightPage = useCallback(() => {
    setFillHeightPageCount((count) => Math.max(0, count - 1));
  }, []);

  const isSidebarCompact = hasSecondaryNav ? !detailExpandedOverride : isSidebarCollapsed;

  const value = useMemo(
    () => ({
      hasSecondaryNav,
      registerSecondaryNav,
      unregisterSecondaryNav,
      hasFillHeightPage,
      registerFillHeightPage,
      unregisterFillHeightPage,
      isSidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      isSidebarCompact,
    }),
    [
      hasSecondaryNav,
      registerSecondaryNav,
      unregisterSecondaryNav,
      hasFillHeightPage,
      registerFillHeightPage,
      unregisterFillHeightPage,
      isSidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      isSidebarCompact,
    ],
  );

  return <AppShellLayoutContext.Provider value={value}>{children}</AppShellLayoutContext.Provider>;
}

export function useAppShellLayout() {
  const context = useContext(AppShellLayoutContext);
  if (!context) {
    throw new Error('useAppShellLayout must be used within AppShellLayoutProvider');
  }
  return context;
}

/** Marks the current page as having a left section nav — compacts the app sidebar. */
export function useRegisterSecondaryNav(active = true) {
  const { registerSecondaryNav, unregisterSecondaryNav } = useAppShellLayout();

  useEffect(() => {
    if (!active) return;
    registerSecondaryNav();
    return unregisterSecondaryNav;
  }, [active, registerSecondaryNav, unregisterSecondaryNav]);
}

/** Switches `<main>` to fit mode so module content can fill the workspace height. */
export function useRegisterFillHeightPage(active = true) {
  const { registerFillHeightPage, unregisterFillHeightPage } = useAppShellLayout();

  useEffect(() => {
    if (!active) return;
    registerFillHeightPage();
    return unregisterFillHeightPage;
  }, [active, registerFillHeightPage, unregisterFillHeightPage]);
}
