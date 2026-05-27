import { cn } from '@oktavius/base-ui';

import { OctopusIcon } from '@/components/agent/OctopusIcon';

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
};

/** Org / product mark — Oktavius octopus icon for sidebar and mobile header. */
export function BrandMark({ className, iconClassName }: BrandMarkProps) {
  return (
    <div
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md',
        className,
      )}
    >
      <OctopusIcon className={cn('h-7 w-7 object-contain', iconClassName)} aria-hidden="true" />
    </div>
  );
}
