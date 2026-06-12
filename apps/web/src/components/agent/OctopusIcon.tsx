import { cn } from '@oktavius/base-ui';
import type { ImgHTMLAttributes } from 'react';

type OctopusIconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>;

/** Oktavius agent mascot — matches osiris_erp chat avatar. */
export function OctopusIcon({
  className,
  alt = '',
  width = 32,
  height = 32,
  ...props
}: OctopusIconProps) {
  return (
    <img
      src="/oktavius_shaded.svg"
      alt={alt}
      width={width}
      height={height}
      className={cn('shrink-0 object-contain', className)}
      {...props}
    />
  );
}
