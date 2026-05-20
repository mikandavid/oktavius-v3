import * as React from 'react';
import { cn } from '../lib/utils';

interface MouseTooltipState {
  x: number;
  y: number;
}

interface MouseTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler;
    onMouseMove?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
  }>;
  className?: string;
  offset?: { x?: number; y?: number };
}

export function MouseTooltip({
  content,
  children,
  className,
  offset = { x: 12, y: 12 },
}: MouseTooltipProps) {
  const [pos, setPos] = React.useState<MouseTooltipState | null>(null);

  const child = React.Children.only(children);

  const cloned = React.cloneElement(child, {
    onMouseEnter: (e: React.MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      child.props.onMouseEnter?.(e);
    },
    onMouseMove: (e: React.MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      child.props.onMouseMove?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setPos(null);
      child.props.onMouseLeave?.(e);
    },
  });

  return (
    <>
      {cloned}
      {pos && (
        <div
          className={cn(
            'pointer-events-none fixed z-50 rounded-md border border-border/70 bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-sm',
            className,
          )}
          style={{ left: pos.x + (offset.x ?? 12), top: pos.y + (offset.y ?? 12) }}
        >
          {content}
        </div>
      )}
    </>
  );
}
