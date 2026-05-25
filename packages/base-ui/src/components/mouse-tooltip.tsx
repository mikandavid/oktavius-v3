import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';

interface MouseTooltipState {
  x: number;
  y: number;
}

export type MouseTooltipOffset = { x?: number; y?: number };

const DEFAULT_OFFSET: MouseTooltipOffset = { x: 12, y: 12 };

const tooltipSurfaceClass =
  'pointer-events-none fixed z-[100] rounded-md border border-border/70 bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-sm';

type UseMouseTooltipOptions = {
  className?: string;
  offset?: MouseTooltipOffset;
};

export function useMouseTooltip(
  content: React.ReactNode | undefined | false | null,
  { className, offset = DEFAULT_OFFSET }: UseMouseTooltipOptions = {},
) {
  const [pos, setPos] = React.useState<MouseTooltipState | null>(null);
  const enabled = Boolean(content);

  const handlers = React.useMemo(() => {
    if (!enabled) return {};

    return {
      onMouseEnter: (event: React.MouseEvent) => {
        setPos({ x: event.clientX, y: event.clientY });
      },
      onMouseMove: (event: React.MouseEvent) => {
        setPos({ x: event.clientX, y: event.clientY });
      },
      onMouseLeave: () => {
        setPos(null);
      },
    };
  }, [enabled]);

  const node =
    enabled && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={cn(tooltipSurfaceClass, className)}
            style={{ left: pos.x + (offset.x ?? 12), top: pos.y + (offset.y ?? 12) }}
          >
            {content}
          </div>,
          document.body,
        )
      : null;

  return { handlers, node };
}

interface MouseTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler;
    onMouseMove?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  }>;
  className?: string;
  offset?: MouseTooltipOffset;
}

export function MouseTooltip({
  content,
  children,
  className,
  offset = DEFAULT_OFFSET,
}: MouseTooltipProps) {
  const { handlers, node } = useMouseTooltip(content, { className, offset });
  const child = React.Children.only(children);

  const cloned = React.cloneElement(child, {
    onMouseEnter: (event: React.MouseEvent) => {
      handlers.onMouseEnter?.(event);
      child.props.onMouseEnter?.(event);
    },
    onMouseMove: (event: React.MouseEvent) => {
      handlers.onMouseMove?.(event);
      child.props.onMouseMove?.(event);
    },
    onMouseLeave: (event: React.MouseEvent) => {
      handlers.onMouseLeave?.();
      child.props.onMouseLeave?.(event);
    },
  });

  return (
    <>
      {cloned}
      {node}
    </>
  );
}
