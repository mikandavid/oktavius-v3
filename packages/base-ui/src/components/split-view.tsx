import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { clampSplitViewSidebarWidth, useSplitViewLayout } from '../hooks/use-split-view-layout';
import { cn } from '../lib/utils';

const DEFAULT_SIDEBAR_WIDTH = 400;
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 760;
const MIN_CONTENT_WIDTH = 360;
const RESIZE_HANDLE_WIDTH = 12;

function legacySizeToWidth(size: number | undefined, fallback: number) {
  if (!Number.isFinite(size)) return fallback;
  return Math.round((size as number) * 12);
}

export interface SplitViewProps {
  sidebar: ReactNode;
  children: ReactNode;
  defaultSidebarWidth?: number;
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  /** @deprecated Use defaultSidebarWidth. */
  defaultSidebarSize?: number;
  /** @deprecated Use minSidebarWidth. */
  minSidebarSize?: number;
  /** @deprecated Use maxSidebarWidth. */
  maxSidebarSize?: number;
  persistKey?: string;
  resizable?: boolean;
  sidebarScroll?: boolean;
  sidebarColumn?: string;
  className?: string;
  sidebarClassName?: string;
  contentClassName?: string;
}

export function SplitView({
  sidebar,
  children,
  defaultSidebarWidth,
  minSidebarWidth,
  maxSidebarWidth,
  defaultSidebarSize,
  minSidebarSize,
  maxSidebarSize,
  persistKey,
  resizable = true,
  sidebarScroll = true,
  sidebarColumn,
  className,
  sidebarClassName,
  contentClassName,
}: SplitViewProps) {
  const sidebarId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const resolvedMinWidth = Math.max(
    MIN_SIDEBAR_WIDTH,
    minSidebarWidth ?? legacySizeToWidth(minSidebarSize, MIN_SIDEBAR_WIDTH),
  );
  const resolvedMaxWidth = Math.max(
    resolvedMinWidth,
    maxSidebarWidth ?? legacySizeToWidth(maxSidebarSize, MAX_SIDEBAR_WIDTH),
  );
  const resolvedDefaultWidth = clampSplitViewSidebarWidth(
    defaultSidebarWidth ?? legacySizeToWidth(defaultSidebarSize, DEFAULT_SIDEBAR_WIDTH),
    resolvedMinWidth,
    resolvedMaxWidth,
  );
  const effectiveMaxWidth = useMemo(() => {
    if (containerWidth <= 0) return resolvedMaxWidth;
    const availableWidth = containerWidth - MIN_CONTENT_WIDTH - RESIZE_HANDLE_WIDTH;
    return Math.max(resolvedMinWidth, Math.min(resolvedMaxWidth, availableWidth));
  }, [containerWidth, resolvedMinWidth, resolvedMaxWidth]);

  const { sidebarWidth, setSidebarWidth, persistSidebarWidth } = useSplitViewLayout(
    persistKey,
    resolvedDefaultWidth,
    resolvedMinWidth,
    effectiveMaxWidth,
  );
  const clampedSidebarWidth = clampSplitViewSidebarWidth(
    sidebarWidth,
    resolvedMinWidth,
    effectiveMaxWidth,
  );

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (clampedSidebarWidth !== sidebarWidth) {
      setSidebarWidth(clampedSidebarWidth);
    }
  }, [clampedSidebarWidth, sidebarWidth, setSidebarWidth]);

  const commitSidebarWidth = useCallback(
    (nextWidth: number) => {
      const width = clampSplitViewSidebarWidth(nextWidth, resolvedMinWidth, effectiveMaxWidth);
      setSidebarWidth(width);
      persistSidebarWidth(width);
    },
    [effectiveMaxWidth, persistSidebarWidth, resolvedMinWidth, setSidebarWidth],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!resizable) return;

      dragState.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startWidth: clampedSidebarWidth,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.resizeActive = 'true';
    },
    [clampedSidebarWidth, resizable],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      setSidebarWidth(
        clampSplitViewSidebarWidth(
          drag.startWidth + event.clientX - drag.startX,
          resolvedMinWidth,
          effectiveMaxWidth,
        ),
      );
    },
    [effectiveMaxWidth, resolvedMinWidth, setSidebarWidth],
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragState.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const nextWidth = clampSplitViewSidebarWidth(
        drag.startWidth + event.clientX - drag.startX,
        resolvedMinWidth,
        effectiveMaxWidth,
      );

      dragState.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
      delete event.currentTarget.dataset.resizeActive;
      commitSidebarWidth(nextWidth);
    },
    [commitSidebarWidth, effectiveMaxWidth, resolvedMinWidth],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!resizable) return;

      const step = event.shiftKey ? 64 : 24;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        commitSidebarWidth(clampedSidebarWidth - step);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        commitSidebarWidth(clampedSidebarWidth + step);
      } else if (event.key === 'Home') {
        event.preventDefault();
        commitSidebarWidth(resolvedMinWidth);
      } else if (event.key === 'End') {
        event.preventDefault();
        commitSidebarWidth(effectiveMaxWidth);
      }
    },
    [clampedSidebarWidth, commitSidebarWidth, effectiveMaxWidth, resolvedMinWidth, resizable],
  );

  const gridTemplateColumns = sidebarColumn
    ? `${sidebarColumn} minmax(0, 1fr)`
    : resizable
      ? `${clampedSidebarWidth}px ${RESIZE_HANDLE_WIDTH}px minmax(0, 1fr)`
      : `${clampedSidebarWidth}px minmax(0, 1fr)`;
  return (
    <div
      ref={rootRef}
      className={cn(
        className,
        'grid min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-card bg-card',
      )}
      style={{ gridTemplateColumns }}
    >
      <aside
        id={sidebarId}
        className={cn(
          'flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-x-hidden',
          resizable ? undefined : 'border-r border-border/50',
          sidebarScroll && 'overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]',
          sidebarClassName,
        )}
      >
        {sidebar}
      </aside>
      {resizable ? (
        <button
          type="button"
          aria-controls={sidebarId}
          aria-label="Resize split view sidebar"
          aria-orientation="vertical"
          aria-valuemax={effectiveMaxWidth}
          aria-valuemin={resolvedMinWidth}
          aria-valuenow={clampedSidebarWidth}
          className={cn(
            'relative flex min-h-0 w-3 cursor-col-resize touch-none items-stretch bg-transparent focus-visible:outline-none',
            'before:pointer-events-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border/50 before:transition-colors',
            'after:absolute after:inset-y-0 after:left-0 after:w-full after:rounded-control after:transition-colors',
            'hover:before:bg-primary/20 hover:after:bg-primary/5 data-[resize-active=true]:before:bg-primary/40 data-[resize-active=true]:after:bg-primary/10',
            'focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2',
          )}
          role="separator"
          onKeyDown={handleKeyDown}
          onPointerCancel={handlePointerUp}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ) : null}
      <div
        className={cn(
          'min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
