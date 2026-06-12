import { Badge, cn } from '@oktavius/base-ui';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';
import { buildGoogleMapsSearchUrl } from '@/components/maps/googleMapsEmbed';
import { EmailIcon, LocationIcon, PhoneIcon } from '@/lib/icons';
import type { LocationDetailItem } from '@/lib/locations/types';

function formatAddressLine(item: LocationDetailItem): string {
  const parts: string[] = [];
  if (item.street?.trim()) parts.push(item.street.trim());
  const cityPart = [item.postalCode?.trim(), item.locality?.trim()].filter(Boolean).join(' ');
  if (cityPart) parts.push(cityPart);
  return parts.join(', ');
}

function telHref(raw: string): string | null {
  const compact = raw.replace(/[\s()-]/g, '');
  if (!compact) return null;
  return `tel:${compact}`;
}

export function getLocationMapsSearchUrl(item: LocationDetailItem): string | null {
  const query = formatAddressLine(item).trim();
  return buildGoogleMapsSearchUrl(query);
}

/** Rich contact-card rows for location popovers and detail panels — not settings summaries. */
export function LocationSiteListRow({
  item,
  profileLoadFailed = false,
  nameLinkTo,
  className,
}: {
  item: LocationDetailItem;
  profileLoadFailed?: boolean;
  nameLinkTo?: string;
  className?: string;
}) {
  const mapsQuery = formatAddressLine(item);
  const mapsUrl = buildGoogleMapsSearchUrl(mapsQuery);
  const hasDirections = Boolean(mapsUrl);
  const subtitleCode = item.branchCode?.trim();
  const designation = item.designation?.trim();
  const phoneDisplay = item.phone?.trim() || item.mobilePhone?.trim();
  const telLink = phoneDisplay ? telHref(phoneDisplay) : null;
  const email = item.email?.trim();
  const streetLine = item.street?.trim();
  const cityLine = [item.postalCode?.trim(), item.locality?.trim()].filter(Boolean).join(' ');
  const hasAddressBlock = Boolean(streetLine || cityLine);
  const categoryLabel = item.category?.trim();
  const hasContact =
    hasAddressBlock || Boolean(phoneDisplay) || Boolean(email) || Boolean(item.companyName?.trim());

  const metaLine = [subtitleCode, designation]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' · ');

  return (
    <div className={cn('flex gap-3 py-3', className)}>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {nameLinkTo ? (
            <Link
              to={nameLinkTo}
              className="rounded-sm text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-sm font-medium text-foreground">{item.name}</span>
          )}
          {!item.isActive ? (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
              Inactive
            </Badge>
          ) : null}
          {categoryLabel ? (
            <Badge
              variant="secondary"
              className="max-w-[9rem] truncate px-1.5 py-0 text-[10px] font-normal"
            >
              {categoryLabel}
            </Badge>
          ) : null}
        </div>
        {metaLine ? <p className="text-xs leading-snug text-muted-foreground">{metaLine}</p> : null}
        {item.companyName?.trim() ? (
          <p className="text-xs font-medium text-foreground">{item.companyName.trim()}</p>
        ) : null}
        {hasAddressBlock ? (
          <div className="flex gap-2">
            <LocationIcon className="mt-0.5 shrink-0 text-muted-foreground" size={14} aria-hidden />
            <div className="min-w-0 space-y-0.5 text-xs leading-snug text-foreground">
              {streetLine ? <p>{streetLine}</p> : null}
              {cityLine ? <p>{cityLine}</p> : null}
            </div>
          </div>
        ) : null}
        {phoneDisplay ? (
          <div className="flex items-start gap-2">
            <PhoneIcon className="mt-0.5 shrink-0 text-muted-foreground" size={14} aria-hidden />
            <div className="min-w-0 text-xs">
              {telLink ? (
                <a href={telLink} className="break-all text-primary hover:underline">
                  {phoneDisplay}
                </a>
              ) : (
                <span className="text-foreground">{phoneDisplay}</span>
              )}
            </div>
          </div>
        ) : null}
        {email ? (
          <div className="flex items-start gap-2">
            <EmailIcon className="mt-0.5 shrink-0 text-muted-foreground" size={14} aria-hidden />
            <a href={`mailto:${email}`} className="break-all text-xs text-primary hover:underline">
              {email}
            </a>
          </div>
        ) : null}
        {!hasContact ? (
          <p className="text-xs leading-snug text-muted-foreground">
            {profileLoadFailed
              ? 'Location details could not be loaded.'
              : 'No contact details on file.'}
          </p>
        ) : null}
      </div>
      {hasDirections ? (
        <GoogleMapsPreviewButton
          url={mapsUrl!}
          label="View map"
          title={`Map preview for ${item.name}`}
          className="shrink-0 self-start"
        />
      ) : null}
    </div>
  );
}

export function LocationSitesDetailList({
  locations,
  emphasizedSiteId,
  profileLoadFailed = false,
  className,
  getLocationDetailPath,
}: {
  locations: LocationDetailItem[];
  emphasizedSiteId?: string | null;
  profileLoadFailed?: boolean;
  className?: string;
  getLocationDetailPath?: (locationId: string) => string;
}) {
  const ordered = useMemo(() => {
    if (!emphasizedSiteId) return locations;
    const index = locations.findIndex((location) => location.id === emphasizedSiteId);
    if (index <= 0) return locations;
    const emphasized = locations[index];
    const rest = locations.filter((location) => location.id !== emphasizedSiteId);
    return [emphasized, ...rest];
  }, [locations, emphasizedSiteId]);

  return (
    <div className={cn('mt-1 border-t border-border', className)}>
      {ordered.map((location) => {
        const emphasized = Boolean(emphasizedSiteId && location.id === emphasizedSiteId);
        return (
          <div
            key={location.id}
            className={cn(
              'border-b border-border last:border-b-0',
              emphasized && '-mx-4 bg-muted/45 px-4',
            )}
            aria-current={emphasized ? 'true' : undefined}
          >
            <LocationSiteListRow
              item={location}
              profileLoadFailed={profileLoadFailed}
              nameLinkTo={getLocationDetailPath?.(location.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
