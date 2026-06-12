import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  buttonVariants,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@oktavius/base-ui';

import {
  getLocationMapsSearchUrl,
  LocationSitesDetailList,
} from '@/components/layout/LocationSitesDetailList';
import { GlobeIcon, LocationIcon } from '@/lib/icons';
import { useActiveLocation } from '@/lib/locations/ActiveLocationContext';
import type { LocationDetailItem } from '@/lib/locations/types';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useOptionalOsirisRuntime } from '@/runtime/osiris/useOsirisRuntime';

function osirisSiteToLocationDetail(site: {
  id: string;
  name: string;
  isActive?: boolean;
}): LocationDetailItem {
  return {
    id: site.id,
    name: site.name,
    isActive: site.isActive ?? true,
    branchCode: null,
    designation: null,
    locality: null,
    category: null,
    phone: null,
    mobilePhone: null,
    fax: null,
    companyName: null,
    email: null,
    street: null,
    postalCode: null,
  };
}

function LocationSingleSitePanel({
  item,
  otherLocations,
  onEdit,
}: {
  item: LocationDetailItem;
  otherLocations: LocationDetailItem[];
  onEdit: () => void;
}) {
  const listLocations = useMemo(() => [item, ...otherLocations], [item, otherLocations]);
  const mapsUrl = getLocationMapsSearchUrl(item);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden
          >
            <LocationIcon size={20} weight="duotone" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold leading-tight text-foreground">Active location</h2>
            <p className="text-xs leading-snug text-muted-foreground">
              {listLocations.length} accessible {listLocations.length === 1 ? 'site' : 'sites'}
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <LocationSitesDetailList locations={listLocations} emphasizedSiteId={item.id} />
      </div>

      <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border px-4 py-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onEdit}
        >
          Manage locations
        </Button>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'cta', size: 'sm' }), 'w-full sm:w-auto')}
          >
            Get directions
          </a>
        ) : null}
      </footer>
    </div>
  );
}

function LocationAllSitesPanel({
  locations,
  footer,
}: {
  locations: LocationDetailItem[];
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden
          >
            <GlobeIcon size={20} weight="duotone" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2 className="text-sm font-semibold leading-tight text-foreground">All locations</h2>
            <p className="text-xs leading-snug text-muted-foreground">
              Viewing data across {locations.length} sites
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <LocationSitesDetailList locations={locations} />
      </div>

      {footer ? (
        <footer className="shrink-0 border-t border-border px-4 py-3">{footer}</footer>
      ) : null}
    </div>
  );
}

export function ActiveLocationInfoButton({ className }: { className?: string }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [open, setOpen] = useState(false);
  const osirisRuntime = useOptionalOsirisRuntime();
  const activeLocationState = useActiveLocation();
  const locations = useMemo(
    () =>
      osirisRuntime
        ? (osirisRuntime.locationAccess?.sites ?? []).map(osirisSiteToLocationDetail)
        : activeLocationState.locations,
    [activeLocationState.locations, osirisRuntime],
  );
  const activeLocationId = osirisRuntime
    ? osirisRuntime.activeSiteId
    : activeLocationState.activeLocationId;
  const viewAllLocations = osirisRuntime
    ? Boolean(osirisRuntime.locationAccess?.canViewAllSites && !osirisRuntime.activeSiteId)
    : activeLocationState.viewAllLocations;

  const selectedDetail = viewAllLocations
    ? null
    : (locations.find((location) => location.id === activeLocationId) ?? locations[0] ?? null);

  const otherLocationDetails = useMemo(() => {
    if (!selectedDetail) return [];
    return locations.filter((location) => location.id !== selectedDetail.id);
  }, [locations, selectedDetail]);

  const triggerButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        'h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      aria-label="View active location details"
    >
      <LocationIcon size={16} aria-hidden />
    </Button>
  );

  const manageFooter = (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        setOpen(false);
        void navigate('/settings');
      }}
    >
      Manage locations
    </Button>
  );

  const singlePanel =
    selectedDetail && !viewAllLocations ? (
      <LocationSingleSitePanel
        item={selectedDetail}
        otherLocations={otherLocationDetails}
        onEdit={() => {
          setOpen(false);
          void navigate('/settings');
        }}
      />
    ) : null;

  const allSitesPanel = viewAllLocations ? (
    <LocationAllSitesPanel locations={locations} footer={manageFooter} />
  ) : null;

  const fallbackPanel = (
    <>
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold leading-none text-foreground">Location</h3>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">No location selected.</p>
        {manageFooter}
      </div>
    </>
  );

  const panelBody = singlePanel ?? allSitesPanel ?? fallbackPanel;

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Location details</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panelBody}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex max-h-[min(85vh,32rem)] w-[min(92vw,22.5rem)] flex-col overflow-hidden p-0"
        sideOffset={6}
      >
        {panelBody}
      </PopoverContent>
    </Popover>
  );
}
