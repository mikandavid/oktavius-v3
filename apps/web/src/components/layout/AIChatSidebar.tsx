import { cn, MouseTooltip } from '@oktavius/base-ui';
import { useCallback, useEffect, useRef, useState } from 'react';

import { OctopusIcon } from '@/components/agent/OctopusIcon';
import { APP_SHELL_SURFACE_CLASS } from '@/components/common/pageChrome';
import { ChevronLeftIcon } from '@/lib/icons';
import { getWindowStorage, safeStorageGet, safeStorageSet } from '@/lib/storage/safeStorage';

import { OsirisChatShell } from './OsirisChatShell';

const CHAT_SIDEBAR_WIDTH_KEY = 'chat-sidebar-width';
const CHAT_SIDEBAR_COLLAPSED_KEY = 'chat-sidebar-collapsed';
const COLLAPSED_WIDTH = 48;
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 900;
const MAIN_CONTENT_MIN = 640;
const DRAG_COLLAPSE_THRESHOLD = 140;

const getViewportMax = () => {
  if (typeof window === 'undefined') return MAX_WIDTH;
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - MAIN_CONTENT_MIN));
};

const clampSidebarWidth = (value: number) => Math.max(MIN_WIDTH, Math.min(getViewportMax(), value));

function readStoredSidebarWidth() {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, CHAT_SIDEBAR_WIDTH_KEY);
  const parsed = stored ? Number.parseInt(stored, 10) : DEFAULT_WIDTH;
  return clampSidebarWidth(Number.isFinite(parsed) ? parsed : DEFAULT_WIDTH);
}

function readStoredCollapsedState() {
  const storage = getWindowStorage('localStorage');
  const stored = safeStorageGet(storage, CHAT_SIDEBAR_COLLAPSED_KEY);
  if (stored === null) return true;
  return stored === 'true';
}

export function AIChatSidebar() {
  const [collapsed, setCollapsed] = useState(readStoredCollapsedState);
  const [width, setWidth] = useState(readStoredSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number; latestRawWidth: number } | null>(
    null,
  );

  useEffect(() => {
    safeStorageSet(getWindowStorage('localStorage'), CHAT_SIDEBAR_WIDTH_KEY, String(width));
  }, [width]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth((current) => clampSidebarWidth(current));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    safeStorageSet(getWindowStorage('localStorage'), CHAT_SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const widthPx = collapsed ? COLLAPSED_WIDTH : width;
    document.documentElement.style.setProperty('--app-ai-chat-sidebar-width', `${widthPx}px`);
    return () => {
      document.documentElement.style.removeProperty('--app-ai-chat-sidebar-width');
    };
  }, [collapsed, width]);

  const setCollapsedState = useCallback(
    (next: boolean) => {
      if (!next && collapsed) {
        setWidth(readStoredSidebarWidth());
      }
      setCollapsed(next);
    },
    [collapsed],
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const deltaX = resizeRef.current.startX - event.clientX;
      const rawWidth = resizeRef.current.startWidth + deltaX;
      resizeRef.current.latestRawWidth = rawWidth;
      if (rawWidth <= MIN_WIDTH - DRAG_COLLAPSE_THRESHOLD) {
        setCollapsedState(true);
        setIsResizing(false);
        resizeRef.current = null;
        return;
      }
      setWidth(clampSidebarWidth(rawWidth));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setCollapsedState]);

  return (
    <div
      data-ai-chat-sidebar="true"
      className={cn(
        'relative flex h-dvh max-h-dvh shrink-0 overflow-hidden',
        APP_SHELL_SURFACE_CLASS,
        !isResizing && 'transition-[width] duration-200 ease-out',
      )}
      style={
        collapsed
          ? { width: `${COLLAPSED_WIDTH}px`, minWidth: `${COLLAPSED_WIDTH}px` }
          : {
              width: `${width}px`,
              minWidth: `${MIN_WIDTH}px`,
              maxWidth: `min(${MAX_WIDTH}px, calc(100vw - ${MAIN_CONTENT_MIN}px))`,
            }
      }
    >
      {collapsed ? (
        <div className="flex h-full w-full flex-col items-center">
          <MouseTooltip content="Expand AI chat">
            <button
              type="button"
              className="h-12 w-full shrink-0 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setCollapsedState(false)}
              aria-label="Expand AI chat"
            >
              <OctopusIcon className="mx-auto h-4 w-4" />
            </button>
          </MouseTooltip>

          <button
            className="group flex w-full flex-1 items-center justify-center overflow-hidden py-4 transition-colors hover:bg-muted/50"
            onClick={() => setCollapsedState(false)}
          >
            <span
              className="select-none text-[11px] font-medium text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
              style={{ writingMode: 'vertical-rl', maxHeight: '200px', overflow: 'hidden' }}
            >
              Agent chat
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="absolute inset-y-0 left-0 z-20 flex w-4 -translate-x-1/2 items-center justify-center group/resize">
            <MouseTooltip content="Collapse AI chat">
              <button
                type="button"
                className={cn(
                  'absolute z-10 h-6 w-6 rounded-full border border-border text-muted-foreground transition-opacity',
                  APP_SHELL_SURFACE_CLASS,
                  'pointer-events-none opacity-0 group-hover/resize:pointer-events-auto group-hover/resize:opacity-100 hover:text-foreground',
                  isResizing && 'pointer-events-none opacity-0',
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => setCollapsedState(true)}
                aria-label="Collapse AI chat"
              >
                <ChevronLeftIcon size={12} className="mx-auto rotate-180" />
              </button>
            </MouseTooltip>
            {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mouse-only resize affordance; the sidebar is keyboard-operable via the collapse/expand button */}
            <div
              className={cn(
                'absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 cursor-col-resize transition-colors',
                isResizing ? 'bg-primary/40' : 'group-hover/resize:bg-primary/20',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                setIsResizing(true);
                resizeRef.current = {
                  startX: event.clientX,
                  startWidth: width,
                  latestRawWidth: width,
                };
              }}
            />
          </div>

          <div className="flex min-h-0 flex-1">
            <OsirisChatShell mode="sidebar" className="h-full max-h-dvh" />
          </div>
        </>
      )}
    </div>
  );
}
