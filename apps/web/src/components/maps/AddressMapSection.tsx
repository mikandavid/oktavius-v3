import { cn } from '@oktavius/base-ui';

import { GoogleMapsPreview } from './GoogleMapsDialog';

type AddressMapSectionProps = {
  title: string;
  addressLines: Array<string | null | undefined>;
  url: string | null;
  className?: string;
  mapHeight?: number;
};

export function AddressMapSection({
  title,
  addressLines,
  url,
  className,
  mapHeight = 220,
}: AddressMapSectionProps) {
  const visibleAddressLines = addressLines.map((line) => line?.trim()).filter(Boolean);

  if (!url) return null;

  return (
    <div className={cn('grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(260px,1.4fr)]', className)}>
      <div className="rounded-card border border-border/60 bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
          {title}
        </p>
        <address className="mt-2 not-italic text-sm font-medium leading-6 text-foreground">
          {visibleAddressLines.length > 0
            ? visibleAddressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))
            : 'Address not available'}
        </address>
      </div>
      <GoogleMapsPreview url={url} title={title} height={mapHeight} showHeader={false} />
    </div>
  );
}
