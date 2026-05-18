import { cn } from '@oktavius/base-ui';

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-sidebar-border/70 bg-sidebar-foreground/[0.08]">
        <div className="absolute inset-[5px] rounded-[4px] border border-sidebar-foreground/60" />
        <div className="absolute left-[7px] top-[7px] h-2.5 w-2.5 rounded-sm bg-sidebar-foreground/80" />
        <div className="absolute bottom-[6px] right-[6px] h-1.5 w-1.5 rounded-full bg-sidebar-foreground/55" />
      </div>
    </div>
  );
}
