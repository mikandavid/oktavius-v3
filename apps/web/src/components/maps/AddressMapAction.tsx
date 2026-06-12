import type { ComponentProps } from 'react';

import { GoogleMapsPreviewButton } from './GoogleMapsDialog';
import { buildGoogleMapsSearchUrl, buildGoogleMapsSearchUrlFromAddress } from './googleMapsEmbed';

type StructuredAddressInput = Parameters<typeof buildGoogleMapsSearchUrlFromAddress>[0];

type AddressMapActionProps = {
  url: string | null;
  label?: string;
  title?: string;
  className?: string;
} & Pick<ComponentProps<typeof GoogleMapsPreviewButton>, 'className'>;

export function buildStructuredAddressMapsUrl(address: StructuredAddressInput): string | null {
  return buildGoogleMapsSearchUrlFromAddress(address);
}

export function buildPlaceMapsUrl(
  place: string | null | undefined,
  context?: string | null,
): string | null {
  const query = [place?.trim(), context?.trim()].filter(Boolean).join(', ');
  return buildGoogleMapsSearchUrl(query);
}

export function AddressMapAction({
  url,
  label = 'View map',
  title = 'Map preview',
  className,
}: AddressMapActionProps) {
  if (!url) return null;

  return <GoogleMapsPreviewButton url={url} label={label} title={title} className={className} />;
}
