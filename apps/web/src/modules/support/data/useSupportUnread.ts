import { useCallback, useState } from 'react';

const STORAGE_KEY = 'support:lastSeen';

type LastSeenMap = Record<string, string>;

function read(): LastSeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LastSeenMap) : {};
  } catch {
    return {};
  }
}

/**
 * Tracks which tickets the current browser has opened, in localStorage.
 * Frontend-only stand-in for "new activity" until backend notifications exist.
 *
 * Call once per page and pass `isUnread`/`markSeen` down — each call holds
 * independent state, so multiple instances in the same mounted tree will not
 * observe each other's `markSeen` until remount.
 */
export function useSupportUnread() {
  const [seen, setSeen] = useState<LastSeenMap>(read);

  const isUnread = useCallback(
    (ticket: { id: string; updatedAt: string }) => {
      const lastSeen = seen[ticket.id];
      if (!lastSeen) return true;
      return new Date(ticket.updatedAt).getTime() > new Date(lastSeen).getTime();
    },
    [seen],
  );

  const markSeen = useCallback((ticketId: string, updatedAt: string) => {
    setSeen((prev) => {
      const next = { ...prev, [ticketId]: updatedAt };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota/availability errors */
      }
      return next;
    });
  }, []);

  return { isUnread, markSeen };
}
