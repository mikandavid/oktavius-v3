import { cn } from '../lib/utils';

export function SplitViewSeparator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex w-3 shrink-0 items-stretch justify-center',
        'before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-border/50',
        'after:absolute after:inset-y-0 after:left-0 after:w-full after:cursor-col-resize',
        'focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2',
        'data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:h-3',
        'data-[panel-group-direction=vertical]:before:inset-x-0 data-[panel-group-direction=vertical]:before:top-1/2',
        'data-[panel-group-direction=vertical]:before:h-px data-[panel-group-direction=vertical]:before:w-full',
        'data-[panel-group-direction=vertical]:before:-translate-y-1/2 data-[panel-group-direction=vertical]:before:translate-x-0',
        'data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-0',
        'data-[panel-group-direction=vertical]:after:h-full data-[panel-group-direction=vertical]:after:cursor-row-resize',
        className,
      )}
    />
  );
}
