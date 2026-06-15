import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const FLYOUT_HIDE_DELAY_MS = 120;

type SidebarFlyoutContextValue = {
  activeId: string | null;
  show: (id: string) => void;
  hide: (id: string) => void;
};

const SidebarFlyoutContext = createContext<SidebarFlyoutContextValue | null>(null);

export function SidebarFlyoutProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((id: string) => {
    clearTimeout(hideTimeoutRef.current);
    setActiveId(id);
  }, []);

  const hide = useCallback((id: string) => {
    hideTimeoutRef.current = setTimeout(() => {
      setActiveId((current) => (current === id ? null : current));
    }, FLYOUT_HIDE_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideTimeoutRef.current), []);

  return (
    <SidebarFlyoutContext.Provider value={{ activeId, show, hide }}>
      {children}
    </SidebarFlyoutContext.Provider>
  );
}

export function useSidebarFlyout(id: string) {
  const context = useContext(SidebarFlyoutContext);
  if (!context) {
    throw new Error('useSidebarFlyout must be used within SidebarFlyoutProvider');
  }

  return {
    open: context.activeId === id,
    show: () => context.show(id),
    hide: () => context.hide(id),
  };
}
