import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppShellLayout } from './AppShellLayoutContext';

const LABELS_VISIBLE_DELAY_MS = 80;

/**
 * Owns the compact-rail behavior: hover-to-expand, the delayed label fade, and
 * the "suppress re-expand until pointer leaves after a manual collapse" guard.
 * Extracted verbatim from SidebarContent — behavior unchanged.
 */
export function useSidebarHoverExpand({
  mobile,
  embedded,
}: {
  mobile: boolean;
  embedded: boolean;
}) {
  const { isSidebarCompact, toggleSidebarCollapsed } = useAppShellLayout();

  const [isLabelsVisible, setIsLabelsVisible] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const suppressHoverExpandUntilLeaveRef = useRef(false);

  const isSidebarLayoutCompact = !mobile && !embedded && isSidebarCompact;
  const isExpanded = mobile || embedded ? true : !isSidebarCompact || isHoverExpanded;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isExpanded) {
      timer = setTimeout(() => setIsLabelsVisible(true), LABELS_VISIBLE_DELAY_MS);
    } else {
      setIsLabelsVisible(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isExpanded]);

  const toggleCollapsed = useCallback(() => {
    if (isSidebarLayoutCompact) {
      suppressHoverExpandUntilLeaveRef.current = false;
    } else if (!mobile && !embedded) {
      suppressHoverExpandUntilLeaveRef.current = true;
    }
    setIsHoverExpanded(false);
    toggleSidebarCollapsed();
  }, [embedded, isSidebarLayoutCompact, mobile, toggleSidebarCollapsed]);

  useEffect(() => {
    if (!isSidebarLayoutCompact) {
      suppressHoverExpandUntilLeaveRef.current = false;
      setIsHoverExpanded(false);
    }
  }, [isSidebarLayoutCompact]);

  const handleSidebarMouseEnter = useCallback(() => {
    if (!isSidebarLayoutCompact || suppressHoverExpandUntilLeaveRef.current) return;
    setIsHoverExpanded(true);
  }, [isSidebarLayoutCompact]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!isSidebarLayoutCompact) return;
    suppressHoverExpandUntilLeaveRef.current = false;
    setIsHoverExpanded(false);
  }, [isSidebarLayoutCompact]);

  return {
    isSidebarCompact,
    isSidebarLayoutCompact,
    isExpanded,
    isHoverExpanded,
    isLabelsVisible,
    toggleCollapsed,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
  };
}
