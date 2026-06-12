import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';

export type MouseTooltipOffset = { x?: number; y?: number };

const DEFAULT_OFFSET: MouseTooltipOffset = { x: 12, y: 12 };

const tooltipSurfaceClass =
  'pointer-events-none fixed top-0 left-0 z-[100] rounded-md border border-border/70 bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-elevated';

type UseMouseTooltipOptions = {
  className?: string;
  offset?: MouseTooltipOffset;
};

export function useMouseTooltip(
  content: React.ReactNode | undefined | false | null,
  { className, offset = DEFAULT_OFFSET }: UseMouseTooltipOptions = {},
) {
  const [visible, setVisible] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const offsetRef = React.useRef(offset);
  offsetRef.current = offset;
  const enabled = Boolean(content);

  const applyPosition = React.useCallback((x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    const { x: offsetX = 12, y: offsetY = 12 } = offsetRef.current;
    el.style.transform = `translate3d(${x + offsetX}px, ${y + offsetY}px, 0)`;
  }, []);

  const handlers = React.useMemo(() => {
    if (!enabled) return {};

    return {
      onMouseEnter: (event: React.MouseEvent) => {
        applyPosition(event.clientX, event.clientY);
        setVisible(true);
      },
      onMouseMove: (event: React.MouseEvent) => {
        applyPosition(event.clientX, event.clientY);
      },
      onMouseLeave: () => {
        setVisible(false);
      },
    };
  }, [applyPosition, enabled]);

  const node =
    enabled && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tooltipRef}
            aria-hidden={!visible}
            className={cn(
              tooltipSurfaceClass,
              '!transition-none',
              visible ? 'opacity-100' : 'opacity-0',
              className,
            )}
            style={{ transition: 'none' }}
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
