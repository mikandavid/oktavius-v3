import { cn } from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { OctopusIcon } from '@/components/agent/OctopusIcon';

type BrandMarkProps = {
  className?: string;
  iconClassName?: string;
  logoUrl?: string | null;
};

/** Org / product mark for sidebar and mobile header. */
export function BrandMark({ className, iconClassName, logoUrl }: BrandMarkProps) {
  const normalizedLogoUrl = logoUrl?.trim() || null;
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const resolvedLogoUrl =
    normalizedLogoUrl && failedLogoUrl !== normalizedLogoUrl ? normalizedLogoUrl : null;

  useEffect(() => {
    setFailedLogoUrl(null);
  }, [normalizedLogoUrl]);

  return (
    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center', className)}>
      {resolvedLogoUrl ? (
        <img
          src={resolvedLogoUrl}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          decoding="async"
          className={cn('h-7 w-7 object-contain', iconClassName)}
          onError={() => setFailedLogoUrl(resolvedLogoUrl)}
        />
      ) : (
        <OctopusIcon className={cn('h-7 w-7 object-contain', iconClassName)} aria-hidden="true" />
      )}
    </div>
  );
}
